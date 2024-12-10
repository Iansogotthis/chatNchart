import { useUser } from "@/hooks/use-user";
import { UserProfile } from "@/components/UserProfile";
import { FriendList } from "@/components/FriendList";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";

export default function ProfilePage() {
  const { username } = useParams();
  const { user } = useUser();
  const { toast } = useToast();

  const { data: profile } = useQuery({
    queryKey: [`/api/users/${username}`],
  });

  const { data: friends } = useQuery({
    queryKey: [`/api/users/${username}/friends`],
  });

  const handleMessage = (friendId: number) => {
    toast({
      title: "Message sent",
      description: "Messaging feature coming soon!",
    });
  };

  const isOwnProfile = user?.username === username;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <UserProfile
          username={profile?.username || ""}
          bio={profile?.bio}
          funFacts={profile?.funFacts}
          topCharts={profile?.topCharts}
          onEditProfile={isOwnProfile ? () => {} : undefined}
        />
      </div>
      
      <div>
        <FriendList
          friends={friends || []}
          onMessage={handleMessage}
          onRemove={isOwnProfile ? () => {} : undefined}
        />
      </div>
    </div>
  );
}
