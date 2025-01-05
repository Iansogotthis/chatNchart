import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { db } from '../db';
import { chatMessages, users, projectCollaborators, projects } from '../db/schema';
import { eq, and, or } from 'drizzle-orm';
import { sessionStore } from './session';

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
        // Get session ID from cookie
        const cookieString = info.req.headers.cookie;
        if (!cookieString) {
          console.error('No cookie found in WebSocket request');
          callback(false, 401, 'Unauthorized');
          return;
        }

        // Parse session ID from connect.sid cookie
        const sessionCookie = cookieString
          .split(';')
          .find(c => c.trim().startsWith('connect.sid='));

        if (!sessionCookie) {
          console.error('No session cookie found');
          callback(false, 401, 'Unauthorized');
          return;
        }

        const sessionId = decodeURIComponent(sessionCookie.split('=')[1]);

        // Verify session exists in store
        sessionStore.get(sessionId, (err, session) => {
          if (err || !session) {
            console.error('Invalid session:', err || 'Session not found');
            callback(false, 401, 'Unauthorized');
            return;
          }

          const userId = session.passport?.user;
          if (!userId) {
            console.error('No user ID in session');
            callback(false, 401, 'Unauthorized');
            return;
          }

          // Add user ID to request for later use
          (info.req as any).userId = userId;
          callback(true);
        });

      } catch (error) {
        console.error('WebSocket verification error:', error);
        callback(false, 500, 'Internal server error');
      }
    }
  });

  // Store project rooms as a map of projectId to set of WebSocket connections
  const projectRooms = new Map<number, Set<WebSocket>>();

  wss.on('connection', async (ws, req) => {
    // Extract project ID from URL path (/ws/projects/:id/chat)
    const match = req.url?.match(/\/(\d+)\/chat/);
    if (!match) {
      console.error('Invalid WebSocket URL:', req.url);
      ws.close(1002, 'Invalid project ID');
      return;
    }

    const projectId = parseInt(match[1]);
    const userId = (req as any).userId;

    try {
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
        projectRooms.get(projectId)?.delete(ws);
        if (projectRooms.get(projectId)?.size === 0) {
          projectRooms.delete(projectId);
        }
        console.log(`User ${userId} disconnected from project ${projectId} chat`);
      });

    } catch (error) {
      console.error('Error setting up WebSocket connection:', error);
      ws.close(1011, 'Internal server error');
    }
  });

  return wss;
}