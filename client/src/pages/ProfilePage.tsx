import { useUser } from "@/hooks/use-user";
import { UserProfile } from "@/components/UserProfile";
import { FriendList } from "@/components/FriendList";
import { AllChartsView } from "@/components/AllChartsView";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { username } = useParams();
  const { user } = useUser();
  const { toast } = useToast();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: [`/api/users/${username}`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}`);
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },
  });

  const { data: friends, isLoading: friendsLoading } = useQuery({
    queryKey: [`/api/users/${username}/friends`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}/friends`);
      if (!response.ok) throw new Error("Failed to fetch friends");
      return response.json();
    },
  });

  const handleMessage = async (friendId: number) => {
    try {
      const response = await fetch("/api/messages/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipientId: friendId }),
      });

      if (!response.ok) throw new Error("Failed to create message");

      const conversation = await response.json();
      window.location.href = `/messages/${conversation.id}`;
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not start conversation. Please try again.",
      });
    }
  };

  const handleFriendRequest = async () => {
    if (!profile?.id) return;

    try {
      const response = await fetch("/api/friends/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friendId: profile.id }),
      });

      if (!response.ok) throw new Error("Failed to send friend request");

      toast({
        title: "Success",
        description: "Friend request sent!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not send friend request. Please try again.",
      });
    }
  };

  const isOwnProfile = user?.username === username;

  if (profileLoading || friendsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto max-w-7xl p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">User not found</h1>
          <p className="text-muted-foreground">
            The user you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="grid gap-6 p-4">
        <div className="flex items-start justify-between">
          <UserProfile
            username={profile.username}
            bio={profile.bio}
            funFacts={profile.funFacts}
            topCharts={profile.topCharts}
            onEditProfile={isOwnProfile ? () => {} : undefined}
          />
          {!isOwnProfile && (
            <Button onClick={handleFriendRequest}>Add Friend</Button>
          )}
        </div>

        <Tabs defaultValue="charts" className="w-full">
          <TabsList>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="friends">Friends</TabsTrigger>
          </TabsList>

          <TabsContent value="charts">
            <AllChartsView />
          </TabsContent>

          <TabsContent value="friends">
            <FriendList
              friends={friends || []}
              onMessage={handleMessage}
              onRemove={isOwnProfile ? () => {} : undefined}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}