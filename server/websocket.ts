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

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    noServer: true,
  });

  server.on('upgrade', async (request, socket, head) => {
    // Only handle project-related WebSocket connections
    if (!request.url?.startsWith('/ws/projects/')) {
      socket.destroy();
      return;
    }

    try {
      const cookieString = request.headers.cookie;
      if (!cookieString) {
        socket.destroy();
        return;
      }

      const cookies = cookieString.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = decodeURIComponent(value);
        return acc;
      }, {} as Record<string, string>);

      const connectSid = cookies['connect.sid'];
      if (!connectSid) {
        socket.destroy();
        return;
      }

      const sessionId = connectSid.replace('s:', '').split('.')[0];

      sessionStore.get(sessionId, async (err, session) => {
        if (err || !session) {
          socket.destroy();
          return;
        }

        const extendedSession = session as ExtendedSessionData;
        const userId = extendedSession.passport?.user;

        if (!userId) {
          socket.destroy();
          return;
        }

        try {
          const [user] = await db
            .select({
              id: users.id,
              username: users.username,
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

          if (!user) {
            socket.destroy();
            return;
          }

          const match = request.url?.match(/\/ws\/projects\/(\d+)\/chat/);
          if (!match) {
            socket.destroy();
            return;
          }

          const projectId = parseInt(match[1]);

          // Verify project access
          const [collaborator] = await db
            .select({
              accessLevel: projectCollaborators.accessLevel,
            })
            .from(projectCollaborators)
            .where(and(
              eq(projectCollaborators.projectId, projectId),
              eq(projectCollaborators.userId, userId)
            ))
            .limit(1);

          const [project] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1);

          const accessLevel = project?.userId === userId ? 'owner' : collaborator?.accessLevel;

          if (!accessLevel && project?.userId !== userId) {
            socket.destroy();
            return;
          }

          wss.handleUpgrade(request, socket, head, (ws) => {
            const extWs = ws as ExtendedWebSocket;
            extWs.userId = userId;
            extWs.username = user.username;
            extWs.projectId = projectId;
            extWs.accessLevel = accessLevel || 'viewer';
            wss.emit('connection', extWs);
          });
        } catch (error) {
          console.error('Error in WebSocket authentication:', error);
          socket.destroy();
        }
      });
    } catch (error) {
      console.error('WebSocket upgrade error:', error);
      socket.destroy();
    }
  });

  const projectRooms = new Map<number, Set<ExtendedWebSocket>>();

  function broadcastToProject(projectId: number, message: any) {
    const clients = projectRooms.get(projectId);
    if (clients) {
      const messageStr = JSON.stringify(message);
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      });
    }
  }

  wss.on('connection', async (ws: ExtendedWebSocket) => {
    const { projectId, userId, username } = ws;

    if (!projectId || !userId || !username) {
      ws.close(1011, 'Missing connection information');
      return;
    }

    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

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
    broadcastToProject(projectId, {
      type: 'presence',
      userId,
      username,
      status: 'online',
      accessLevel: ws.accessLevel
    });

    // Send current collaborators
    const collaborators = Array.from(projectRooms.get(projectId) || []).map(client => ({
      userId: client.userId,
      username: client.username,
      status: 'online',
      accessLevel: client.accessLevel
    }));

    ws.send(JSON.stringify({
      type: 'collaborators',
      collaborators
    }));

    // Load recent messages
    const recentMessages = await db
      .select({
        id: chatMessages.id,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
        sender: {
          id: users.id,
          username: users.username,
        },
      })
      .from(chatMessages)
      .where(eq(chatMessages.projectId, projectId))
      .leftJoin(users, eq(chatMessages.senderId, users.id))
      .limit(50);

    ws.send(JSON.stringify({
      type: 'history',
      messages: recentMessages
    }));

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'chat': {
            if (!message.content?.trim()) {
              ws.send(JSON.stringify({ type: 'error', error: 'Message content is required' }));
              return;
            }

            const [savedMessage] = await db
              .insert(chatMessages)
              .values({
                projectId,
                senderId: userId,
                content: message.content.trim(),
              })
              .returning();

            broadcastToProject(projectId, {
              type: 'message',
              id: savedMessage.id,
              content: savedMessage.content,
              sender: {
                id: userId,
                username
              },
              timestamp: savedMessage.createdAt,
            });
            break;
          }

          case 'project_state': {
            if (ws.accessLevel !== 'owner' && ws.accessLevel !== 'admin') {
              ws.send(JSON.stringify({ type: 'error', error: 'Unauthorized to change project state' }));
              return;
            }

            await db
              .update(projects)
              .set({ status: message.state })
              .where(eq(projects.id, projectId));

            broadcastToProject(projectId, {
              type: 'project_state',
              projectId,
              state: message.state,
              updatedBy: {
                id: userId,
                username
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
      if (projectId) {
        projectRooms.get(projectId)?.delete(ws);
        if (projectRooms.get(projectId)?.size === 0) {
          projectRooms.delete(projectId);
        }

        broadcastToProject(projectId, {
          type: 'presence',
          userId,
          username,
          status: 'offline',
          accessLevel: ws.accessLevel
        });
      }
    });
  });

  // Modified interval cleanup to handle ExtendedWebSocket type
  const cleanupInterval = setInterval(() => {
    (wss.clients as Set<ExtendedWebSocket>).forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(cleanupInterval);
  });

  return wss;
}