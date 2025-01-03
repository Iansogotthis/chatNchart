import { Switch, Route } from "wouter";
import { Loader2 } from "lucide-react";
import { useUser } from "./hooks/use-user";
import { useState, useEffect } from "react";
import type { Chart } from "@db/schema";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import ForumPage from "./pages/ForumPage";
import MessagesPage from "./pages/MessagesPage";
import AuthPage from "./pages/AuthPage";
import FormView from "./pages/ChartPages/FormView";
import { ChartsNavigation } from "./components/ChartsNavigation";
import { ChartVisualization } from "./components/ChartVisualization";
import Navbar from "./components/Navbar";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

function App() {
  const { user, isLoading } = useUser();
  const [selectedChart, setSelectedChart] = useState<Chart | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Add smooth scrolling to the root element
    if (typeof document !== 'undefined') {
      document.documentElement.style.scrollBehavior = 'smooth';
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthPage />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 pt-14">
        <div className="grid h-[calc(100vh-3.5rem)] transition-[grid-template-columns] duration-300 ease-in-out" 
             style={{ 
               gridTemplateColumns: sidebarOpen ? '250px 1fr' : '0px 1fr'
             }}>
          <div className={cn(
            "overflow-hidden transition-all duration-300",
            sidebarOpen ? "w-[250px]" : "w-0"
          )}>
            <ChartsNavigation 
              onSelect={setSelectedChart} 
              selectedChart={selectedChart}
            />
          </div>
          <main className="overflow-auto">
            <Switch>
              <Route path="/">
                {selectedChart ? (
                  <ChartVisualization chart={selectedChart} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Select or create a chart to get started
                  </div>
                )}
              </Route>
              <Route path="/form" component={FormView} />
              <Route path="/profile/:username" component={ProfilePage} />
              <Route path="/forum" component={ForumPage} />
              <Route path="/messages" component={MessagesPage} />
              <Route>404 Page Not Found</Route>
            </Switch>
          </main>
        </div>
      </div>
      <Toaster />
    </div>
  );
}

export default App;