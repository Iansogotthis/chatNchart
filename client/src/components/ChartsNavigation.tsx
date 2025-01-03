import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Chart } from '@db/schema';
import type { FC } from 'react';
import { Save, Plus, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface ChartListProps {
  onSelect: (chart: Chart) => void;
  selectedChart: Chart | null;
}

export const ChartsNavigation: FC<ChartListProps> = ({ onSelect, selectedChart }) => {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: charts, isLoading } = useQuery<Chart[]>({
    queryKey: ['charts'],
    queryFn: async () => {
      const response = await fetch('/api/charts');
      if (!response.ok) throw new Error('Failed to fetch charts');
      return response.json();
    },
  });

  const saveChartMutation = useMutation({
    mutationFn: async (chart: Chart) => {
      const response = await fetch(`/api/charts/${chart.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chart),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to save chart');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charts'] });
      toast.success('Chart saved successfully');
    },
    onError: (error) => {
      console.error('Error saving chart:', error);
      toast.error('Failed to save chart');
    }
  });

  const createChartMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/charts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Chart',
          data: {},
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create new chart');
      }

      return response.json();
    },
    onSuccess: (newChart) => {
      queryClient.invalidateQueries({ queryKey: ['charts'] });
      onSelect(newChart);
      toast.success('New chart created');
    },
    onError: (error) => {
      console.error('Error creating new chart:', error);
      toast.error('Failed to create new chart');
    }
  });

  return (
    <div className="flex flex-col h-full border-r border-border">
      <div className="p-4 border-b border-border flex gap-2">
        <Button 
          onClick={() => createChartMutation.mutate()} 
          className="flex-1 gap-2"
          disabled={createChartMutation.isPending}
        >
          {createChartMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          New Chart
        </Button>
        <Button 
          onClick={() => selectedChart && saveChartMutation.mutate(selectedChart)} 
          disabled={!selectedChart || saveChartMutation.isPending}
          variant="outline"
          size="icon"
          title="Save Chart"
        >
          {saveChartMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div className="text-sm font-medium text-muted-foreground">
            My Charts
          </div>
          <Separator className="my-2" />
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : charts?.length ? (
              charts.map((chart) => (
                <Button
                  key={chart.id}
                  variant={selectedChart?.id === chart.id ? 'default' : 'ghost'}
                  className="w-full justify-start font-normal"
                  onClick={() => onSelect(chart)}
                >
                  {chart.title}
                </Button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No charts yet</p>
            )}
          </div>
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
};