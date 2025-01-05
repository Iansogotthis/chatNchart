import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useFriends } from "@/hooks/use-friends";
import { useToast } from "@/hooks/use-toast";
import type { Chart } from "@db/schema";
import type { Friend, CollaboratorAccessLevel } from "@/types/collaboration";
import { useQuery } from "@tanstack/react-query";

interface ProjectCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CollaboratorWithAccess extends Friend {
  selectedAccessLevel: CollaboratorAccessLevel;
}

export function ProjectCreationWizard({ isOpen, onClose }: ProjectCreationWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedChart, setSelectedChart] = useState<Chart | null>(null);
  const [selectedCollaborators, setSelectedCollaborators] = useState<CollaboratorWithAccess[]>([]);
  const [projectName, setProjectName] = useState("");
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const { friends } = useFriends();

  const { data: charts } = useQuery<Chart[]>({
    queryKey: ["charts"],
    queryFn: async () => {
      const response = await fetch("/api/charts");
      if (!response.ok) throw new Error("Failed to fetch charts");
      return response.json();
    },
  });

  const handleCreateProject = async () => {
    try {
      const collaborators = selectedCollaborators.map(c => ({
        id: c.friend?.id || 0,
        username: c.friend?.username || '',
        accessLevel: c.selectedAccessLevel
      }));

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          chartId: selectedChart?.id,
          collaborators
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const project = await response.json();
      toast({
        title: "Success",
        description: "Project created successfully!",
      });
      onClose();
      setLocation(`/collaborations/${project.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      });
    }
  };

  const handleAccessLevelChange = (friendId: number, accessLevel: CollaboratorAccessLevel) => {
    setSelectedCollaborators(prev => 
      prev.map(collab => 
        collab.id === friendId 
          ? { ...collab, selectedAccessLevel: accessLevel }
          : collab
      )
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Select a Chart</h2>
            <ScrollArea className="h-[400px]">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {charts?.map((chart) => (
                  <Card
                    key={chart.id}
                    className={`cursor-pointer transition-all ${
                      selectedChart?.id === chart.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedChart(chart)}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded-lg mb-2" />
                      <h3 className="font-medium">{chart.title || 'Untitled Chart'}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedChart}
              >
                Next: Add Collaborators
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Select Collaborators and Access Levels</h2>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {friends?.map((friend) => {
                  if (!friend.friend) return null;
                  const isSelected = selectedCollaborators.some(c => c.id === friend.id);

                  return (
                    <Card
                      key={friend.id}
                      className={`cursor-pointer transition-all ${
                        isSelected ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => {
                        if (!friend.friend) return;
                        if (isSelected) {
                          setSelectedCollaborators(prev => 
                            prev.filter(c => c.id !== friend.id)
                          );
                        } else {
                          setSelectedCollaborators(prev => [
                            ...prev,
                            { 
                              ...friend,
                              selectedAccessLevel: "editable" as CollaboratorAccessLevel
                            }
                          ]);
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10" />
                            <div>
                              <p className="font-medium">{friend.friend.username || 'Unknown User'}</p>
                              {friend.friend.bio && (
                                <p className="text-sm text-muted-foreground">{friend.friend.bio}</p>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <Select
                              value={selectedCollaborators.find(c => c.id === friend.id)?.selectedAccessLevel}
                              onValueChange={(value: CollaboratorAccessLevel) => 
                                handleAccessLevelChange(friend.id, value)
                              }
                            >
                              <SelectTrigger className="w-[140px]" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                <SelectValue placeholder="Select access" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Access Level</SelectLabel>
                                  <SelectItem value="unlimited">Unlimited</SelectItem>
                                  <SelectItem value="editable">Editable</SelectItem>
                                  <SelectItem value="readable">Readable</SelectItem>
                                  <SelectItem value="prompted">Prompted</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Next: Name Project
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Name Your Project</h2>
            <Input
              placeholder="Enter project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={!projectName.trim()}
              >
                Create Project
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}