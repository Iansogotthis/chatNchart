import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { ChartVisualization } from "./ChartVisualization";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Settings, Settings2, History, Users, MessageSquare, PanelLeftClose, PanelRightClose, Play, Pause, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { Project } from "@/types/collaboration";
import { Input } from "./ui/input";
import { useUser } from "@/hooks/use-user";
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

interface CollaborationProjectViewProps {
  id: number;
}

export function CollaborationProjectView({ id }: CollaborationProjectViewProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const [leftNavOpen, setLeftNavOpen] = useState(false); // Start hidden
  const [rightNavOpen, setRightNavOpen] = useState(false); // Start hidden
  const [showTimeline, setShowTimeline] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [wsError, setWsError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const { data: project } = useQuery<Project>({
    queryKey: [`/api/projects/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      return response.json();
    },
  });

  const connectWebSocket = () => {
    if (isConnecting) return;
    setIsConnecting(true);

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const ws = new WebSocket(`${protocol}//${host}/ws/projects/${id}/chat`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsError(null);
        setIsConnecting(false);
        toast({
          title: "Connected",
          description: "Chat connection established",
        });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.error) {
            setWsError(message.error);
            toast({
              title: "Error",
              description: message.error,
              variant: "destructive",
            });
            return;
          }
          setMessages(prev => [...prev, message]);
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

        // Attempt to reconnect after 5 seconds if page is visible and not already connecting
        if (!isConnecting) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (document.visibilityState === 'visible') {
              connectWebSocket();
            }
          }, 5000);
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

  useEffect(() => {
    connectWebSocket();

    // Cleanup function
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [id]);

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

    const messageData = {
      content: messageInput.trim(),
      projectId: id,
      userId: user?.id,
    };

    try {
      wsRef.current.send(JSON.stringify(messageData));
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
    setIsPaused(!isPaused);
    toast({
      title: isPaused ? "Project Resumed" : "Project Paused",
      description: isPaused
        ? "Collaborators can now access and edit the project"
        : "Project access has been temporarily restricted",
    });
  };

  if (!project) return null;

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 grid grid-cols-[1fr] relative">
        {/* Left Panel */}
        <div
          className={cn(
            "fixed left-0 top-0 h-full w-[250px] bg-background border-r",
            "transform transition-transform duration-300 ease-in-out z-20",
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

        {/* Main Content */}
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

        {/* Right Panel */}
        <div
          className={cn(
            "fixed right-0 top-0 h-full w-[250px] bg-background border-l",
            "transform transition-transform duration-300 ease-in-out z-20",
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
                    Edit Project Settings
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Project Settings</DialogTitle>
                  </DialogHeader>
                  {/* Project settings form content */}
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Edit Collaborators
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Collaborators</DialogTitle>
                  </DialogHeader>
                  {/* Collaborator management content */}
                </DialogContent>
              </Dialog>

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
            </div>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
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
                  <p className="text-sm font-medium">{message.sender.username}</p>
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