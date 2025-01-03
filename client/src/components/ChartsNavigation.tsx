import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { Chart } from '@db/schema';
import type { FC } from 'react';
import { Save, Plus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ChartListProps {
  onSelect: (chart: Chart) => void;
  selectedChart: Chart | null;
}

export const ChartsNavigation: FC<ChartListProps> = ({ onSelect, selectedChart }) => {
  const [, setLocation] = useLocation();

  const { data: charts, isLoading } = useQuery<Chart[]>({
    queryKey: ['charts'],
    queryFn: async () => {
      const response = await fetch('/api/charts');
      if (!response.ok) throw new Error('Failed to fetch charts');
      return response.json();
    },
  });

  const handleNewChart = async () => {
    try {
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
        throw new Error('Failed to create new chart');
      }

      const newChart = await response.json();
      onSelect(newChart);
    } catch (error) {
      console.error('Error creating new chart:', error);
    }
  };

  const handleSaveChart = async () => {
    if (!selectedChart) return;

    try {
      const response = await fetch(`/api/charts/${selectedChart.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedChart),
      });

      if (!response.ok) {
        throw new Error('Failed to save chart');
      }
    } catch (error) {
      console.error('Error saving chart:', error);
    }
  };

  return (
    <div className="flex flex-col h-full border-r border-border">
      <div className="p-4 border-b border-border flex gap-2">
        <Button onClick={handleNewChart} className="flex-1 gap-2">
          <Plus className="h-4 w-4" />
          New Chart
        </Button>
        <Button 
          onClick={handleSaveChart} 
          disabled={!selectedChart}
          variant="outline"
          size="icon"
          title="Save Chart"
        >
          <Save className="h-4 w-4" />
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
              <p className="text-sm text-muted-foreground">Loading charts...</p>
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