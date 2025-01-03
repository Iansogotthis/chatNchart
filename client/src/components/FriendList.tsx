import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

interface Friend {
  id: number;
  username: string;
  status: "online" | "offline";
}

interface FriendListProps {
  friends: Friend[];
  onMessage?: (friendId: number) => void;
  onRemove?: (friendId: number) => void;
}

export function FriendList({ friends, onMessage, onRemove }: FriendListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Friends ({friends.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {friends.length === 0 ? (
              <p className="text-center text-muted-foreground">No friends yet</p>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarFallback>
                          {friend.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span 
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                          friend.status === "online" ? "bg-green-500" : "bg-gray-500"
                        }`} 
                      />
                    </div>
                    <div>
                      <p className="font-medium">{friend.username}</p>
                      <p
                        className={`text-sm ${
                          friend.status === "online"
                            ? "text-green-500"
                            : "text-gray-500"
                        }`}
                      >
                        {friend.status}
                      </p>
                    </div>
                  </div>
                  <div className="space-x-2">
                    {onMessage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onMessage(friend.id)}
                      >
                        Message
                      </Button>
                    )}
                    {onRemove && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onRemove(friend.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}