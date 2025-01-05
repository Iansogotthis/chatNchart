
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
    path: '/ws/projects'
  });

  server.on('upgrade', (request, socket, head) => {
    try {
      const cookieString = request.headers.cookie;
      if (!cookieString) {
        socket.destroy();
        return;
      }

      const cookies = Object.fromEntries(
        cookieString.split(';')
          .map(cookie => cookie.trim().split('='))
          .map(([key, value]) => [key, decodeURIComponent(value)])
      );

      const connectSid = cookies['connect.sid'];
      if (!connectSid) {
        socket.destroy();
        return;
      }

      const sessionId = connectSid.split('.')[0].replace('s:', '');
      
      sessionStore.get(sessionId, (err, session) => {
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

        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      });
    } catch (error) {
      console.error('WebSocket upgrade error:', error);
      socket.destroy();
    }
  });

  const projectRooms = new Map<number, Set<ExtendedWebSocket>>();

  wss.on('connection', async (ws: ExtendedWebSocket, req) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    try {
      const match = req.url?.match(/\/(\d+)\/chat/);
      if (!match) {
        ws.close(1002, 'Invalid project ID');
        return;
      }

      const projectId = parseInt(match[1]);
      const userId = (req as any).userId;
      const username = (req as any).username;

      if (!userId || !username) {
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

      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected successfully'
      }));

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString()) as ChatMessage;
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
        }
      });

    } catch (error) {
      console.error('Error in WebSocket connection:', error);
      ws.close(1011, 'Internal server error');
    }
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws: ExtendedWebSocket) => {
      if (!ws.isAlive) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}
