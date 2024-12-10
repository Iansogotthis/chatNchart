import { useEffect, useRef, useState } from 'react';
import { select, Selection } from 'd3';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';

interface Square {
  id: string;
  class: string;
  title: string;
  included?: boolean;
  children?: Square[];
}

interface ChartProps {
  data?: Square;
  onSave?: (data: Square) => void;
}

export function ChartVisualization({ data, onSave }: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { toast } = useToast();
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [scope, setScope] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = select(svgRef.current);
    const width = window.innerWidth * 0.9;
    const height = window.innerHeight * 0.9;
    
    svg.selectAll("*").remove();
    
    svg.attr("viewBox", `0 0 ${width} ${height}`)
       .attr("preserveAspectRatio", "xMidYMid meet");

    const centerX = width / 2;
    const centerY = height / 2;
    const centerSquareSize = Math.min(width, height) / 2;
    const smallSquareSize = centerSquareSize / 2;
    const smallestSquareSize = smallSquareSize / 2;
    const tinySquareSize = smallestSquareSize / 2;

    function drawSquares(
      x: number, 
      y: number, 
      size: number, 
      depth: number = 0, 
      parentId: string = ''
    ) {
      const corners = [
        [x - size / 2, y - size / 2],
        [x + size / 2, y - size / 2],
        [x - size / 2, y + size / 2],
        [x + size / 2, y + size / 2],
      ];

      const colors = {
        root: "#60A5FA",
        branch: "#34D399",
        leaf: "#F472B6",
        fruit: "#A78BFA"
      };

      const getClassName = (d: number) => {
        if (d === 0) return 'root';
        if (d === 1) return 'branch';
        if (d === 2) return 'leaf';
        return 'fruit';
      };

      if (scope && getClassName(depth) !== scope) return;

      const squareId = `${parentId}${depth}`;
      const className = getClassName(depth);

      const group = svg.append("g")
        .attr("class", "square-group");

      group.append("rect")
        .attr("x", x - size / 2)
        .attr("y", y - size / 2)
        .attr("width", size)
        .attr("height", size)
        .attr("class", `square ${className}`)
        .attr("fill", colors[className as keyof typeof colors])
        .attr("opacity", data?.included === false ? 0.3 : 1)
        .attr("rx", 4)
        .attr("ry", 4)
        .style("cursor", "pointer")
        .on("click", () => {
          setSelectedSquare({
            id: squareId,
            class: className,
            title: className,
            included: true
          });
          setIsModalOpen(true);
        });

      group.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("font-size", size / 5)
        .attr("pointer-events", "none")
        .text(className);

      if (depth < 3 && size > tinySquareSize) {
        const nextSize = size * 0.4;
        corners.forEach((corner, i) => {
          requestAnimationFrame(() => {
            drawSquares(corner[0], corner[1], nextSize, depth + 1, `${squareId}-${i}`);
          });
        });
      }
    }

    drawSquares(centerX, centerY, centerSquareSize);
    
    // Apply scale transformation to the entire SVG
    svg.attr("transform", `scale(${scale})`);
    
  }, [data, scale, scope]);

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4 space-x-2">
        <Button 
          onClick={() => setScale(s => Math.min(s * 1.2, 3))}
          variant="outline"
          size="sm"
        >
          Zoom In
        </Button>
        <Button 
          onClick={() => setScale(s => Math.max(s / 1.2, 0.5))}
          variant="outline"
          size="sm"
        >
          Zoom Out
        </Button>
        <Button 
          onClick={() => setScope(scope === null ? 'leaf' : null)}
          variant="outline"
          size="sm"
        >
          {scope ? 'Show All' : 'Show Leaves'}
        </Button>
      </div>
      <svg 
        ref={svgRef} 
        className="w-full h-full" 
        style={{ backgroundColor: '#f8fafc' }}
      />
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Square</DialogTitle>
          </DialogHeader>
          {selectedSquare && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Input
                  value={selectedSquare.title}
                  onChange={(e) => setSelectedSquare({
                    ...selectedSquare,
                    title: e.target.value
                  })}
                />
              </div>
              <Button
                onClick={() => setSelectedSquare({
                  ...selectedSquare,
                  included: !selectedSquare.included
                })}
              >
                {selectedSquare.included ? 'Exclude' : 'Include'}
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => {
              if (selectedSquare && onSave) {
                onSave(selectedSquare);
              }
              setIsModalOpen(false);
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
