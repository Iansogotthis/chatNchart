
import { ChartVisualization } from "@/components/ChartVisualization";
import { useQuery } from "@tanstack/react-query";

export default function DemoPage() {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["/api/charts"],
  });

  return (
    <div className="container mx-auto p-6">
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
  );
}
