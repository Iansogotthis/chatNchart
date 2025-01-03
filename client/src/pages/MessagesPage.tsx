import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  Users,
  FolderKanban,
  Send,
  Star,
  Trash2,
  MailPlus,
  RefreshCw,
  Filter
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
  const [messages] = useState<Message[]>([]); // TODO: Replace with actual messages query
  const [, setLocation] = useLocation();
  const [composeOpen, setComposeOpen] = useState(false);
  const [messageType, setMessageType] = useState<'direct' | 'group' | 'project'>('direct');
  const [newMessage, setNewMessage] = useState({
    recipientId: "",
    subject: "",
    content: "",
    messageType: "direct" as const
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
    toast({
      title: "Coming Soon",
      description: "Message functionality will be implemented soon!",
    });
    setNewMessage({ recipientId: "", subject: "", content: "", messageType: "direct" });
    setComposeOpen(false);
  };

  const handleMarkAsImportant = (messageId: number) => {
    toast({
      title: "Coming Soon",
      description: "Mark as important functionality will be implemented soon!",
    });
  };

  const handleDelete = (messageId: number) => {
    toast({
      title: "Coming Soon",
      description: "Delete functionality will be implemented soon!",
    });
  };

  const handleMarkAsUnread = (messageId: number) => {
    toast({
      title: "Coming Soon",
      description: "Mark as unread functionality will be implemented soon!",
    });
  };

  return (
    <div className="container mx-auto max-w-6xl py-6">
      <div className="flex gap-6">
        {/* Sidebar */}
        <Card className="w-64">
          <CardContent className="p-4">
            <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
              <DialogTrigger asChild>
                <Button className="w-full mb-4">
                  <MailPlus className="mr-2 h-4 w-4" />
                  Compose
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Message</DialogTitle>
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
                    placeholder="Recipient"
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
                  <Button onClick={handleSendMessage} className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
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
              <Button variant="outline" size="icon">
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
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No messages yet. Start a conversation!
                  </p>
                ) : (
                  messages.map((message) => (
                    <Card
                      key={message.id}
                      className={`cursor-pointer transition-all hover:bg-accent/50 ${
                        !message.isRead ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedMessage(message)}
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
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}