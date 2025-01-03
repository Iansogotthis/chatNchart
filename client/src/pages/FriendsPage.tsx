import { useUser } from "@/hooks/use-user";
import { useFriends } from "@/hooks/use-friends";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, UserCheck, UserX, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export default function FriendsPage() {
  const { user } = useUser();
  const { friends, pendingRequests, acceptRequest, rejectRequest, removeFriend, isMutating } = useFriends();
  const { toast } = useToast();

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

  if (!user) return null;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Friends & Requests</h1>

      {/* Received Requests */}
      {pendingRequests.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <CardTitle>Pending Friend Requests</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>
                          {request.sender?.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Link href={`/profile/${request.sender?.username}`} className="font-medium hover:underline">
                          {request.sender?.username}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          Sent {formatDistanceToNow(new Date(request.createdAt))} ago
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={isMutating}
                        className="bg-primary/10 hover:bg-primary/20 text-primary"
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={isMutating}
                        className="hover:bg-destructive/10 text-destructive hover:text-destructive"
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Your Friend List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            <CardTitle>Your Friends</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {friends.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No friends added yet. Start by sending friend requests!
            </p>
          ) : (
            <div className="space-y-4">
              {friends.map((friendship) => (
                <Card key={friendship.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>
                          {friendship.friend?.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Link href={`/profile/${friendship.friend?.username}`} className="font-medium hover:underline">
                          {friendship.friend?.username}
                        </Link>
                        {friendship.friend?.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {friendship.friend.bio}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Friends since {formatDistanceToNow(new Date(friendship.createdAt))} ago
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/messages/${friendship.friend?.id}`}>
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFriend(friendship.friend?.id!)}
                        className="hover:bg-destructive/10 text-destructive hover:text-destructive"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}