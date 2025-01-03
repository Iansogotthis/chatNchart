import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import { Loader2, Send, CheckCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { format } from "date-fns";

interface MessagesProps {
  friendId: number;
  friendUsername: string;
  friendAvatarUrl?: string;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  isRead: boolean;
  createdAt: string;
}

export function Messages({ friendId, friendUsername }: MessagesProps) {
  const [newMessage, setNewMessage] = useState("");
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch messages for this conversation
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['direct-messages', friendId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/messages/direct/${friendId}`, {
          credentials: 'include'
        });
        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || 'Failed to fetch messages');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }
    },
    refetchInterval: 5000, // Poll for new messages every 5 seconds
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageIds: number[]) => {
      try {
        const response = await fetch('/api/messages/read', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageIds }),
          credentials: 'include'
        });
        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || 'Failed to mark messages as read');
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direct-messages', friendId] });
    }
  });

  // Send new message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      try {
        const response = await fetch("/api/messages/direct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ receiverId: friendId, content }),
          credentials: 'include'
        });
        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || 'Failed to send message');
        }
        return response.json();
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direct-messages', friendId] });
      setNewMessage("");
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Mark unread messages as read when they're viewed
  useEffect(() => {
    if (!user) return;

    const unreadMessages = messages
      .filter((m: Message) => m.receiverId === user.id && !m.isRead)
      .map((m: Message) => m.id);

    if (unreadMessages.length > 0) {
      markAsReadMutation.mutate(unreadMessages);
    }
  }, [messages, user?.id, markAsReadMutation]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  const formatMessageDate = (date: string | Date) => {
    const messageDate = new Date(date);
    const today = new Date();

    if (messageDate.toDateString() === today.toDateString()) {
      return format(messageDate, "HH:mm");
    }

    if (messageDate.getFullYear() === today.getFullYear()) {
      return format(messageDate, "d MMM, HH:mm");
    }

    return format(messageDate, "d MMM yyyy, HH:mm");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Chat with {friendUsername}
        </CardTitle>
        <CardDescription>
          Send and receive messages with your friend
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="flex flex-col space-y-4 p-4">
            {messages.map((message: Message) => {
              const isSentByMe = message.senderId === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isSentByMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] ${
                      isSentByMe
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    } rounded-lg px-4 py-2 shadow-sm`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className={`flex items-center gap-1 mt-1 text-xs ${
                      isSentByMe ? "text-primary-foreground/80" : "text-muted-foreground"
                    }`}>
                      <span>{formatMessageDate(message.createdAt)}</span>
                      {isSentByMe && message.isRead && (
                        <CheckCheck className="h-3 w-3" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <form onSubmit={handleSend} className="border-t p-4 space-y-4">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[80px] resize-none"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              className="gap-2"
              disabled={sendMessageMutation.isPending}
            >
              {sendMessageMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}