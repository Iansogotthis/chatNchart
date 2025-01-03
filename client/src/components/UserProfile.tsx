import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import type { Chart } from "@db/schema";
import { Link } from "wouter";

interface ProfileProps {
  username: string;
  bio?: string;
  funFacts?: string[];
  topCharts?: Chart[];
  joinedDate?: string | Date;
  totalCharts?: number;
  totalCollaborations?: number;
  badges?: string[];
  onEditProfile?: () => void;
}

export function UserProfile({
  username,
  bio,
  funFacts,
  topCharts,
  joinedDate,
  totalCharts = 0,
  totalCollaborations = 0,
  badges = [],
  onEditProfile,
}: ProfileProps) {
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`} />
                <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <CardTitle className="text-2xl">{username}</CardTitle>
                {bio && <CardDescription className="max-w-md">{bio}</CardDescription>}
              </div>
            </div>
            {onEditProfile && (
              <Button onClick={onEditProfile} variant="outline">
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{totalCharts}</div>
                  <p className="text-xs text-muted-foreground">Total Charts</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{totalCollaborations}</div>
                  <p className="text-xs text-muted-foreground">Collaborations</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{topCharts?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Featured Charts</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{badges.length}</div>
                  <p className="text-xs text-muted-foreground">Achievements</p>
                </CardContent>
              </Card>
            </div>

            {badges.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Badges</h3>
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge, index) => (
                    <Badge key={index} variant="secondary">
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {funFacts && funFacts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">About Me</h3>
                <Card>
                  <CardContent className="pt-6">
                    <ul className="list-disc pl-4 space-y-2">
                      {funFacts.map((fact, i) => (
                        <li key={i} className="text-muted-foreground">
                          {fact}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {topCharts && topCharts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Featured Charts</h3>
                <ScrollArea className="h-[400px] rounded-md border">
                  <div className="p-4 space-y-4">
                    {topCharts.map((chart) => (
                      <Link key={chart.id} href={`/?chart=${chart.id}`}>
                        <Card className="cursor-pointer transition-colors hover:bg-accent">
                          <CardContent className="p-4">
                            <h4 className="font-medium">{chart.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              Last updated: {formatDate(chart.updatedAt)}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                  <Separator className="my-2" />
                  {joinedDate && (
                    <p className="text-xs text-center text-muted-foreground pb-4">
                      Member since {formatDate(joinedDate)}
                    </p>
                  )}
                </ScrollArea>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}