import { useUser } from "@/hooks/use-user";
import { UserProfile } from "@/components/UserProfile";
import { FriendList } from "@/components/FriendList";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, UserMinus } from "lucide-react";

export default function ProfilePage() {
  const { username } = useParams();
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: [`/api/users/${username}`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    }
  });

  const { data: friends, isLoading: isLoadingFriends } = useQuery({
    queryKey: [`/api/users/${username}/friends`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}/friends`);
      if (!response.ok) throw new Error('Failed to fetch friends');
      return response.json();
    }
  });

  const addFriendMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${username}/friends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to add friend');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/friends`] });
      toast({
        title: "Friend request sent",
        description: `Friend request sent to ${username}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${username}/friends`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove friend');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/friends`] });
      toast({
        title: "Friend removed",
        description: `${username} has been removed from your friends`,
      });
    },
  });

  const handleMessage = (friendId: number) => {
    setLocation(`/messages?user=${friendId}`);
  };

  const isOwnProfile = user?.username === username;
  const isFriend = friends?.some((friend: any) => friend.username === user?.username);

  if (isLoadingProfile || isLoadingFriends) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <div className="grid gap-6 px-4">
        <div className="grid gap-6 md:grid-cols-7">
          <div className="md:col-span-5">
            <UserProfile
              username={profile?.username || ""}
              bio={profile?.bio}
              funFacts={profile?.funFacts}
              topCharts={profile?.topCharts}
              joinedDate={profile?.createdAt}
              totalCharts={profile?.totalCharts}
              totalCollaborations={profile?.totalCollaborations}
              badges={profile?.badges}
              onEditProfile={isOwnProfile ? () => setLocation("/settings/profile") : undefined}
            />
          </div>

          <div className="md:col-span-2 space-y-6">
            {!isOwnProfile && (
              <Card className="p-4">
                <div className="space-y-4">
                  <Button
                    className="w-full"
                    variant={isFriend ? "destructive" : "default"}
                    onClick={() => isFriend ? removeFriendMutation.mutate() : addFriendMutation.mutate()}
                    disabled={addFriendMutation.isPending || removeFriendMutation.isPending}
                  >
                    {addFriendMutation.isPending || removeFriendMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isFriend ? (
                      <>
                        <UserMinus className="mr-2 h-4 w-4" />
                        Remove Friend
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Friend
                      </>
                    )}
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleMessage(profile?.id)}
                  >
                    Send Message
                  </Button>
                </div>
              </Card>
            )}

            {friends && friends.length > 0 && (
              <Card className="p-4">
                <Tabs defaultValue="friends">
                  <TabsList className="w-full">
                    <TabsTrigger value="friends" className="flex-1">Friends</TabsTrigger>
                    <TabsTrigger value="mutuals" className="flex-1">Mutuals</TabsTrigger>
                  </TabsList>
                  <TabsContent value="friends">
                    <FriendList
                      friends={friends}
                      onMessage={handleMessage}
                      onRemove={isOwnProfile ? (id) => removeFriendMutation.mutate() : undefined}
                    />
                  </TabsContent>
                  <TabsContent value="mutuals">
                    <FriendList
                      friends={friends.filter((friend: any) => friend.isMutual)}
                      onMessage={handleMessage}
                    />
                  </TabsContent>
                </Tabs>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}