import { useUser } from "@/hooks/use-user";
import { UserProfile } from "@/components/UserProfile";
import { ProfileEditForm } from "@/components/ProfileEditForm";
import { FriendList } from "@/components/FriendList";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, UserPlus, UserMinus } from "lucide-react";
import { useState } from "react";

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

export default function ProfilePage() {
  const { username } = useParams();
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editSection, setEditSection] = useState<string | null>(null);

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: [`/api/users/${username}`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    }
  });

  const { data: friends, isLoading: isLoadingFriends } = useQuery<Friend[]>({
    queryKey: [`/api/users/${username}/friends`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}/friends`);
      if (!response.ok) throw new Error('Failed to fetch friends');
      return response.json();
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ section, data }: { section: string; data: any }) => {
      const response = await fetch(`/api/users/${username}/profile/${section}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}`] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setEditSection(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
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

  if (isLoadingProfile || isLoadingFriends) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isOwnProfile = user?.username === username;
  const isFriend = friends?.some((friend) => friend.friend?.username === user?.username);

  if (editSection) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <ProfileEditForm
          section={editSection}
          initialData={profile}
          onSave={async (data) => {
            await updateProfileMutation.mutateAsync({ section: editSection.toLowerCase(), data });
          }}
          onCancel={() => setEditSection(null)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <div className="grid gap-6 px-4">
        <div className="grid gap-6 md:grid-cols-7">
          <div className="md:col-span-5">
            <UserProfile
              user={profile}
              topCharts={profile?.topCharts}
              totalCharts={profile?.topCharts?.length || 0}
              totalFriends={friends?.length || 0}
              totalCollaborations={profile?.totalCollaborations || 0}
              onEditSection={isOwnProfile ? setEditSection : undefined}
              isOwnProfile={isOwnProfile}
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
                </div>
              </Card>
            )}

            <Card className="p-4">
              <CardHeader>
                <CardTitle>Friends ({friends?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {friends?.map((friendship) => (
                      <Card key={friendship.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${friendship.friend?.username}`} />
                              <AvatarFallback>{friendship.friend?.username?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <Link href={`/profile/${friendship.friend?.username}`}>
                                <h3 className="font-medium hover:underline">{friendship.friend?.username}</h3>
                              </Link>
                              {friendship.friend?.bio && (
                                <p className="text-sm text-muted-foreground">{friendship.friend.bio}</p>
                              )}
                            </div>
                          </div>
                          {isOwnProfile && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFriendMutation.mutate(friendship.id)}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}