import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";

interface UserDetailsProps {
  user: {
    username: string;
    bio?: string;
    hobbies?: string;
    area?: string;
    favoriteMovie?: string;
    favoriteSong?: string;
    favoriteBook?: string;
    skills?: string;
    field?: string;
    timeInField?: string;
    company?: string;
    position?: string;
    department?: string;
    pointOfView?: string;
  };
  isEditable?: boolean;
  onEdit?: () => void;
}

export function UserDetails({ user, isEditable, onEdit }: UserDetailsProps) {
  return (
    <div className="w-full space-y-6">
      {/* Personal Section */}
      <Card className="backdrop-blur-sm bg-background/95">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {user.username}'s Profile
          </CardTitle>
          <p className="text-sm text-muted-foreground">Personal Information</p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="grid gap-6">
              {/* Top Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold tracking-tight">Hobbies</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {user.hobbies || "Not specified"}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold tracking-tight">Area</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {user.area || "Not specified"}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Favorites Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold tracking-tight">Favorites</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Movie</p>
                    <p className="text-sm text-muted-foreground">
                      {user.favoriteMovie || "Not specified"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Song</p>
                    <p className="text-sm text-muted-foreground">
                      {user.favoriteSong || "Not specified"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Book</p>
                    <p className="text-sm text-muted-foreground">
                      {user.favoriteBook || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Skills Section */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold tracking-tight">Skills</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {user.skills || "Not specified"}
                </p>
              </div>

              {/* Bio Section */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold tracking-tight">Bio</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {user.bio || "No bio provided"}
                </p>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Work Section */}
      <Card className="backdrop-blur-sm bg-background/95">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Work Information</CardTitle>
          <p className="text-sm text-muted-foreground">Professional details and experience</p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold tracking-tight">Field</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {user.field || "Not specified"}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold tracking-tight">Time in Field</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {user.timeInField || "Not specified"}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold tracking-tight">Company</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {user.company || "Not specified"}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold tracking-tight">Position</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {user.position || "Not specified"}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold tracking-tight">Department</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {user.department || "Not specified"}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold tracking-tight">Point of View</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {user.pointOfView || "Not specified"}
                </p>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}