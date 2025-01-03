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
        <CardTitle>Friends</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-2 hover:bg-accent rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {friend.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
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
                      onClick={() => onRemove(friend.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
