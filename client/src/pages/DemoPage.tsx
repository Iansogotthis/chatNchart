
import { ChartVisualization } from "@/components/ChartVisualization";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/utils/cn";

export default function DemoPage() {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["/api/charts"],
  });

  return (
    <div>
      <section className={cn(
        "py-16 px-4 bg-muted/50",
        "lg:min-h-[calc(100vh-4rem)]",
        "flex items-center"
      )}>
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-8">Interactive Demo</h1>
          <div className="bg-background rounded-lg shadow-lg p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-[800px]">
                Loading demo...
              </div>
            ) : (
              <div className="h-[800px]">
                <ChartVisualization chart={chartData} />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
