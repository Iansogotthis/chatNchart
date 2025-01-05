import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { Plus, Users, Settings, Edit } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ProjectCreationWizard } from "@/components/ProjectCreationWizard";
import { useQuery } from "@tanstack/react-query";
import type { Project } from "@/types/collaboration";

export default function CollaborationsPage() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
  });

  const handleEditProject = (projectId: number) => {
    setLocation(`/collaborations/${projectId}/settings`);
  };

  const handleOpenProject = (projectId: number) => {
    setLocation(`/collaborations/${projectId}`);
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
          <Button onClick={() => setIsCreateProjectOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Projects</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Start a new collaboration project by selecting one of your charts as a starting point.
              </p>
              <Button onClick={() => setIsCreateProjectOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded-lg mb-4" />
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenProject(project.id)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Open Project
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProject(project.id)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Project
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <ProjectCreationWizard
          isOpen={isCreateProjectOpen}
          onClose={() => setIsCreateProjectOpen(false)}
        />
      </motion.div>
    </div>
  );
}