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
}

interface ExtendedSessionData extends SessionData {
  passport?: {
    user: number;
  };
}

interface ChatMessage {
  projectId: number;
  userId: number;
  content: string;
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

        // Parse cookies into an object
        const cookies = Object.fromEntries(
          cookieString.split(';')
            .map(cookie => cookie.trim().split('='))
            .map(([key, value]) => [key, decodeURIComponent(value)])
        );

        // Get session ID from connect.sid cookie
        const connectSid = cookies['connect.sid'];
        if (!connectSid) {
          console.error('No connect.sid cookie found');
          callback(false, 401, 'Unauthorized');
          return;
        }

        const sessionId = connectSid.split('.')[0].replace('s:', '');

        // Verify session and user
        return new Promise((resolve) => {
          sessionStore.get(sessionId, (err: any, session: ExtendedSessionData | null) => {
            if (err) {
              console.error('Session store error:', err);
              callback(false, 500, 'Internal server error');
              resolve();
              return;
            }

            if (!session) {
              console.error('No session found for ID:', sessionId);
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

            // Store userId in request object for later use
            (info.req as any).userId = userId;
            callback(true);
            resolve();
          });
        });

      } catch (error) {
        console.error('WebSocket verification error:', error);
        callback(false, 500, 'Internal server error');
      }
    }
  });

  // Store project rooms as a map of projectId to set of WebSocket connections
  const projectRooms = new Map<number, Set<ExtendedWebSocket>>();

  // Ping/Pong to keep connections alive
  const interval = setInterval(() => {
    wss.clients.forEach((ws: ExtendedWebSocket) => {
      if (!ws.isAlive) {
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  wss.on('connection', async (ws: ExtendedWebSocket, req) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    try {
      // Extract project ID from URL path (/ws/projects/:id/chat)
      const match = req.url?.match(/\/(\d+)\/chat/);
      if (!match) {
        console.error('Invalid WebSocket URL:', req.url);
        ws.close(1002, 'Invalid project ID');
        return;
      }

      const projectId = parseInt(match[1]);
      const userId = (req as any).userId;

      // Store IDs in WebSocket instance
      ws.userId = userId;
      ws.projectId = projectId;

      // Check if user is either the project owner or a collaborator
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

      // Add connection to project room
      if (!projectRooms.has(projectId)) {
        projectRooms.set(projectId, new Set());
      }
      projectRooms.get(projectId)?.add(ws);

      console.log(`User ${userId} connected to project ${projectId} chat`);

      // Send connection success message
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected successfully'
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
          }
        })
        .from(chatMessages)
        .where(eq(chatMessages.projectId, projectId))
        .leftJoin(users, eq(chatMessages.senderId, users.id))
        .orderBy(chatMessages.createdAt)
        .limit(50);

      // Send recent messages to the newly connected client
      recentMessages.forEach(message => {
        ws.send(JSON.stringify(message));
      });

      ws.on('message', async (data) => {
        try {
          const message: ChatMessage = JSON.parse(data.toString());

          // Verify the message is for the correct project and from the authenticated user
          if (message.projectId !== projectId || message.userId !== userId) {
            console.error('Invalid message data:', message);
            ws.send(JSON.stringify({ error: 'Invalid message data' }));
            return;
          }

          // Insert message into database
          const [savedMessage] = await db
            .insert(chatMessages)
            .values({
              projectId: message.projectId,
              senderId: message.userId,
              content: message.content.trim(),
            })
            .returning();

          // Get sender details
          const [sender] = await db
            .select({
              id: users.id,
              username: users.username,
            })
            .from(users)
            .where(eq(users.id, message.userId))
            .limit(1);

          // Broadcast message to all clients in the same project room
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
        } catch (error) {
          console.error('Error processing message:', error);
          ws.send(JSON.stringify({ error: 'Failed to process message' }));
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        if (ws.projectId) {
          projectRooms.get(ws.projectId)?.delete(ws);
          if (projectRooms.get(ws.projectId)?.size === 0) {
            projectRooms.delete(ws.projectId);
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