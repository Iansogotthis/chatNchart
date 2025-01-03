import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Link } from "wouter";
import { 
  UserCircle,
  Briefcase,
  MapPin,
  Share2,
  Heart,
  Gamepad2,
  Trophy,
  Calendar,
  Users,
  ChartPieIcon,
  Clock,
  Edit
} from "lucide-react";
import type { User, Chart } from "@db/schema";

interface Professional {
  field: string;
  company: string;
  position: string;
  experience: string;
}

interface ProfileProps {
  user: User;
  topCharts?: Chart[];
  totalCharts: number;
  totalFriends: number;
  totalCollaborations: number;
  onEditSection?: (section: string) => void;
  isOwnProfile: boolean;
}

export function UserProfile({
  user,
  topCharts,
  totalCharts,
  totalFriends,
  totalCollaborations,
  onEditSection,
  isOwnProfile,
}: ProfileProps) {
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const renderEditButton = (section: string) => {
    if (!isOwnProfile) return null;
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onEditSection?.(section)}
        className="w-full mt-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
      >
        <Edit className="h-4 w-4 mr-2" />
        Edit {section}
      </Button>
    );
  };

  const professional = user.professional as Professional;

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4">
      {/* Bio Section */}
      <Card className="w-full">
        <CardHeader className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} />
                <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <CardTitle className="text-3xl font-bold tracking-tight">{user.username}</CardTitle>
                {user.bio && (
                  <CardDescription className="max-w-2xl text-base">
                    {user.bio}
                  </CardDescription>
                )}
              </div>
            </div>
          </div>
          {renderEditButton('Bio')}
        </CardHeader>

        <CardContent>
          {/* User Meta Data */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div className="text-2xl font-bold">
                    {formatDate(user.createdAt)?.split('/')[2] || 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">Member Since</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <ChartPieIcon className="h-5 w-5 text-primary" />
                  <div className="text-2xl font-bold">{totalCharts}</div>
                  <p className="text-xs text-muted-foreground">Charts</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <Users className="h-5 w-5 text-primary" />
                  <div className="text-2xl font-bold">{totalFriends}</div>
                  <p className="text-xs text-muted-foreground">Friends</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <Share2 className="h-5 w-5 text-primary" />
                  <div className="text-2xl font-bold">{totalCollaborations}</div>
                  <p className="text-xs text-muted-foreground">Collaborations</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <Clock className="h-5 w-5 text-primary" />
                  <div className="text-sm font-medium">{formatDate(user.lastOnline)}</div>
                  <p className="text-xs text-muted-foreground">Last Online</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <UserCircle className="h-6 w-6 text-primary" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Area */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Area
              </h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-muted-foreground">
                  {user.city && user.state ? 
                    `${user.city}, ${user.state} ${user.zipCode}` : 
                    'No location provided'}
                </p>
              </div>
              {renderEditButton('Area')}
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" /> Social Links
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(user.socials as Record<string, string>).map(([platform, link]) => (
                  link && (
                    <a 
                      key={platform} 
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline bg-primary/5 rounded-lg p-3"
                    >
                      <span className="capitalize">{platform}</span>
                    </a>
                  )
                ))}
              </div>
              {renderEditButton('Socials')}
            </div>

            {/* Favorites */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" /> Favorites
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(user.favorites as Record<string, string>).map(([category, item]) => (
                  item && (
                    <div key={category} className="bg-primary/5 rounded-lg p-3">
                      <span className="font-medium capitalize">{category}: </span>
                      <span className="text-muted-foreground">{item}</span>
                    </div>
                  )
                ))}
              </div>
              {renderEditButton('Favorites')}
            </div>

            {/* Hobbies */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-primary" /> Hobbies
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.hobbies?.map((hobby, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    {hobby}
                  </Badge>
                ))}
              </div>
              {renderEditButton('Hobbies')}
            </div>

            {/* Talents */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" /> Talents
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.talents?.map((talent, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    {talent}
                  </Badge>
                ))}
              </div>
              {renderEditButton('Talents')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Briefcase className="h-6 w-6 text-primary" />
            Professional Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Career */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Career</h3>
              {professional && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-primary/5 rounded-lg p-4">
                    <p className="font-medium">Field</p>
                    <p className="text-muted-foreground">{professional.field || 'Not specified'}</p>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-4">
                    <p className="font-medium">Company</p>
                    <p className="text-muted-foreground">{professional.company || 'Not specified'}</p>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-4">
                    <p className="font-medium">Position</p>
                    <p className="text-muted-foreground">{professional.position || 'Not specified'}</p>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-4">
                    <p className="font-medium">Experience</p>
                    <p className="text-muted-foreground">{professional.experience || 'Not specified'}</p>
                  </div>
                </div>
              )}
              {renderEditButton('Career')}
            </div>

            {/* Certifications */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Certifications</h3>
              <div className="space-y-4">
                {(user.certifications as Array<{ company: string; title: string; year: string }>)?.map((cert, index) => (
                  <Card key={index} className="bg-primary/5 border-none">
                    <CardContent className="p-4 space-y-2">
                      <p><span className="font-medium">Company:</span> {cert.company}</p>
                      <p><span className="font-medium">Title:</span> {cert.title}</p>
                      <p><span className="font-medium">Year:</span> {cert.year}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {renderEditButton('Certifications')}
            </div>

            {/* Resume */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Resume</h3>
              <div className="bg-primary/5 rounded-lg p-4">
                {user.resumeUrl ? (
                  <a 
                    href={user.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    View Resume
                  </a>
                ) : (
                  <p className="text-muted-foreground">No resume uploaded</p>
                )}
              </div>
              {renderEditButton('Resume')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Featured Charts */}
      {topCharts && topCharts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <ChartPieIcon className="h-6 w-6 text-primary" />
              Featured Charts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {topCharts.map((chart) => (
                  <Link key={chart.id} href={`/charts/${chart.id}`}>
                    <Card className="cursor-pointer transition-all hover:bg-accent">
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
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}