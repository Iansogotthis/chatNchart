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
  FolderKanban,
  Send,
  Star,
  Trash2,
  MailPlus,
  RefreshCw,
  Filter,
  Loader2,
  Search
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
import { format } from "date-fns";

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
      if (!response.ok) throw new Error('Failed to search users');
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
        .then(res => res.json())
        .then(user => {
          setSelectedUser(user);
        })
        .catch(console.error);

      // Clean up the URL
      setLocation('/messages', { replace: true });
    }
  }, [setLocation]);

  const handleSendMessage = () => {
    if (!selectedUser || !messageContent.trim()) {
      toast({
        title: "Error",
        description: "Please select a recipient and enter a message",
        variant: "destructive"
      });
      return;
    }

    sendMessageMutation.mutate({
      receiverId: selectedUser.id,
      content: messageContent.trim()
    });
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

            <nav className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Inbox
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Friends
              </Button>
            </nav>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Messages</CardTitle>
            <CardDescription>
              Your conversations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedUser ? (
              <Messages
                friendId={selectedUser.id}
                friendUsername={selectedUser.username}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No conversation selected</h3>
                <p className="text-sm text-muted-foreground">
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