import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { db } from '../db';
import { chatMessages, users, projectCollaborators, projects } from '../db/schema';
import { eq, and, or } from 'drizzle-orm';
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
    verifyClient: async (info, callback) => {
      try {
        const cookieString = info.req.headers.cookie;
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
          sessionStore.get(sessionId, async (err: any, session: ExtendedSessionData | undefined | null) => {
            if (err || !session) {
              console.error('Session error:', err || 'No session found');
              callback(false, 401, 'Unauthorized');
              resolve();
              return;
            }

            const userId = session.passport?.user;
            if (!userId) {
              console.error('No user ID in session');
              callback(false, 401, 'Unauthorized');
              resolve();
              return;
            }

            try {
              // Get user details for presence information
              const [user] = await db
                .select({
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
              (info.req as any).userId = userId;
              (info.req as any).username = user.username;

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

  // Ping/Pong to keep connections alive
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const extWs = ws as ExtendedWebSocket;
      if (!extWs.isAlive) {
        extWs.terminate();
        return;
      }
      extWs.isAlive = false;
      extWs.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  // Broadcast presence to all clients in a project room
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

  // Get all online collaborators in a project
  function getOnlineCollaborators(projectId: number): CollaboratorPresence[] {
    const clients = projectRooms.get(projectId);
    if (!clients) return [];

    return Array.from(clients)
      .filter(ws => ws.userId && ws.username)
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
      const [hasAccess] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(
          or(
            eq(projects.userId, userId),
            and(
              eq(projectCollaborators.projectId, projectId),
              eq(projectCollaborators.userId, userId)
            )
          )
        )
        .leftJoin(projectCollaborators, eq(projects.id, projectCollaborators.projectId))
        .limit(1);

      if (!hasAccess) {
        console.error(`User ${userId} attempted to access unauthorized project ${projectId}`);
        ws.close(1003, 'Unauthorized');
        return;
      }

      // Add to project room
      if (!projectRooms.has(projectId)) {
        projectRooms.set(projectId, new Set());
      }
      projectRooms.get(projectId)?.add(ws);

      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected successfully'
      }));

      // Broadcast user's presence to other collaborators
      broadcastPresence(projectId, {
        type: 'presence',
        userId,
        username: username,
        status: 'online',
        accessLevel: ws.accessLevel
      });

      // Send current online collaborators to the new connection
      ws.send(JSON.stringify({
        type: 'collaborators',
        collaborators: getOnlineCollaborators(projectId)
      }));

      // Load recent messages
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

      recentMessages.forEach(message => {
        ws.send(JSON.stringify(message));
      });

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());

          switch (message.type) {
            case 'chat':
              if (message.projectId !== projectId || message.userId !== userId) {
                ws.send(JSON.stringify({ error: 'Invalid message data' }));
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

              const [sender] = await db
                .select({
                  id: users.id,
                  username: users.username,
                })
                .from(users)
                .where(eq(users.id, message.userId))
                .limit(1);

              const outgoingMessage = {
                id: savedMessage.id,
                content: savedMessage.content,
                sender,
                timestamp: savedMessage.createdAt,
              };

              projectRooms.get(projectId)?.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(outgoingMessage));
                }
              });
              break;

            case 'project_state':
              // Only project owner or admin can change project state
              if (ws.accessLevel !== 'owner' && ws.accessLevel !== 'admin') {
                ws.send(JSON.stringify({ error: 'Unauthorized to change project state' }));
                return;
              }

              const stateChange: ProjectStateChange = {
                type: 'project_state',
                projectId,
                state: message.state,
                updatedBy: {
                  id: userId,
                  username: username
                }
              };

              projectRooms.get(projectId)?.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(stateChange));
                }
              });
              break;
          }
        } catch (error) {
          console.error('Error processing message:', error);
          ws.send(JSON.stringify({ error: 'Failed to process message' }));
        }
      });

      ws.on('close', () => {
        if (ws.projectId) {
          projectRooms.get(ws.projectId)?.delete(ws);
          if (projectRooms.get(ws.projectId)?.size === 0) {
            projectRooms.delete(ws.projectId);
          }

          // Broadcast offline status
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