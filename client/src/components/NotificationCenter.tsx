import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Bell, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { Notification } from "@db/schema";

export function NotificationCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications");
      if (!response.ok) throw new Error("Failed to fetch notifications");
      return response.json();
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Failed to mark notification as read");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update notification",
        variant: "destructive",
      });
    },
  });

  const formatNotification = (notification: Notification) => {
    switch (notification.type) {
      case "message":
        return {
          text: "You have a new message",
          link: "/messages",
        };
      case "friend_request":
        return {
          text: "You have a new friend request",
          link: `/profile/${notification.sourceId}`,
        };
      case "collab_request":
        return {
          text: "You have a new collaboration request",
          link: `/charts/${notification.sourceId}`,
        };
      case "chart_like":
        return {
          text: "Someone liked your chart",
          link: `/charts/${notification.sourceId}`,
        };
      default:
        return {
          text: "New notification",
          link: "/",
        };
    }
  };

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-xs flex items-center justify-center text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <h3 className="font-semibold mb-2">Notifications</h3>
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : notifications?.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No notifications
          </p>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {notifications?.map((notification) => {
                const { text, link } = formatNotification(notification);
                return (
                  <Link
                    key={notification.id}
                    href={link}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsReadMutation.mutate(notification.id);
                      }
                    }}
                  >
                    <div
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        notification.isRead
                          ? "bg-muted hover:bg-muted/80"
                          : "bg-primary/10 hover:bg-primary/20"
                      }`}
                    >
                      <p className="text-sm">{text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
