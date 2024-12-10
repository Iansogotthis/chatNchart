import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';

interface Square {
  className: string;
  size: number;
  children?: Square[];
}

type SquareClass = 'root' | 'branch' | 'leaf' | 'fruit';

export default function ScopedView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeClass, setActiveClass] = useState<SquareClass>('root');
  
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    const width = window.innerWidth * 0.9;
    const height = window.innerHeight * 0.9;
    const centerX = width / 2;
    const centerY = height / 2;
    const centerSquareSize = Math.min(width, height) / 2;
    const smallSquareSize = centerSquareSize / 2;
    const smallestSquareSize = smallSquareSize / 2;
    const tinySquareSize = smallestSquareSize / 2;
    
    svg.attr("viewBox", `0 0 ${width} ${height}`)
       .attr("preserveAspectRatio", "xMidYMid meet");

    function drawSquare(
      x: number,
      y: number,
      size: number,
      className: SquareClass,
      depth: number = 0
    ) {
      // Skip drawing if not matching active class
      if (className !== activeClass) return;

      const rect = svg.append("rect")
        .attr("x", x - size / 2)
        .attr("y", y - size / 2)
        .attr("width", size)
        .attr("height", size)
        .attr("class", `square ${className}`)
        .attr("rx", 4)
        .attr("ry", 4);

      svg.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("font-size", size / 5)
        .attr("pointer-events", "none")
        .text(className);

      if (size > tinySquareSize) {
        const nextSize = size / 2;
        const offset = size * 0.6;
        const corners = [
          [x - offset, y - offset],
          [x + offset, y - offset],
          [x - offset, y + offset],
          [x + offset, y + offset],
        ];

        const nextClass = depth === 0 ? 'branch' : depth === 1 ? 'leaf' : 'fruit';

        corners.forEach((corner) => {
          requestAnimationFrame(() => {
            drawSquare(corner[0], corner[1], nextSize, nextClass as SquareClass, depth + 1);
          });
        });
      }
    }

    // Draw initial square
    drawSquare(centerX, centerY, centerSquareSize, 'root');
  }, [activeClass]);

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4 space-x-2">
        <Button 
          onClick={() => setActiveClass('root')}
          variant={activeClass === 'root' ? 'default' : 'outline'}
          size="sm"
        >
          Root
        </Button>
        <Button 
          onClick={() => setActiveClass('branch')}
          variant={activeClass === 'branch' ? 'default' : 'outline'}
          size="sm"
        >
          Branch
        </Button>
        <Button 
          onClick={() => setActiveClass('leaf')}
          variant={activeClass === 'leaf' ? 'default' : 'outline'}
          size="sm"
        >
          Leaf
        </Button>
        <Button 
          onClick={() => setActiveClass('fruit')}
          variant={activeClass === 'fruit' ? 'default' : 'outline'}
          size="sm"
        >
          Fruit
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
