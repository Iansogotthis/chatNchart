import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';

interface Square {
  className: string;
  size: number;
  children?: Square[];
  included?: boolean;
}

interface SquareState {
  id: string;
  included: boolean;
}

export default function IncludeBuildView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [includedSquares, setIncludedSquares] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    const width = window.innerWidth * 0.9;
    const height = window.innerHeight * 0.9;
    const centerX = width / 2;
    const centerY = height / 2;
    const centerSquareSize = Math.min(width, height) / 2;
    
    svg.attr("viewBox", `0 0 ${width} ${height}`)
       .attr("preserveAspectRatio", "xMidYMid meet");

    function drawSquare(
      x: number,
      y: number,
      size: number,
      className: string,
      depth: number,
      parentId: string = ''
    ) {
      const squareId = `${parentId}${depth}`;
      const included = includedSquares[squareId] ?? true;

      const group = svg.append("g")
        .attr("class", "square-group");

      const rect = group.append("rect")
        .attr("x", x - size / 2)
        .attr("y", y - size / 2)
        .attr("width", size)
        .attr("height", size)
        .attr("class", `square ${className}`)
        .attr("rx", 4)
        .attr("ry", 4)
        .style("opacity", included ? 1 : 0.3)
        .style("cursor", "pointer");

      rect.on("click", () => {
        setIncludedSquares(prev => ({
          ...prev,
          [squareId]: !included
        }));
      });

      group.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("font-size", size / 5)
        .attr("pointer-events", "none")
        .text(className);

      if (depth < 3) {
        const childSize = size * 0.4;
        const offset = size * 0.6;
        
        const childPositions = [
          [x - offset, y - offset],
          [x + offset, y - offset],
          [x - offset, y + offset],
          [x + offset, y + offset],
        ];

        const nextClass = depth === 0 ? 'branch' : depth === 1 ? 'leaf' : 'fruit';

        childPositions.forEach((pos, i) => {
          requestAnimationFrame(() => {
            drawSquare(pos[0], pos[1], childSize, nextClass, depth + 1, `${squareId}-${i}`);
          });
        });
      }
    }

    // Draw initial square
    drawSquare(centerX, centerY, centerSquareSize, 'root', 0);
  }, [includedSquares]);

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4">
        <Button 
          onClick={() => setIncludedSquares({})}
          variant="outline"
          size="sm"
        >
          Reset Inclusion
        </Button>
      </div>
      <svg 
        ref={svgRef} 
        className="w-full h-full" 
        style={{ backgroundColor: '#f8fafc' }}
      />
    </div>
  );
}
