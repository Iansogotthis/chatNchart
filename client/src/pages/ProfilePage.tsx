import { useUser } from "@/hooks/use-user";
import { UserDetails } from "@/components/UserDetails";
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
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto max-w-7xl p-4">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">User not found</h1>
          <p className="text-lg text-muted-foreground max-w-md">
            The user you're looking for doesn't exist or may have been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8">
          <div className="flex flex-col lg:flex-row justify-between gap-8">
            <div className="flex-1">
              <UserDetails
                user={profile}
                isEditable={isOwnProfile}
                onEdit={isOwnProfile ? () => {} : undefined}
              />
            </div>
            {!isOwnProfile && (
              <div className="lg:pt-4">
                <Button 
                  size="lg"
                  className="w-full lg:w-auto"
                  onClick={handleFriendRequest}
                >
                  Add Friend
                </Button>
              </div>
            )}
          </div>

          <Tabs defaultValue="projects" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="likes">Likes</TabsTrigger>
              <TabsTrigger value="saves">Saves</TabsTrigger>
              <TabsTrigger value="friends">Friends</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="mt-6">
              <div className="rounded-lg border bg-card text-card-foreground p-8 text-center">
                <p className="text-lg text-muted-foreground">
                  Coming soon: Projects feature
                </p>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="mt-6">
              <div className="rounded-lg border bg-card text-card-foreground p-8 text-center">
                <p className="text-lg text-muted-foreground">
                  Coming soon: Notes feature
                </p>
              </div>
            </TabsContent>

            <TabsContent value="likes" className="mt-6">
              <div className="rounded-lg border bg-card text-card-foreground p-8 text-center">
                <p className="text-lg text-muted-foreground">
                  Coming soon: Likes feature
                </p>
              </div>
            </TabsContent>

            <TabsContent value="saves" className="mt-6">
              <div className="rounded-lg border bg-card text-card-foreground p-8 text-center">
                <p className="text-lg text-muted-foreground">
                  Coming soon: Saves feature
                </p>
              </div>
            </TabsContent>

            <TabsContent value="friends" className="mt-6">
              <FriendList
                friends={friends || []}
                onMessage={handleMessage}
                onRemove={isOwnProfile ? () => {} : undefined}
              />
            </TabsContent>

            <TabsContent value="charts" className="mt-6">
              <AllChartsView />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}