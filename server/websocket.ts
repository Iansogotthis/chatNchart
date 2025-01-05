import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { db } from '@db';
import { chatMessages, users, projectCollaborators, projects } from '@db/schema';
import { eq, and, or } from 'drizzle-orm';

interface ChatMessage {
  projectId: number;
  userId: number;
  content: string;
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws/projects',
    verifyClient: (info, callback) => {
      // Extract session from request
      const session = (info.req as any).session;
      const isAuthenticated = session?.passport?.user;

      if (!isAuthenticated) {
        callback(false, 401, 'Unauthorized');
        return;
      }

      callback(true);
    }
  });

  // Store project rooms as a map of projectId to set of WebSocket connections
  const projectRooms = new Map<number, Set<WebSocket>>();

  wss.on('connection', async (ws, req) => {
    // Extract project ID from URL path (/ws/projects/:id/chat)
    const match = req.url?.match(/\/(\d+)\/chat/);
    if (!match) {
      console.error('Invalid WebSocket URL:', req.url);
      ws.close();
      return;
    }

    const projectId = parseInt(match[1]);
    const userId = (req as any).session?.passport?.user;

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
        ws.close();
        return;
      }

      // Add connection to project room
      if (!projectRooms.has(projectId)) {
        projectRooms.set(projectId, new Set());
      }
      projectRooms.get(projectId)?.add(ws);

      console.log(`User ${userId} connected to project ${projectId} chat`);

      ws.on('message', async (data) => {
        try {
          const message: ChatMessage = JSON.parse(data.toString());

          // Verify the message is for the correct project and from the authenticated user
          if (message.projectId !== projectId || message.userId !== userId) {
            console.error('Invalid message data:', message);
            return;
          }

          // Insert message into database
          const [savedMessage] = await db
            .insert(chatMessages)
            .values({
              projectId: message.projectId,
              senderId: message.userId,
              content: message.content,
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
            sender: sender,
            timestamp: savedMessage.createdAt,
          };

          projectRooms.get(projectId)?.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(outgoingMessage));
            }
          });
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });

      ws.on('close', () => {
        // Remove connection from project room
        projectRooms.get(projectId)?.delete(ws);
        if (projectRooms.get(projectId)?.size === 0) {
          projectRooms.delete(projectId);
        }
        console.log(`User ${userId} disconnected from project ${projectId} chat`);
      });

    } catch (error) {
      console.error('Error setting up WebSocket connection:', error);
      ws.close();
    }
  });

  return wss;
}