import { Switch, Route } from "wouter";
import { Loader2 } from "lucide-react";
import { useUser } from "./hooks/use-user";
import { useState, useEffect } from "react";
import type { Chart } from "../db/schema";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import ForumPage from "./pages/ForumPage";
import MessagesPage from "./pages/MessagesPage";
import FriendsPage from "./pages/FriendsPage";
import AuthPage from "./pages/AuthPage";
import FormView from "./pages/ChartPages/FormView";
import { ChartsNavigation } from "./components/ChartsNavigation";
import { ChartVisualization } from "./components/ChartVisualization";
import Navbar from "./components/Navbar";
import { Toaster } from "sonner";
import { cn } from "./lib/utils";
import { TooltipProvider } from "./components/ui/tooltip";
import { Button } from "./components/ui/button";
import { Moon, Sun, Maximize2, Minimize2 } from "lucide-react";
import { useTheme } from "./hooks/use-theme";

function App() {
  const { user, isLoading } = useUser();
  const [selectedChart, setSelectedChart] = useState<Chart | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (window.innerWidth <= 768 && sidebarOpen) {
        const sidebar = document.querySelector('.side-nav');
        const navToggle = document.querySelector('.nav-toggle');
        if (
          sidebar &&
          !sidebar.contains(event.target as Node) &&
          navToggle &&
          !navToggle.contains(event.target as Node)
        ) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [sidebarOpen]);

  return (
    <TooltipProvider>
      <div className={cn(
        "min-h-screen bg-background transition-colors duration-300",
        "flex flex-col relative"
      )}>
        {isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !user ? (
          <>
            <AuthPage />
            <Toaster />
          </>
        ) : (
          <>
            <Navbar onToggleSidebar={toggleSidebar} />
            <div className="fixed top-4 right-4 z-50 flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-full"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
              {selectedChart && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="rounded-full"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                  <span className="sr-only">Toggle fullscreen</span>
                </Button>
              )}
            </div>
            <div className="flex-1 pt-14">
              <div className={cn(
                "grid h-[calc(100vh-3.5rem)] transition-all duration-300 ease-in-out",
                {
                  'lg:grid-cols-[250px_1fr] grid-cols-[0px_1fr]': sidebarOpen,
                  'grid-cols-[0px_1fr]': !sidebarOpen
                }
              )}>
                <aside className={cn(
                  "side-nav",
                  sidebarOpen ? "open" : "",
                  "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
                )}>
                  <ChartsNavigation 
                    onSelect={setSelectedChart} 
                    selectedChart={selectedChart}
                  />
                </aside>
                <main className={cn(
                  "overflow-auto relative",
                  isFullscreen && selectedChart ? "fixed inset-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" : ""
                )}>
                  <Switch>
                    <Route path="/">
                      {selectedChart ? (
                        <ChartVisualization 
                          chart={selectedChart} 
                          isFullscreen={isFullscreen}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          Select or create a chart to get started
                        </div>
                      )}
                    </Route>
                    <Route path="/form" component={FormView} />
                    <Route path="/profile/:username" component={ProfilePage} />
                    <Route path="/forum" component={ForumPage} />
                    <Route path="/friends" component={FriendsPage} />
                    <Route path="/messages" component={MessagesPage} />
                    <Route>404 Page Not Found</Route>
                  </Switch>
                </main>
              </div>
            </div>
            <Toaster />
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

export default App;