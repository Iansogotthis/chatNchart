import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { MessageSquare, UserMinus, UserCheck, UserX, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FriendRequest {
  id: number;
  status: "pending";
  createdAt: string;
  sender: {
    id: number;
    username: string;
  };
}

interface Friend {
  id: number;
  status: "accepted";
  createdAt: string;
  friend: {
    id: number;
    username: string;
    bio?: string;
  };
}

interface FriendListProps {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  onMessage?: (friendId: number) => void;
  onRemoveFriend?: (friendId: number) => void;
  onAcceptRequest?: (requestId: number) => void;
  onRejectRequest?: (requestId: number) => void;
}

export function FriendList({ 
  friends, 
  pendingRequests,
  onMessage, 
  onRemoveFriend,
  onAcceptRequest,
  onRejectRequest
}: FriendListProps) {
  return (
    <div className="space-y-6">
      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
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
                {pendingRequests.map((request) => (
                  <Card
                    key={request.id}
                    className="transition-all hover:bg-accent/50"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage 
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${request.sender.username}`} 
                              alt={request.sender.username} 
                            />
                            <AvatarFallback>
                              {request.sender.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <h4 className="text-base font-semibold leading-none tracking-tight">
                              {request.sender.username}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Sent {formatDistanceToNow(new Date(request.createdAt))} ago
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="default"
                            size="icon"
                            onClick={() => onAcceptRequest?.(request.id)}
                            className="bg-primary/10 hover:bg-primary/20 text-primary"
                          >
                            <UserCheck className="h-4 w-4" />
                            <span className="sr-only">Accept Request</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRejectRequest?.(request.id)}
                            className="hover:bg-destructive/10 text-destructive hover:text-destructive"
                          >
                            <UserX className="h-4 w-4" />
                            <span className="sr-only">Reject Request</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Friends List Section */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">Friends</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {friends.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No friends added yet. Start by sending friend requests!
                </p>
              ) : (
                friends.map((friendship) => (
                  <Card
                    key={friendship.id}
                    className="transition-all hover:bg-accent/50"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage 
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${friendship.friend.username}`} 
                              alt={friendship.friend.username} 
                            />
                            <AvatarFallback>
                              {friendship.friend.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <h4 className="text-base font-semibold leading-none tracking-tight">
                              {friendship.friend.username}
                            </h4>
                            {friendship.friend.bio && (
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
                          {onMessage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onMessage(friendship.friend.id)}
                              className="hover:bg-primary/10"
                            >
                              <MessageSquare className="h-4 w-4" />
                              <span className="sr-only">Message {friendship.friend.username}</span>
                            </Button>
                          )}
                          {onRemoveFriend && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onRemoveFriend(friendship.friend.id)}
                              className="hover:bg-destructive/10 text-destructive hover:text-destructive"
                            >
                              <UserMinus className="h-4 w-4" />
                              <span className="sr-only">Remove {friendship.friend.username}</span>
                            </Button>
                          )}
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
  );
}