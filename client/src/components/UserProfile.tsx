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
  Clock
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
        variant="outline" 
        size="sm" 
        onClick={() => onEditSection?.(section)}
        className="mt-2"
      >
        Edit {section}
      </Button>
    );
  };

  const professional = user.professional as Professional;

  return (
    <div className="space-y-6">
      {/* Bio Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} />
                <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <CardTitle className="text-2xl">{user.username}</CardTitle>
                {user.bio && <CardDescription className="max-w-md">{user.bio}</CardDescription>}
              </div>
            </div>
          </div>
          {renderEditButton('Bio')}
        </CardHeader>

        <CardContent>
          {/* User Meta Data */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <div className="text-2xl font-bold">
                    {formatDate(user.createdAt)?.split('/')[2] || 'N/A'}
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground">Member Since</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2">
                  <ChartPieIcon className="h-4 w-4" />
                  <div className="text-2xl font-bold">{totalCharts}</div>
                </div>
                <p className="text-xs text-center text-muted-foreground">Charts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2">
                  <Users className="h-4 w-4" />
                  <div className="text-2xl font-bold">{totalFriends}</div>
                </div>
                <p className="text-xs text-center text-muted-foreground">Friends</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2">
                  <Share2 className="h-4 w-4" />
                  <div className="text-2xl font-bold">{totalCollaborations}</div>
                </div>
                <p className="text-xs text-center text-muted-foreground">Collaborations</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4" />
                  <div className="text-2xl font-bold">{formatDate(user.lastOnline)}</div>
                </div>
                <p className="text-xs text-center text-muted-foreground">Last Online</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Area */}
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Area
              </h3>
              <p className="text-muted-foreground">
                {user.city && user.state ? 
                  `${user.city}, ${user.state} ${user.zipCode}` : 
                  'No location provided'}
              </p>
              {renderEditButton('Area')}
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Share2 className="h-4 w-4" /> Social Links
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(user.socials as Record<string, string>).map(([platform, link]) => (
                  link && (
                    <a 
                      key={platform} 
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </a>
                  )
                ))}
              </div>
              {renderEditButton('Socials')}
            </div>

            {/* Favorites */}
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Heart className="h-4 w-4" /> Favorites
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(user.favorites as Record<string, string>).map(([category, item]) => (
                  item && (
                    <div key={category}>
                      <span className="font-medium">{category}: </span>
                      <span className="text-muted-foreground">{item}</span>
                    </div>
                  )
                ))}
              </div>
              {renderEditButton('Favorites')}
            </div>

            {/* Hobbies */}
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Gamepad2 className="h-4 w-4" /> Hobbies
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.hobbies?.map((hobby, index) => (
                  <Badge key={index} variant="secondary">{hobby}</Badge>
                ))}
              </div>
              {renderEditButton('Hobbies')}
            </div>

            {/* Talents */}
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Trophy className="h-4 w-4" /> Talents
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.talents?.map((talent, index) => (
                  <Badge key={index} variant="secondary">{talent}</Badge>
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
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Professional Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Career */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Career</h3>
              {professional && (
                <div className="space-y-2">
                  <p><span className="font-medium">Field:</span> {professional.field || 'Not specified'}</p>
                  <p><span className="font-medium">Company:</span> {professional.company || 'Not specified'}</p>
                  <p><span className="font-medium">Position:</span> {professional.position || 'Not specified'}</p>
                  <p><span className="font-medium">Experience:</span> {professional.experience || 'Not specified'}</p>
                </div>
              )}
              {renderEditButton('Career')}
            </div>

            {/* Certifications */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Certifications</h3>
              <div className="space-y-2">
                {(user.certifications as Array<{ company: string; title: string; year: string }>)?.map((cert, index) => (
                  <div key={index} className="p-2 border rounded">
                    <p><span className="font-medium">Company:</span> {cert.company}</p>
                    <p><span className="font-medium">Title:</span> {cert.title}</p>
                    <p><span className="font-medium">Year:</span> {cert.year}</p>
                  </div>
                ))}
              </div>
              {renderEditButton('Certifications')}
            </div>

            {/* Resume */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Resume</h3>
              {user.resumeUrl ? (
                <a 
                  href={user.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  View Resume
                </a>
              ) : (
                <p className="text-muted-foreground">No resume uploaded</p>
              )}
              {renderEditButton('Resume')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Featured Charts */}
      {topCharts && topCharts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Featured Charts</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
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
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}