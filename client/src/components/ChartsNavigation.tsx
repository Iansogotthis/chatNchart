import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Chart } from '@db/schema';
import type { FC } from 'react';

interface ChartListProps {
  onSelect: (chart: Chart) => void;
}

export const ChartsNavigation: FC<ChartListProps> = ({ onSelect }) => {
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

  return (
    <div className="flex flex-col gap-4 p-4 border-r border-border h-full">
      <Button onClick={handleNewChart} className="w-full">
        New Chart
      </Button>
      
      <div className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading charts...</p>
        ) : charts?.length ? (
          charts.map((chart) => (
            <Button
              key={chart.id}
              variant="ghost"
              className="w-full justify-start"
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
  );
};
