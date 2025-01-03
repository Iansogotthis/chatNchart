import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  Users,
  FolderKanban,
  Send,
  Star,
  Trash2,
  MailPlus,
  RefreshCw,
  Filter,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Message {
  id: number;
  senderId: number;
  recipientId: number;
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  isImportant: boolean;
  messageType: 'direct' | 'group' | 'project';
  groupId?: number;
  projectId?: number;
}

export default function MessagesPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [composeOpen, setComposeOpen] = useState(false);
  const [messageType, setMessageType] = useState<'direct' | 'group' | 'project'>('direct');
  const [newMessage, setNewMessage] = useState({
    recipientId: "",
    subject: "",
    content: "",
    messageType: "direct" as const
  });

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const response = await fetch('/api/messages', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: typeof newMessage) => {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setNewMessage({ recipientId: "", subject: "", content: "", messageType: "direct" });
      setComposeOpen(false);
      toast({
        title: "Success",
        description: "Message sent successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive"
      });
    }
  });

  // Parse URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldCompose = params.get('compose') === 'true';
    const recipientId = params.get('recipientId');

    if (shouldCompose && recipientId) {
      setComposeOpen(true);
      setNewMessage(prev => ({
        ...prev,
        recipientId,
        messageType: 'direct'
      }));
      // Clean up the URL
      setLocation('/messages', { replace: true });
    }
  }, [setLocation]);

  const handleSendMessage = () => {
    if (!newMessage.recipientId || !newMessage.subject || !newMessage.content) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    sendMessageMutation.mutate(newMessage);
  };

  const handleMarkAsImportant = async (messageId: number) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/important`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to update message');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast({
        title: "Success",
        description: "Message updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update message",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (messageId: number) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete message');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast({
        title: "Success",
        description: "Message deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete message",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsUnread = async (messageId: number) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'PUT',
        body: JSON.stringify({ isRead: false }),
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to update message');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast({
        title: "Success",
        description: "Message marked as unread",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update message",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto max-w-6xl py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <Card className="lg:w-64 w-full">
          <CardContent className="p-4">
            <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
              <DialogTrigger asChild>
                <Button className="w-full mb-4">
                  <MailPlus className="mr-2 h-4 w-4" />
                  Compose
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>New Message</DialogTitle>
                  <DialogDescription>
                    Compose and send a new message to a user, group, or project.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-2">Message Type</label>
                    <Tabs defaultValue="direct" className="w-full" onValueChange={(value) => setMessageType(value as any)}>
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="direct">Direct</TabsTrigger>
                        <TabsTrigger value="group">Group</TabsTrigger>
                        <TabsTrigger value="project">Project</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <Input
                    placeholder="Recipient ID"
                    value={newMessage.recipientId}
                    onChange={(e) => setNewMessage({ ...newMessage, recipientId: e.target.value })}
                  />
                  <Input
                    placeholder="Subject"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  />
                  <Textarea
                    placeholder="Type your message here..."
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                    rows={5}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    className="w-full"
                    disabled={sendMessageMutation.isPending}
                  >
                    {sendMessageMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <nav className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Inbox
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Star className="mr-2 h-4 w-4" />
                Important
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Group Messages
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <FolderKanban className="mr-2 h-4 w-4" />
                Project Messages
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Trash2 className="mr-2 h-4 w-4" />
                Trash
              </Button>
            </nav>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Manage your conversations</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['messages'] })}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Show All</DropdownMenuItem>
                  <DropdownMenuItem>Unread Only</DropdownMenuItem>
                  <DropdownMenuItem>Important Only</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-16rem)]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No messages yet. Start a conversation!
                </p>
              ) : (
                <div className="space-y-4">
                  {messages.map((message: Message) => (
                    <Card
                      key={message.id}
                      className={`cursor-pointer transition-all hover:bg-accent/50 ${
                        !message.isRead ? 'bg-primary/5' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarFallback>
                                {message.senderId === user?.id ? 'You' : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">
                                  {message.senderId === user?.id ? 'You' : 'User'}
                                </h4>
                                <Badge variant={message.messageType === 'direct' ? 'default' : 'secondary'}>
                                  {message.messageType}
                                </Badge>
                                {message.isImportant && (
                                  <Star className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                              <p className="text-sm font-medium">{message.subject}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {message.content}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(message.timestamp), 'PPpp')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsImportant(message.id);
                              }}
                            >
                              <Star className={`h-4 w-4 ${message.isImportant ? 'text-yellow-500' : ''}`} />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  •••
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleMarkAsUnread(message.id)}>
                                  Mark as unread
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(message.id)}>
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}