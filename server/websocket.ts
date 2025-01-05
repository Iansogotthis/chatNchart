
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
    path: '/ws/projects',
  });

  server.on('upgrade', async (request, socket, head) => {
    try {
      const cookieString = request.headers.cookie;
      if (!cookieString) {
        socket.destroy();
        return;
      }
          console.error('No cookie found');
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

              (req as any).userId = userId;
              (req as any).username = user.username;

              callback(true);
              resolve();
            } catch (error) {
              console.error('Error fetching user:', error);
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
        accessLevel: ws.accessLevel || 'viewer'
      });

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          const clients = projectRooms.get(projectId);

          if (clients && message.type === 'chat') {
            const [savedMessage] = await db
              .insert(chatMessages)
              .values({
                projectId,
                senderId: userId,
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

            clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(outgoingMessage));
              }
            });
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
          broadcastPresence(projectId, {
            type: 'presence',
            userId,
            username,
            status: 'offline',
            accessLevel: ws.accessLevel || 'viewer'
          });
        }
      });

    } catch (error) {
      console.error('Error in WebSocket connection:', error);
      ws.close(1011, 'Internal server error');
    }
  });

  return wss;
}
