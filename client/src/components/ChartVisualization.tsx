import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import * as d3 from 'd3';
import { Square, initialData } from '@/lib/chartData';
import SquareModal from './SquareModal';

type ViewType = 'scaled' | 'scoped' | 'included-build';

interface ChartState {
  selectedSquare: Square | null;
  currentView: ViewType;
  viewBox: string;
}

export function ChartVisualization() {
  const [state, setState] = useState<ChartState>({
    selectedSquare: null,
    currentView: 'scaled',
    viewBox: '0 0 1000 1000'
  });
  const svgRef = useRef<SVGSVGElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 1000;
    const height = 1000;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const centerX = innerWidth / 2;
    const centerY = innerHeight / 2;
    const squareSize = Math.min(innerWidth, innerHeight) / 2;

    function drawSquare(x: number, y: number, size: number, data: Square) {
      const g = svg.append("g")
        .attr("transform", `translate(${x},${y})`);

      g.append("rect")
        .attr("x", -size / 2)
        .attr("y", -size / 2)
        .attr("width", size)
        .attr("height", size)
        .attr("fill", data.color)
        .attr("stroke", data.style?.borderColor || "black")
        .attr("stroke-width", data.style?.borderWidth || 1)
        .attr("stroke-dasharray", data.style?.borderStyle === "dashed" ? "5,5" : null)
        .style("cursor", "pointer")
        .on("click", () => {
          setState(prev => ({ ...prev, selectedSquare: data }));
          setIsModalOpen(true);
        });

      g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.3em")
        .attr("fill", data.style?.textColor || "black")
        .style("font-weight", data.style?.textStyle?.bold ? "bold" : "normal")
        .style("font-style", data.style?.textStyle?.italic ? "italic" : "normal")
        .style("text-decoration", data.style?.textStyle?.underline ? "underline" : "none")
        .text(data.name);

      if (data.children) {
        const childSize = size / 2;
        data.children.forEach((child, i) => {
          const angle = (i * Math.PI * 2) / data.children!.length;
          const childX = x + Math.cos(angle) * size;
          const childY = y + Math.sin(angle) * size;
          drawSquare(childX, childY, childSize, child);
        });
      }
    }

    drawSquare(centerX, centerY, squareSize, initialData);
  }, [state.currentView]);

  const handleSquareUpdate = (updatedData: any) => {
    // Here we would update the square data in our state/database
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-4">
      <div className="flex justify-center space-x-4">
        <Button
          onClick={() => setState(prev => ({ ...prev, currentView: 'scaled' }))}
          variant={state.currentView === 'scaled' ? 'default' : 'outline'}
          className="w-32"
        >
          Scaled View
        </Button>
        <Button
          onClick={() => setState(prev => ({ ...prev, currentView: 'scoped' }))}
          variant={state.currentView === 'scoped' ? 'default' : 'outline'}
          className="w-32"
        >
          Scoped View
        </Button>
        <Button
          onClick={() => setState(prev => ({ ...prev, currentView: 'included-build' }))}
          variant={state.currentView === 'included-build' ? 'default' : 'outline'}
          className="w-32"
        >
          Include Build
        </Button>
      </div>
      <div className="flex-1 min-h-0 border rounded-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-md">
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox={state.viewBox}
          preserveAspectRatio="xMidYMid meet"
        />
      </div>
      {state.selectedSquare && (
        <SquareModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSquareUpdate}
          initialData={{
            title: state.selectedSquare.name,
            priority: {
              density: 1,
              durability: 'single',
              decor: state.selectedSquare.style?.borderColor || '#000000'
            },
            urgency: state.selectedSquare.style?.urgency || 'black',
            aesthetic: {
              impact: {
                bold: state.selectedSquare.style?.textStyle?.bold || false,
                italic: state.selectedSquare.style?.textStyle?.italic || false,
                underline: state.selectedSquare.style?.textStyle?.underline || false
              },
              affect: {
                fontFamily: 'Arial',
                fontSize: 14
              },
              effect: {
                color: state.selectedSquare.style?.textColor || '#000000'
              }
            },
            viewMode: state.currentView
          }}
        />
      )}
    </div>
  );
}