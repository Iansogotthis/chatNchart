import { useUser } from "@/hooks/use-user";
import { useFriends } from "@/hooks/use-friends";
import { FriendList } from "@/components/FriendList";
import { SearchFriends } from "@/components/SearchFriends";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function FriendsPage() {
  const { user } = useUser();
  const { friends, pendingRequests, acceptRequest, rejectRequest, removeFriend, isMutating } = useFriends();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await acceptRequest(requestId);
      toast({
        title: "Success",
        description: "Friend request accepted!"
      });
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept request",
        variant: "destructive"
      });
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      await rejectRequest(requestId);
      toast({
        title: "Success",
        description: "Friend request rejected"
      });
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject request",
        variant: "destructive"
      });
    }
  };

  const handleRemoveFriend = async (friendId: number) => {
    try {
      await removeFriend(friendId);
      toast({
        title: "Success",
        description: "Friend removed successfully"
      });
    } catch (error) {
      console.error('Error removing friend:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove friend",
        variant: "destructive"
      });
    }
  };

  const handleMessage = (friendId: number) => {
    setLocation(`/messages?compose=true&recipientId=${friendId}`);
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl" role="main">
      <header className="mb-6 space-y-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight" role="heading" aria-label="Friends and Requests Page">
          Friends & Requests
        </h1>

        <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
          <Button 
            onClick={() => setIsSearchOpen(true)}
            className="w-full sm:w-auto"
            aria-label="Open Search"
          >
            <Search className="h-4 w-4 mr-2" />
            Find Friends
          </Button>
          <SearchFriends 
            isOpen={isSearchOpen} 
            onOpenChange={setIsSearchOpen} 
          />
        </div>
      </header>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 text-sm">
              <p className="flex justify-between">
                <span>Total Friends:</span>
                <span className="font-medium">{friends.length}</span>
              </p>
              <p className="flex justify-between">
                <span>Pending Requests:</span>
                <span className="font-medium">{pendingRequests.length}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ScrollArea className="h-[calc(100vh-16rem)] rounded-md border p-4">
        <div className="max-w-3xl mx-auto">
          <FriendList
            friends={friends}
            pendingRequests={pendingRequests}
            onAcceptRequest={handleAcceptRequest}
            onRejectRequest={handleRejectRequest}
            onRemoveFriend={handleRemoveFriend}
            onMessage={handleMessage}
            className="space-y-4"
          />
        </div>
      </ScrollArea>
    </div>
  );
}