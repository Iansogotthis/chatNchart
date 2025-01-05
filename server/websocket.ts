import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { db } from '@db';
import { chatMessages, users } from '@db/schema';
import { eq, and } from 'drizzle-orm';

interface ChatMessage {
  projectId: number;
  userId: number;
  content: string;
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });

  // Store project rooms as a map of projectId to set of WebSocket connections
  const projectRooms = new Map<number, Set<WebSocket>>();

  wss.on('connection', (ws, req) => {
    // Extract project ID from URL path (/ws/projects/:id/chat)
    const match = req.url?.match(/\/ws\/projects\/(\d+)\/chat/);
    if (!match) {
      ws.close();
      return;
    }

    const projectId = parseInt(match[1]);

    // Add connection to project room
    if (!projectRooms.has(projectId)) {
      projectRooms.set(projectId, new Set());
    }
    projectRooms.get(projectId)?.add(ws);

    ws.on('message', async (data) => {
      try {
        const message: ChatMessage = JSON.parse(data.toString());

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
    });
  });

  return wss;
}