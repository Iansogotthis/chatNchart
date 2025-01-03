import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { MessageSquare, UserMinus, UserCheck } from "lucide-react";

interface Friend {
  id: number;
  username: string;
  status: "online" | "offline";
  avatarUrl?: string;
  lastSeen?: string;
}

interface FriendListProps {
  friends: Friend[];
  onMessage?: (friendId: number) => void;
  onRemove?: (friendId: number) => void;
}

export function FriendList({ friends, onMessage, onRemove }: FriendListProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">Friends</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {friends.map((friend) => (
              <Card
                key={friend.id}
                className="transition-all hover:bg-accent/50"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          {friend.avatarUrl ? (
                            <AvatarImage src={friend.avatarUrl} alt={friend.username} />
                          ) : (
                            <AvatarFallback className="bg-primary/10">
                              {friend.username[0].toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <Badge
                          variant={friend.status === "online" ? "default" : "secondary"}
                          className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full p-0"
                        />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-semibold leading-none tracking-tight">
                          {friend.username}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {friend.status === "online" 
                            ? "Online now" 
                            : friend.lastSeen 
                              ? `Last seen ${friend.lastSeen}`
                              : "Offline"
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {onMessage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onMessage(friend.id)}
                          className="hover:bg-primary/10"
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span className="sr-only">Message {friend.username}</span>
                        </Button>
                      )}
                      {onRemove && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemove(friend.id)}
                          className="hover:bg-destructive/10 text-destructive hover:text-destructive"
                        >
                          <UserMinus className="h-4 w-4" />
                          <span className="sr-only">Remove {friend.username}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}