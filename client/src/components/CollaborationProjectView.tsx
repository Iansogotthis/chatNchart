import { useState } from "react";
import { useParams } from "wouter";
import { ChartVisualization } from "./ChartVisualization";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Settings, Settings2, History, Users, MessageSquare, PanelLeftClose, PanelRightClose, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { Project } from "@/types/collaboration";

export function CollaborationProjectView() {
  const { projectId } = useParams();
  const { toast } = useToast();
  const [leftNavOpen, setLeftNavOpen] = useState(true);
  const [rightNavOpen, setRightNavOpen] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const { data: project } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      return response.json();
    },
  });

  const handleTimelineView = async () => {
    const save = window.confirm(
      "Would you like to save this project at its current timestamp before continuing to view this project's timeline?\n\n" +
      "Please note: This will erase all changes to this project since the last timestamp was saved before proceeding to view the project's timeline."
    );

    if (save) {
      try {
        await fetch(`/api/projects/${projectId}/timeline`, {
          method: 'POST',
        });
        setShowTimeline(true);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save timeline",
          variant: "destructive",
        });
      }
    }
  };

  const toggleProjectState = async () => {
    try {
      await fetch(`/api/projects/${projectId}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: isPaused ? 'active' : 'paused' }),
      });
      setIsPaused(!isPaused);
      toast({
        title: isPaused ? "Project Resumed" : "Project Paused",
        description: isPaused 
          ? "Collaborators can now access and edit the project"
          : "Project access has been temporarily restricted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project state",
        variant: "destructive",
      });
    }
  };

  if (!project) return null;

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 grid grid-cols-[auto_1fr_auto]">
        {/* Left Navbar */}
        <Sheet open={leftNavOpen} onOpenChange={setLeftNavOpen}>
          <SheetContent side="left" className="w-[250px] p-0">
            <div className="p-4 space-y-4">
              <h2 className="text-lg font-semibold">Project Tools</h2>
              <Separator />
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={handleTimelineView}
                >
                  <History className="mr-2 h-4 w-4" />
                  Timeline
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <Settings2 className="mr-2 h-4 w-4" />
                  Tools
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Team
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-2 z-10"
            onClick={() => setLeftNavOpen(!leftNavOpen)}
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-10"
            onClick={() => setRightNavOpen(!rightNavOpen)}
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>

          {project.chart && <ChartVisualization chart={project.chart} />}
        </main>

        {/* Right Navbar */}
        <Sheet open={rightNavOpen} onOpenChange={setRightNavOpen}>
          <SheetContent side="right" className="w-[250px] p-0">
            <div className="p-4 space-y-4">
              <h2 className="text-lg font-semibold">Project Settings</h2>
              <Separator />
              <div className="space-y-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Edit Project Priorities
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Project Priorities</DialogTitle>
                    </DialogHeader>
                    {/* Add project priorities form here */}
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Edit Collaborators
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Collaborators</DialogTitle>
                    </DialogHeader>
                    {/* Add collaborator management here */}
                  </DialogContent>
                </Dialog>

                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={toggleProjectState}
                >
                  {isPaused ? (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Present Collaboration
                    </>
                  ) : (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause Collaboration
                    </>
                  )}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* IM Interface */}
      <div className="h-[200px] border-t">
        <div className="flex items-center justify-between p-2 border-b bg-background">
          <h3 className="font-medium">Project Chat</h3>
          <MessageSquare className="h-4 w-4" />
        </div>
        <div className="h-[calc(200px-41px)] grid grid-rows-[1fr_auto]">
          <ScrollArea className="p-2">
            {/* Chat messages will go here */}
          </ScrollArea>
          <div className="p-2 border-t">
            {/* Chat input will go here */}
          </div>
        </div>
      </div>
    </div>
  );
}