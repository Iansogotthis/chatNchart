import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

interface ProfileProps {
  username: string;
  bio?: string;
  funFacts?: string[];
  topCharts?: { id: number; title: string }[];
  onEditProfile?: () => void;
}

export function UserProfile({
  username,
  bio,
  funFacts,
  topCharts,
  onEditProfile,
}: ProfileProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle>{username}</CardTitle>
              {bio && <p className="text-sm text-muted-foreground">{bio}</p>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {funFacts && funFacts.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Fun Facts</h3>
              <ul className="list-disc pl-4">
                {funFacts.map((fact, i) => (
                  <li key={i}>{fact}</li>
                ))}
              </ul>
            </div>
          )}
          
          {topCharts && topCharts.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="font-semibold">Top Charts</h3>
              <div className="grid gap-4">
                {topCharts.map((chart) => (
                  <Card key={chart.id}>
                    <CardContent className="p-4">
                      <p>{chart.title}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {onEditProfile && (
            <Button onClick={onEditProfile} className="mt-6">
              Edit Profile
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
