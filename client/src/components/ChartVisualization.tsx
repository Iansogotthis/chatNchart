import { useState } from 'react';
import { Button } from './ui/button';
import ScaledView from '@/pages/ChartPages/ScaledView';
import ScopedView from '@/pages/ChartPages/ScopedView';
import IncludeBuildView from '@/pages/ChartPages/IncludeBuildView';

type ViewType = 'scaled' | 'scoped' | 'include';

export function ChartVisualization() {
  const [currentView, setCurrentView] = useState<ViewType>('scaled');

  const renderView = () => {
    switch (currentView) {
      case 'scaled':
        return <ScaledView />;
      case 'scoped':
        return <ScopedView />;
      case 'include':
        return <IncludeBuildView />;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-4">
      <div className="flex justify-center space-x-4">
        <Button
          onClick={() => setCurrentView('scaled')}
          variant={currentView === 'scaled' ? 'default' : 'outline'}
          className="w-32"
        >
          Scaled View
        </Button>
        <Button
          onClick={() => setCurrentView('scoped')}
          variant={currentView === 'scoped' ? 'default' : 'outline'}
          className="w-32"
        >
          Scoped View
        </Button>
        <Button
          onClick={() => setCurrentView('include')}
          variant={currentView === 'include' ? 'default' : 'outline'}
          className="w-32"
        >
          Include Build
        </Button>
      </div>
      <div className="flex-1 min-h-0 border rounded-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-md">
        {renderView()}
      </div>
    </div>
  );
}