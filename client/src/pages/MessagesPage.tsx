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
import { Messages } from "@/components/Messages";
import {
  Mail,
  Users,
  Send,
  Loader2,
  Search,
  MailPlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


interface User {
  id: number;
  username: string;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  id: number;
  participantId: number;
  participantName: string;
  lastMessageAt: string;
  lastMessage: string | null;
}


export default function MessagesPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [composeOpen, setComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageContent, setMessageContent] = useState("");

  // Search users
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['user-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to search users');
      }
      return response.json();
    },
    enabled: searchQuery.length >= 2
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: number, content: string }) => {
      const response = await fetch('/api/messages/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ receiverId, content }),
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to send message');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setMessageContent("");
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
      // Fetch user details for the recipient
      fetch(`/api/users/${recipientId}`, { credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch user details');
          return res.json();
        })
        .then(user => {
          setSelectedUser(user);
        })
        .catch(error => {
          console.error('Error fetching user details:', error);
          toast({
            title: "Error",
            description: "Failed to load recipient details",
            variant: "destructive"
          });
        });

      // Clean up the URL
      setLocation('/messages', { replace: true });
    }
  }, [setLocation, toast]);

  const handleSendMessage = async () => {
    if (!selectedUser || !messageContent.trim()) {
      toast({
        title: "Error",
        description: "Please select a recipient and enter a message",
        variant: "destructive"
      });
      return;
    }

    try {
      await sendMessageMutation.mutateAsync({
        receiverId: selectedUser.id,
        content: messageContent.trim()
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Fetch conversations  (Replace with your actual fetch logic)
  const { data: conversations = [], isLoading: isConversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => fetch('/api/conversations', { credentials: 'include' }).then(res => res.json())
  });


  return (
    <div className="container mx-auto max-w-6xl p-4 md:py-6">
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-[calc(100vh-2rem)]">
        {/* Sidebar - Enhanced for mobile */}
        <Card className="lg:w-80 w-full flex-shrink-0">
          <CardContent className="p-4">
            <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
              <DialogTrigger asChild>
                <Button className="w-full mb-4">
                  <MailPlus className="mr-2 h-4 w-4" />
                  Compose
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle>New Message</DialogTitle>
                  <DialogDescription>
                    Search for a user to send a message
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="mb-2"
                      aria-label="Search users"
                    />
                    {isSearching ? (
                      <div className="flex justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : searchResults.length > 0 ? (
                      <Card>
                        <CardContent className="p-2">
                          {searchResults.map((result: User) => (
                            <Button
                              key={result.id}
                              variant={selectedUser?.id === result.id ? "default" : "ghost"}
                              className="w-full justify-start"
                              onClick={() => setSelectedUser(result)}
                            >
                              {result.username}
                            </Button>
                          ))}
                        </CardContent>
                      </Card>
                    ) : searchQuery.length >= 2 && (
                      <p className="text-sm text-muted-foreground">No users found</p>
                    )}
                  </div>
                  {selectedUser && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">To:</span>
                        <span className="text-sm">{selectedUser.username}</span>
                      </div>
                      <Textarea
                        placeholder="Type your message here..."
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        rows={5}
                        className="min-h-[100px]"
                        aria-label="Message content"
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
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <ScrollArea className="h-[calc(100vh-16rem)] lg:h-[calc(100vh-12rem)]">
              <div className="space-y-2">
                {conversations?.map((convo: Conversation) => (
                  <Link
                    key={convo.id}
                    href={`/messages?user=${convo.participantId}`}
                    className={`block w-full p-3 rounded-lg transition-colors ${
                      selectedUser?.id === convo.participantId
                        ? "bg-primary/10 hover:bg-primary/20"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${convo.participantName}`} />
                        <AvatarFallback>{convo.participantName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <span className="font-medium truncate">{convo.participantName}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {format(new Date(convo.lastMessageAt), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        {convo.lastMessage && (
                          <p className="text-sm text-muted-foreground truncate">
                            {convo.lastMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Content - Enhanced for mobile */}
        <Card className="flex-1 flex flex-col h-full">
          <CardHeader className="border-b">
            <CardTitle className="text-xl font-semibold tracking-tight">
              {selectedUser ? `Chat with ${selectedUser.username}` : 'Messages'}
            </CardTitle>
            <CardDescription>
              {selectedUser ? 'Send and receive messages with your friend' : 'Select a conversation to start messaging'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            {selectedUser ? (
              <Messages
                friendId={selectedUser.id}
                friendUsername={selectedUser.username}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No conversation selected</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Choose a friend to start messaging or compose a new message
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}