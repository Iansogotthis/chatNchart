import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChartVisualization } from "@/components/ChartVisualization";
import { PerplexityChat } from "@/components/PerplexityChat";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart3, BrainCircuit, Users, Share2 } from "lucide-react";

export default function HomePage() {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["/api/charts"],
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold mb-6"
          >
            Visualize Your Data Journey
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          >
            Create, analyze, and share interactive charts with AI-powered
            insights
          </motion.p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto grid md:grid-cols-3 gap-8">
          <Card className="p-6">
            <CardContent className="space-y-4">
              <BarChart3 className="h-12 w-12 text-primary" />
              <h3 className="text-xl font-semibold">Advanced Visualization</h3>
              <p className="text-muted-foreground">
                Create stunning interactive charts and graphs
              </p>
            </CardContent>
          </Card>
          <Card className="p-6">
            <CardContent className="space-y-4">
              <BrainCircuit className="h-12 w-12 text-primary" />
              <h3 className="text-xl font-semibold">AI Analysis</h3>
              <p className="text-muted-foreground">
                Get intelligent insights with Perplexity integration
              </p>
            </CardContent>
          </Card>
          <Card className="p-6">
            <CardContent className="space-y-4">
              <Share2 className="h-12 w-12 text-primary" />
              <h3 className="text-xl font-semibold">Easy Sharing</h3>
              <p className="text-muted-foreground">
                Collaborate and share your visualizations
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Live Demo</h2>
          <a
            href="/demo"
            className="block transition-transform hover:scale-[1.02]"
          >
            <div className="bg-background rounded-lg shadow-lg p-6 cursor-pointer">
              <div className="aspect-video bg-muted/30 rounded-md flex items-center justify-center">
                <p className="text-xl">Click to try the interactive demo</p>
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* AI Chat Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Ask AI Assistant
          </h2>
          <PerplexityChat />
        </div>
      </section>
    </div>
  );
}
