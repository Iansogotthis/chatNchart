import { ChartVisualization } from "@/components/ChartVisualization";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";

export default function HomePage() {
  const { toast } = useToast();

  const { data: chartData, isLoading } = useQuery({
    queryKey: ["/api/charts"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/charts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save chart");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Chart saved successfully",
      });
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Chart Visualization</h1>
        <Button onClick={() => saveMutation.mutate(chartData)}>Save Chart</Button>
      </div>

      <div className="h-[80vh] border rounded-lg p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            Loading chart...
          </div>
        ) : (
          <ChartVisualization data={chartData} onSave={saveMutation.mutate} />
        )}
      </div>
    </div>
  );
}
