import { useUser } from "@/hooks/use-user";
import { useFriends } from "@/hooks/use-friends";
import { FriendList } from "@/components/FriendList";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function FriendsPage() {
  const { user } = useUser();
  const { friends, pendingRequests, acceptRequest, rejectRequest, removeFriend, isMutating } = useFriends();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Friends & Requests</h1>
      <FriendList
        friends={friends}
        pendingRequests={pendingRequests}
        onAcceptRequest={handleAcceptRequest}
        onRejectRequest={handleRejectRequest}
        onRemoveFriend={handleRemoveFriend}
        onMessage={handleMessage}
      />
    </div>
  );
}