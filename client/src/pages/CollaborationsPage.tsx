import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { Plus, Users, Timeline, Settings, Tool } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import type { Chart } from "@db/schema";

export default function CollaborationsPage({ params }: { params?: Record<string, string> }) {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const [activeProjects, setActiveProjects] = useState<any[]>([]);

  const handleCreateProject = () => {
    // This will be implemented in the next step
    // It will open the project creation flow
    setLocation("/collaborations/new");
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Collaborations</h1>
          <Button onClick={handleCreateProject} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {activeProjects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Projects</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Start a new collaboration project by selecting one of your charts as a starting point.
              </p>
              <Button onClick={handleCreateProject} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Project details will be implemented in next step */}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}