import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { db } from '../db';
import { chatMessages, users, projectCollaborators, projects } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { sessionStore } from './session';
import type { SessionData } from 'express-session';

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  userId?: number;
  projectId?: number;
  username?: string;
  accessLevel?: string;
}

interface ExtendedSessionData extends SessionData {
  passport?: {
    user: number;
  };
}

interface ChatMessage {
  type: 'chat';
  projectId: number;
  userId: number;
  content: string;
}

interface CollaboratorPresence {
  type: 'presence';
  userId: number;
  username: string;
  status: 'online' | 'offline';
  accessLevel: string;
}

interface ProjectStateChange {
  type: 'project_state';
  projectId: number;
  state: 'active' | 'paused';
  updatedBy: {
    id: number;
    username: string;
  };
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws/projects',
    verifyClient: async ({ req }, callback) => {
      try {
        const cookieString = req.headers.cookie;
        if (!cookieString) {
          console.error('No cookie found in WebSocket request');
          callback(false, 401, 'Unauthorized');
          return;
        }

        const cookies = Object.fromEntries(
          cookieString.split(';')
            .map(cookie => cookie.trim().split('='))
            .map(([key, value]) => [key, decodeURIComponent(value)])
        );

        const connectSid = cookies['connect.sid'];
        if (!connectSid) {
          console.error('No connect.sid cookie found');
          callback(false, 401, 'Unauthorized');
          return;
        }

        const sessionId = connectSid.split('.')[0].replace('s:', '');

        // Use Promise to handle session verification
        return new Promise<void>((resolve) => {
          sessionStore.get(sessionId, async (err: any, session: SessionData | null) => {
            if (err || !session) {
              console.error('Session error:', err || 'No session found');
              callback(false, 401, 'Unauthorized');
              resolve();
              return;
            }

            const extendedSession = session as ExtendedSessionData;
            const userId = extendedSession.passport?.user;
            if (!userId) {
              console.error('No user ID in session');
              callback(false, 401, 'Unauthorized');
              resolve();
              return;
            }

            try {
              const [user] = await db.select({
                id: users.id,
                username: users.username,
              })
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);

              if (!user) {
                callback(false, 401, 'User not found');
                resolve();
                return;
              }

              // Store user info in request object
              (req as any).userId = userId;
              (req as any).username = user.username;

              callback(true);
              resolve();
            } catch (error) {
              console.error('Error fetching user details:', error);
              callback(false, 500, 'Internal server error');
              resolve();
            }
          });
        });
      } catch (error) {
        console.error('WebSocket verification error:', error);
        callback(false, 500, 'Internal server error');
      }
    }
  });

  const projectRooms = new Map<number, Set<ExtendedWebSocket>>();

  function cleanupClosedConnections() {
    // Convert Map.entries() to array before iteration
    Array.from(projectRooms.entries()).forEach(([projectId, clients]) => {
      Array.from(clients).forEach(client => {
        if (!client.isAlive) {
          clients.delete(client);
          if (clients.size === 0) {
            projectRooms.delete(projectId);
          }
          broadcastPresence(projectId, {
            type: 'presence',
            userId: client.userId!,
            username: client.username!,
            status: 'offline',
            accessLevel: client.accessLevel || 'viewer'
          });
        }
        client.isAlive = false;
        client.ping();
      });
    });
  }

  const interval = setInterval(cleanupClosedConnections, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  function broadcastPresence(projectId: number, presence: CollaboratorPresence) {
    const clients = projectRooms.get(projectId);
    if (clients) {
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(presence));
        }
      });
    }
  }

  function getOnlineCollaborators(projectId: number): CollaboratorPresence[] {
    const clients = projectRooms.get(projectId);
    if (!clients) return [];

    return Array.from(clients)
      .filter(ws => ws.userId && ws.username && ws.readyState === WebSocket.OPEN)
      .map(ws => ({
        type: 'presence',
        userId: ws.userId!,
        username: ws.username!,
        status: 'online',
        accessLevel: ws.accessLevel || 'viewer'
      }));
  }

  wss.on('connection', async (ws: ExtendedWebSocket, req) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    try {
      const match = req.url?.match(/\/(\d+)\/chat/);
      if (!match) {
        console.error('Invalid WebSocket URL:', req.url);
        ws.close(1002, 'Invalid project ID');
        return;
      }

      const projectId = parseInt(match[1]);
      const userId = (req as any).userId;
      const username = (req as any).username;

      if (!userId || !username) {
        console.error('Missing user information');
        ws.close(1011, 'Missing user information');
        return;
      }

      ws.userId = userId;
      ws.projectId = projectId;
      ws.username = username;

      // Get user's access level for this project
      const [projectAccess] = await db
        .select({
          accessLevel: projectCollaborators.accessLevel,
        })
        .from(projectCollaborators)
        .where(
          and(
            eq(projectCollaborators.projectId, projectId),
            eq(projectCollaborators.userId, userId)
          )
        )
        .limit(1);

      ws.accessLevel = projectAccess?.accessLevel || 'viewer';

      // Check project access
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!project) {
        console.error('Project not found:', projectId);
        ws.close(1003, 'Project not found');
        return;
      }

      const isOwner = project.userId === userId;
      const isCollaborator = projectAccess !== undefined;

      if (!isOwner && !isCollaborator) {
        console.error(`User ${userId} attempted to access unauthorized project ${projectId}`);
        ws.close(1003, 'Unauthorized');
        return;
      }

      if (!projectRooms.has(projectId)) {
        projectRooms.set(projectId, new Set());
      }
      projectRooms.get(projectId)?.add(ws);

      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected successfully',
        accessLevel: ws.accessLevel
      }));

      // Broadcast presence
      broadcastPresence(projectId, {
        type: 'presence',
        userId,
        username,
        status: 'online',
        accessLevel: ws.accessLevel
      });

      // Send current online collaborators
      ws.send(JSON.stringify({
        type: 'collaborators',
        collaborators: getOnlineCollaborators(projectId)
      }));

      // Load and send recent messages
      const recentMessages = await db
        .select({
          id: chatMessages.id,
          content: chatMessages.content,
          timestamp: chatMessages.createdAt,
          sender: {
            id: users.id,
            username: users.username,
          },
        })
        .from(chatMessages)
        .where(eq(chatMessages.projectId, projectId))
        .leftJoin(users, eq(chatMessages.senderId, users.id))
        .orderBy(chatMessages.createdAt)
        .limit(50);

      ws.send(JSON.stringify({
        type: 'history',
        messages: recentMessages
      }));

      // Handle incoming messages
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());

          switch (message.type) {
            case 'chat': {
              if (!message.content?.trim()) {
                ws.send(JSON.stringify({ type: 'error', error: 'Message content is required' }));
                return;
              }

              if (message.projectId !== projectId || message.userId !== userId) {
                ws.send(JSON.stringify({ type: 'error', error: 'Invalid message data' }));
                return;
              }

              const [savedMessage] = await db
                .insert(chatMessages)
                .values({
                  projectId: message.projectId,
                  senderId: message.userId,
                  content: message.content.trim(),
                })
                .returning();

              const outgoingMessage = {
                type: 'message',
                id: savedMessage.id,
                content: savedMessage.content,
                sender: {
                  id: userId,
                  username
                },
                timestamp: savedMessage.createdAt,
              };

              projectRooms.get(projectId)?.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(outgoingMessage));
                }
              });
              break;
            }

            case 'project_state': {
              if (ws.accessLevel !== 'owner' && ws.accessLevel !== 'admin') {
                ws.send(JSON.stringify({ type: 'error', error: 'Unauthorized to change project state' }));
                return;
              }

              const stateChange: ProjectStateChange = {
                type: 'project_state',
                projectId,
                state: message.state,
                updatedBy: {
                  id: userId,
                  username
                }
              };

              projectRooms.get(projectId)?.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(stateChange));
                }
              });
              break;
            }

            default:
              ws.send(JSON.stringify({ type: 'error', error: 'Unknown message type' }));
          }
        } catch (error) {
          console.error('Error processing message:', error);
          ws.send(JSON.stringify({ type: 'error', error: 'Failed to process message' }));
        }
      });

      ws.on('close', () => {
        if (ws.projectId) {
          projectRooms.get(ws.projectId)?.delete(ws);
          if (projectRooms.get(ws.projectId)?.size === 0) {
            projectRooms.delete(ws.projectId);
          }

          if (ws.userId && ws.username) {
            broadcastPresence(ws.projectId, {
              type: 'presence',
              userId: ws.userId,
              username: ws.username,
              status: 'offline',
              accessLevel: ws.accessLevel || 'viewer'
            });
          }
        }
        console.log(`User ${ws.userId} disconnected from project ${ws.projectId} chat`);
      });

    } catch (error) {
      console.error('Error setting up WebSocket connection:', error);
      ws.close(1011, 'Internal server error');
    }
  });

  return wss;
}