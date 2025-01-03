import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { MessageSquare, UserMinus, UserCheck, UserX, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FriendRequest {
  id: number;
  status: "pending";
  createdAt: string;
  sender: {
    id: number;
    username: string;
  } | null;
}

interface Friend {
  id: number;
  status: "accepted";
  createdAt: string;
  friend: {
    id: number;
    username: string;
    bio?: string | null;
  } | null;
}

interface FriendListProps {
  friends: Friend[];
  pendingRequests?: FriendRequest[];
  onAcceptRequest?: (requestId: number) => void;
  onRejectRequest?: (requestId: number) => void;
  onRemoveFriend?: (friendId: number) => void;
  onMessage?: (friendId: number) => void;
  isMutualView?: boolean;
}

export function FriendList({
  friends = [],
  pendingRequests = [],
  onAcceptRequest,
  onRejectRequest,
  onRemoveFriend,
  onMessage,
  isMutualView = false,
}: FriendListProps) {
  return (
    <div className="space-y-6">
      {!isMutualView && pendingRequests.length > 0 && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Pending Friend Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-4">
                {pendingRequests.map((request) => {
                  if (!request.sender) return null;
                  return (
                    <Card key={request.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarFallback>
                              {request.sender.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Link href={`/profile/${request.sender.username}`} className="font-medium hover:underline">
                              {request.sender.username}
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
                            onClick={() => onAcceptRequest?.(request.id)}
                            className="bg-primary/10 hover:bg-primary/20 text-primary"
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRejectRequest?.(request.id)}
                            className="hover:bg-destructive/10 text-destructive hover:text-destructive"
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            <CardTitle>{isMutualView ? 'Mutual Friends' : 'Your Friends'}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {friends.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {isMutualView ? 'No mutual friends yet.' : 'No friends added yet. Start by sending friend requests!'}
            </p>
          ) : (
            <div className="space-y-4">
              {friends.map((friendship) => {
                const friend = friendship.friend;
                if (!friend) return null;

                return (
                  <Card key={friendship.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {friend.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Link href={`/profile/${friend.username}`} className="font-medium hover:underline">
                            {friend.username}
                          </Link>
                          {friend.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {friend.bio}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Friends since {formatDistanceToNow(new Date(friendship.createdAt))} ago
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {onMessage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onMessage(friend.id)}
                            className="hover:bg-primary/10 text-primary hover:text-primary"
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                        )}
                        {onRemoveFriend && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveFriend(friend.id)}
                            className="hover:bg-destructive/10 text-destructive hover:text-destructive"
                          >
                            <UserMinus className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}