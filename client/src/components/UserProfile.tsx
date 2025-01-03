import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Link } from "wouter";
import { motion } from "framer-motion";
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
  Edit,
  Mail,
  Phone
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

  const professional = user?.professional as Professional || null;

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
    </div>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 py-8">
      {/* Bio Section */}
      <motion.div {...fadeInUp}>
        <Card className="w-full overflow-hidden">
          <CardHeader className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <Avatar className="h-24 w-24 ring-4 ring-primary/10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.username || 'default'}`} />
                  <AvatarFallback>{user?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {user?.username || 'Loading...'}
                  </CardTitle>
                  {user?.bio && (
                    <CardDescription className="max-w-2xl text-base leading-relaxed">
                      {user.bio}
                    </CardDescription>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {user?.email && (
                      <Button variant="outline" size="sm" className="gap-2">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </Button>
                    )}
                    {user?.phone && (
                      <Button variant="outline" size="sm" className="gap-2">
                        <Phone className="h-4 w-4" />
                        {user.phone}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {renderEditButton('Bio')}
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatsCard icon={Calendar} value={formatDate(user?.createdAt)?.split('/')[2] || 'N/A'} label="Member Since" />
              <StatsCard icon={ChartPieIcon} value={totalCharts} label="Charts" />
              <StatsCard icon={Users} value={totalFriends} label="Friends" />
              <StatsCard icon={Share2} value={totalCollaborations} label="Collaborations" />
              <StatsCard icon={Clock} value={formatDate(user?.lastOnline)} label="Last Online" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Personal Information */}
      <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
        <Card className="overflow-hidden">
          <CardHeader>
            <SectionHeader icon={UserCircle} title="Personal Information" />
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Area */}
              <Section
                icon={MapPin}
                title="Location"
                content={
                  user?.city && user?.state
                    ? `${user.city}, ${user.state} ${user.zipCode}`
                    : 'No location provided'
                }
                onEdit={() => onEditSection?.('Area')}
                isOwnProfile={isOwnProfile}
              />

              {/* Social Links */}
              <Section
                icon={Share2}
                title="Social Links"
                content={
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(user?.socials as Record<string, string> || {}).map(([platform, link]) => (
                      link && (
                        <a
                          key={platform}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline bg-primary/5 rounded-lg p-3 transition-colors duration-200"
                        >
                          <span className="capitalize">{platform}</span>
                        </a>
                      )
                    ))}
                  </div>
                }
                onEdit={() => onEditSection?.('Socials')}
                isOwnProfile={isOwnProfile}
              />

              {/* Hobbies & Interests */}
              <Section
                icon={Gamepad2}
                title="Hobbies & Interests"
                content={
                  <div className="flex flex-wrap gap-2">
                    {user?.hobbies?.map((hobby, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200"
                      >
                        {hobby}
                      </Badge>
                    ))}
                  </div>
                }
                onEdit={() => onEditSection?.('Hobbies')}
                isOwnProfile={isOwnProfile}
              />

              {/* Talents */}
              <Section
                icon={Trophy}
                title="Skills & Talents"
                content={
                  <div className="flex flex-wrap gap-2">
                    {user?.talents?.map((talent, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200"
                      >
                        {talent}
                      </Badge>
                    ))}
                  </div>
                }
                onEdit={() => onEditSection?.('Talents')}
                isOwnProfile={isOwnProfile}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Professional Information */}
      <motion.div {...fadeInUp} transition={{ delay: 0.4 }}>
        <Card className="overflow-hidden">
          <CardHeader>
            <SectionHeader icon={Briefcase} title="Professional Information" />
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Career */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Career</h3>
                {professional && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoCard label="Field" value={professional.field} />
                    <InfoCard label="Company" value={professional.company} />
                    <InfoCard label="Position" value={professional.position} />
                    <InfoCard label="Experience" value={professional.experience} />
                  </div>
                )}
                {renderEditButton('Career')}
              </div>

              {/* Certifications */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Certifications</h3>
                <div className="space-y-4">
                  {(user?.certifications as Array<{ company: string; title: string; year: string }> || []).map((cert, index) => (
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
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Featured Charts */}
      {topCharts && topCharts.length > 0 && (
        <motion.div {...fadeInUp} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader>
              <SectionHeader icon={ChartPieIcon} title="Featured Charts" />
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {topCharts.map((chart) => (
                    <Link key={chart.id} href={`/charts/${chart.id}`}>
                      <Card className="cursor-pointer transition-all hover:bg-accent group">
                        <CardContent className="p-4">
                          <h4 className="font-medium group-hover:text-primary transition-colors">
                            {chart.title}
                          </h4>
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
        </motion.div>
      )}
    </div>
  );
}

// Helper Components
const StatsCard = ({ icon: Icon, value, label }: { icon: any; value: string | number; label: string }) => (
  <Card className="bg-primary/5 border-none">
    <CardContent className="pt-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <Icon className="h-5 w-5 text-primary" />
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

const Section = ({
  icon: Icon,
  title,
  content,
  onEdit,
  isOwnProfile
}: {
  icon: any;
  title: string;
  content: React.ReactNode;
  onEdit?: () => void;
  isOwnProfile: boolean;
}) => (
  <div className="space-y-4">
    <h3 className="text-xl font-semibold flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" /> {title}
    </h3>
    <div className="bg-muted/50 rounded-lg p-4">
      {content}
    </div>
    {isOwnProfile && onEdit && (
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        className="w-full text-muted-foreground hover:text-primary hover:bg-primary/10"
      >
        <Edit className="h-4 w-4 mr-2" />
        Edit {title}
      </Button>
    )}
  </div>
);

const InfoCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-primary/5 rounded-lg p-4">
    <p className="font-medium">{label}</p>
    <p className="text-muted-foreground">{value || 'Not specified'}</p>
  </div>
);