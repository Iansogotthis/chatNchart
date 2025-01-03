import { Switch, Route } from "wouter";
import { Loader2 } from "lucide-react";
import { useUser } from "./hooks/use-user";
import { useState } from "react";
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

function App() {
  const { user, isLoading } = useUser();
  const [selectedChart, setSelectedChart] = useState<Chart | null>(null);

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
      <Navbar />
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-[250px,1fr] h-[calc(100vh-4rem)]">
          <ChartsNavigation 
            onSelect={setSelectedChart} 
            selectedChart={selectedChart}
          />
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