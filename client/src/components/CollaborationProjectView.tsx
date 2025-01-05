import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { ChartVisualization } from "./ChartVisualization";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import {
  Settings,
  Settings2,
  History,
  Users,
  MessageSquare,
  PanelLeftClose,
  PanelRightClose,
  Play,
  Pause,
  Send,
  UserPlus,
  Crown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { Project } from "@/types/collaboration";
import { Input } from "./ui/input";
import { useUser } from "@/hooks/use-user";
import { useFriends } from "@/hooks/use-friends";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  content: string;
  sender: {
    id: number;
    username: string;
  };
  timestamp: string;
}

interface CollaboratorPresence {
  type: 'presence';
  userId: number;
  username: string;
  status: 'online' | 'offline';
  accessLevel: string;
}

export function CollaborationProjectView({ id }: { id: number }) {
  const [leftNavOpen, setLeftNavOpen] = useState(false);
  const [rightNavOpen, setRightNavOpen] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [wsError, setWsError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [onlineCollaborators, setOnlineCollaborators] = useState<CollaboratorPresence[]>([]);
  const [userAccessLevel, setUserAccessLevel] = useState<string>('viewer');

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const maxReconnectAttempts = 5;
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const { toast } = useToast();
  const { user } = useUser();
  const { friends } = useFriends();

  const { data: project, isLoading: isLoadingProject } = useQuery<Project>({
    queryKey: [`projects/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${id}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch project');
      return response.json();
    },
  });

  const connectWebSocket = () => {
    if (isConnecting || !user || reconnectAttempts >= maxReconnectAttempts) {
      if (reconnectAttempts >= maxReconnectAttempts) {
        toast({
          title: "Connection Failed",
          description: "Maximum reconnection attempts reached. Please refresh the page.",
          variant: "destructive",
        });
      }
      return;
    }

    setIsConnecting(true);
    setWsError(null);

    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const port = process.env.NODE_ENV === 'development' ? ':3002' : '';
      const wsUrl = `${wsProtocol}//${window.location.hostname}${port}/ws/projects/${id}/chat`;
      console.log('Connecting to WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsError(null);
        setIsConnecting(false);
        setReconnectAttempts(0);
        toast({
          title: "Connected",
          description: "Chat connection established",
        });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Received message:', message);

          switch (message.type) {
            case 'connection':
              console.log('Connection confirmed:', message);
              setUserAccessLevel(message.accessLevel);
              break;

            case 'presence':
              handlePresenceUpdate(message);
              break;

            case 'collaborators':
              setOnlineCollaborators(message.collaborators);
              break;

            case 'history':
              setMessages(message.messages);
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              break;

            case 'message':
              handleNewMessage(message);
              break;

            case 'project_state':
              handleProjectStateChange(message);
              break;

            case 'error':
              handleError(message.error);
              break;

            default:
              console.warn('Unknown message type:', message);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
          setWsError('Failed to parse message');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsError('Connection error');
        setIsConnecting(false);
        toast({
          title: "Connection Error",
          description: "Failed to connect to chat. Attempting to reconnect...",
          variant: "destructive",
        });
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setWsError('Connection closed');
        setIsConnecting(false);

        if (
          user &&
          document.visibilityState === 'visible' &&
          !isConnecting &&
          reconnectAttempts < maxReconnectAttempts
        ) {
          setReconnectAttempts(prev => prev + 1);
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setWsError('Failed to create connection');
      setIsConnecting(false);
      toast({
        title: "Connection Error",
        description: "Failed to establish chat connection",
        variant: "destructive",
      });
    }
  };

  const handlePresenceUpdate = (presence: CollaboratorPresence) => {
    setOnlineCollaborators(prev => {
      const filtered = prev.filter(c => c.userId !== presence.userId);
      return presence.status === 'online'
        ? [...filtered, presence]
        : filtered;
    });
    if (presence.status === 'online' && presence.userId !== user?.id) {
      toast({
        title: "Collaborator Online",
        description: `${presence.username} joined the project`,
      });
    }
  };

  const handleNewMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Play notification sound for messages from others
    if (message.sender.id !== user?.id) {
      // You can add a sound notification here if needed
      toast({
        title: "New Message",
        description: `${message.sender.username}: ${message.content}`,
      });
    }
  };

  const handleProjectStateChange = (change: any) => {
    setIsPaused(change.state === 'paused');
    if (change.updatedBy.id !== user?.id) {
      toast({
        title: "Project State Changed",
        description: `${change.updatedBy.username} ${change.state === 'paused' ? 'paused' : 'resumed'} the project`,
      });
    }
  };

  const handleError = (error: string) => {
    setWsError(error);
    toast({
      title: "Error",
      description: error,
      variant: "destructive",
    });
  };

  useEffect(() => {
    if (user) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [id, user]);

  const sendMessage = () => {
    if (!messageInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      if (wsError) {
        toast({
          title: "Connection Error",
          description: "Unable to send message. Please wait for reconnection.",
          variant: "destructive",
        });
      }
      return;
    }

    try {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        projectId: id,
        userId: user?.id,
        content: messageInput.trim(),
      }));
      setMessageInput("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleProjectState = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !canEditState) {
      if(!canEditState) {
        toast({
          title: "Permission Denied",
          description: "You do not have permission to pause/resume this project.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Error",
          description: "Unable to change project state. Please wait for reconnection.",
          variant: "destructive",
        });
      }
      return;
    }

    try {
      wsRef.current.send(JSON.stringify({
        type: 'project_state',
        projectId: id,
        state: isPaused ? 'active' : 'paused',
      }));
    } catch (error) {
      console.error('Error toggling project state:', error);
      toast({
        title: "Error",
        description: "Failed to change project state. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoadingProject || !project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const isOwner = project.ownerId === user?.id;
  const canEditState = userAccessLevel === 'owner' || userAccessLevel === 'admin';

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 grid grid-cols-[1fr] relative">
        <div
          className={cn(
            "fixed left-0 top-0 h-full w-[250px] bg-background border-r z-20",
            "transform transition-transform duration-300 ease-in-out",
            leftNavOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">Project Tools</h2>
            <Separator />
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setShowTimeline(!showTimeline);
                  setLeftNavOpen(false);
                }}
              >
                <History className="mr-2 h-4 w-4" />
                Timeline
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Settings2 className="mr-2 h-4 w-4" />
                Tools
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Team
              </Button>
            </div>
          </div>
        </div>

        <main className="relative min-h-0">
          <div className="absolute left-4 top-4 z-30">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLeftNavOpen(!leftNavOpen)}
              className="rounded-full shadow-md bg-background hover:bg-background/90"
            >
              <PanelLeftClose className={cn("h-4 w-4 transition-transform", !leftNavOpen && "rotate-180")} />
            </Button>
          </div>

          <div className="absolute right-4 top-4 z-30">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightNavOpen(!rightNavOpen)}
              className="rounded-full shadow-md bg-background hover:bg-background/90"
            >
              <PanelRightClose className={cn("h-4 w-4 transition-transform", !rightNavOpen && "rotate-180")} />
            </Button>
          </div>

          {project.chart && (
            <div className="h-full">
              <ChartVisualization chart={project.chart} />
            </div>
          )}
        </main>

        <div
          className={cn(
            "fixed right-0 top-0 h-full w-[250px] bg-background border-l z-20",
            "transform transition-transform duration-300 ease-in-out",
            rightNavOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">Project Settings</h2>
            <Separator />
            <div className="space-y-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Project Settings
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Project Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Project settings content */}
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Collaborators
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Manage Collaborators</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {project.collaborators?.map((collab) => (
                        <div key={collab.id} className="flex items-center justify-between p-2 rounded-lg border">
                          <div className="flex items-center gap-2">
                            {collab.id === project.ownerId && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                            <span>{collab.username}</span>
                            <span className="text-xs text-muted-foreground">
                              ({collab.accessLevel})
                            </span>
                          </div>
                          {isOwner && collab.id !== user?.id && (
                            <Button variant="ghost" size="sm">
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}

                      {isOwner && (
                        <div className="space-y-2">
                          <h3 className="font-medium">Add Collaborator</h3>
                          <div className="space-y-2">
                            {friends?.map((friend) => (
                              <div key={friend.id} className="flex items-center justify-between p-2 rounded-lg border">
                                <span>{friend.friend?.username}</span>
                                <Button variant="ghost" size="sm">
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Add
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>

              {canEditState && (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={toggleProjectState}
                >
                  {isPaused ? (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Resume Project
                    </>
                  ) : (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause Project
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="h-[200px] border-t">
        <div className="flex items-center justify-between p-2 border-b bg-background">
          <h3 className="font-medium">Project Chat</h3>
          <div className="flex items-center gap-2">
            {wsError && (
              <span className="text-sm text-destructive">
                {wsError}
              </span>
            )}
            {isConnecting ? (
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
          </div>
        </div>
        <div className="h-[calc(200px-41px)] grid grid-rows-[1fr_auto]">
          <ScrollArea className="p-2">
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={cn(
                  "mb-2",
                  message.sender.id === user?.id ? "text-right" : ""
                )}
              >
                <div
                  className={cn(
                    "inline-block max-w-[70%] px-3 py-2 rounded-lg",
                    message.sender.id === user?.id
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm font-medium">
                    {message.sender.username}
                    {project.ownerId === message.sender.id && (
                      <Crown className="inline-block ml-1 h-3 w-3 text-yellow-500" />
                    )}
                  </p>
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </ScrollArea>
          <div className="p-2 border-t flex gap-2">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type a message..."
              className="flex-1"
              disabled={!!wsError}
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!!wsError}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CollaborationProjectView;