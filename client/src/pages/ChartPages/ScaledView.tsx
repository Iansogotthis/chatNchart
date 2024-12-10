import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';
import SquareModal from '@/components/SquareModal';

interface Square {
  className: string;
  size: number;
  children?: Square[];
}

export default function ScaledView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedSquare, setSelectedSquare] = useState<{ id: string; data: any } | null>(null);
  
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
      scale: number = 1
    ) {
      const group = svg.append("g")
        .attr("class", "square-group")
        .attr("transform", `translate(${x},${y}) scale(${scale})`);

      group.append("rect")
        .attr("x", -size / 2)
        .attr("y", -size / 2)
        .attr("width", size)
        .attr("height", size)
        .attr("class", `square ${className}`)
        .attr("rx", 4)
        .attr("ry", 4)
        .style("fill", getColor(className))
        .style("cursor", "pointer")
        .on("click", () => {
          setSelectedSquare({
            id: `${x}-${y}-${depth}`,
            data: {
              title: className,
              priority: {
                density: 1,
                durability: 'single',
                decor: '#000000'
              },
              urgency: 'black',
              aesthetic: {
                impact: {
                  bold: false,
                  italic: false,
                  underline: false
                },
                affect: {
                  fontFamily: 'Arial',
                  fontSize: 14
                },
                effect: {
                  color: '#000000'
                }
              }
            }
          });
        });

      group.append("text")
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("font-size", size / 5)
        .attr("pointer-events", "none")
        .text(className);

      if (depth < 3) {
        const childSize = size * 0.4;
        const offset = size * 0.6;
        
        const childPositions = [
          [-offset, -offset],
          [offset, -offset],
          [-offset, offset],
          [offset, offset],
        ];

        const nextClass = depth === 0 ? 'branch' : depth === 1 ? 'leaf' : 'fruit';

        childPositions.forEach((pos) => {
          requestAnimationFrame(() => {
            drawSquare(x + pos[0], y + pos[1], childSize, nextClass, depth + 1, scale);
          });
        });
      }
    }

    function getColor(className: string) {
      const colors = {
        root: "#60A5FA",
        branch: "#34D399",
        leaf: "#F472B6",
        fruit: "#A78BFA"
      };
      return colors[className as keyof typeof colors] || "#gray";
    }

    // Draw initial square
    drawSquare(centerX, centerY, centerSquareSize, 'root', 0);
  }, []);

  const handleZoomIn = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const group = svg.select('.square-group');
    if (!group.empty()) {
      const transform = group.attr('transform');
      const currentScale = transform ? parseFloat(transform.split('scale(')[1]) || 1 : 1;
      svg.selectAll('.square-group')
        .transition()
        .duration(300)
        .attr('transform', (d, i, nodes) => {
          const current = d3.select(nodes[i]);
          const [x, y] = current.attr('transform').match(/translate\(([\d.-]+),([\d.-]+)\)/)?.slice(1) || [0, 0];
          return `translate(${x},${y}) scale(${currentScale * 1.2})`;
        });
    }
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const group = svg.select('.square-group');
    if (!group.empty()) {
      const transform = group.attr('transform');
      const currentScale = transform ? parseFloat(transform.split('scale(')[1]) || 1 : 1;
      svg.selectAll('.square-group')
        .transition()
        .duration(300)
        .attr('transform', (d, i, nodes) => {
          const current = d3.select(nodes[i]);
          const [x, y] = current.attr('transform').match(/translate\(([\d.-]+),([\d.-]+)\)/)?.slice(1) || [0, 0];
          return `translate(${x},${y}) scale(${currentScale / 1.2})`;
        });
    }
  };

  return (
    <>
      <div className="relative w-full h-full">
        <div className="absolute top-4 right-4 space-x-2">
          <Button onClick={handleZoomIn} variant="outline" size="sm">
            Zoom In
          </Button>
          <Button onClick={handleZoomOut} variant="outline" size="sm">
            Zoom Out
          </Button>
        </div>
        <svg 
          ref={svgRef} 
          className="w-full h-full" 
          style={{ backgroundColor: '#f8fafc' }}
        />
      </div>
      {selectedSquare && (
        <SquareModal
          isOpen={!!selectedSquare}
          onClose={() => setSelectedSquare(null)}
          onSave={(data) => {
            console.log('Saving square data:', data);
            // TODO: Implement data saving logic
            setSelectedSquare(null);
          }}
          initialData={selectedSquare.data}
        />
      )}
    </>
  );
}
