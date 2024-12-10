import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import * as d3 from 'd3';
import '@/styles/chart.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SquareForm } from './SquareForm';

type ViewType = 'scaled' | 'scoped' | 'included-build';

interface SelectedSquare {
  class: string;
  parent: string;
  depth: number;
}

export function ChartVisualization() {
  const [currentView, setCurrentView] = useState<ViewType>('scaled');
  const [selectedSquare, setSelectedSquare] = useState<SelectedSquare | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleSquareClick = (className: string, parentText: string, depth: number) => {
    setSelectedSquare({ class: className, parent: parentText, depth });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (data: any) => {
    // Here we would save the data to your backend
    console.log('Form submitted:', data);
    setIsModalOpen(false);
    setSelectedSquare(null);
  };

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

    function drawSquare(x: number, y: number, size: number, color: string, className: string, depth: number, parentText: string) {
      const rect = svg.append("rect")
        .attr("x", x - size / 2)
        .attr("y", y - size / 2)
        .attr("width", size)
        .attr("height", size)
        .attr("class", `square ${className}`)
        .attr("fill", color)
        .on("click", () => handleSquareClick(className, parentText, depth));

      svg.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("font-size", size / 5)
        .attr("pointer-events", "none")
        .text(className);
    }

    if (currentView === 'scaled') {
      drawSquare(centerX, centerY, centerSquareSize, "lightblue", "root", 0, "Center");
      const corners = [
        [centerX - centerSquareSize / 2, centerY - centerSquareSize / 2],
        [centerX + centerSquareSize / 2, centerY - centerSquareSize / 2],
        [centerX - centerSquareSize / 2, centerY + centerSquareSize / 2],
        [centerX + centerSquareSize / 2, centerY + centerSquareSize / 2],
      ];

      function drawSquares(corners: [number, number][], size: number, depth: number, className: string, parentText: string) {
        if (depth > 1) return;

        const colors = {
          "root": "lightblue",
          "branch": "lightgray",
          "leaf": "lightgreen",
          "fruit": "lightcoral"
        };

        corners.forEach(([x, y], index) => {
          let currentClassName = className;
          if (depth === 0) {
            currentClassName = "branch";
          } else if (depth === 1) {
            currentClassName = "leaf";
          } else if (depth === 2) {
            currentClassName = "fruit";
          }

          drawSquare(
            x,
            y,
            size,
            colors[currentClassName as keyof typeof colors] || "",
            currentClassName,
            depth,
            parentText
          );

          if (size > tinySquareSize) {
            const nextSize = size / 2;
            const nextCorners = [
              [x - size / 2, y - size / 2],
              [x + size / 2, y - size / 2],
              [x - size / 2, y + size / 2],
              [x + size / 2, y + size / 2],
            ];

            requestAnimationFrame(() => {
              drawSquares(
                nextCorners,
                nextSize,
                depth + 1,
                currentClassName,
                `${parentText}_${index + 1}`
              );
            });
          }
        });
      }

      drawSquares(corners, smallSquareSize, 0, "root", "Center");
    } else if (currentView === 'scoped') {
      function drawScope() {
        const rootClass = 'branch';
        if (rootClass === 'branch') {
          drawSquare(centerX, centerY, centerSquareSize, "lightgray", "branch", 1, "");
          drawSquare(centerX - centerSquareSize / 2, centerY - centerSquareSize / 2, smallSquareSize, "lightgreen", "leaf1", 2, "");
          drawSquare(centerX + centerSquareSize / 2, centerY - centerSquareSize / 2, smallSquareSize, "lightgreen", "leaf2", 2, "");
          drawSquare(centerX - centerSquareSize / 2, centerY + centerSquareSize / 2, smallSquareSize, "lightgreen", "leaf3", 2, "");
          drawSquare(centerX + centerSquareSize / 2, centerY + centerSquareSize / 2, smallSquareSize, "lightgreen", "leaf4", 2, "");
        } else if (rootClass === 'leaf') {
          drawSquare(centerX, centerY, centerSquareSize, "lightgreen", "leaf", 2, "");
          drawSquare(centerX - centerSquareSize / 2, centerY - centerSquareSize / 2, smallSquareSize, "lightcoral", "fruit1", 3, "");
          drawSquare(centerX + centerSquareSize / 2, centerY - centerSquareSize / 2, smallSquareSize, "lightcoral", "fruit2", 3, "");
          drawSquare(centerX - centerSquareSize / 2, centerY + centerSquareSize / 2, smallSquareSize, "lightcoral", "fruit3", 3, "");
          drawSquare(centerX + centerSquareSize / 2, centerY + centerSquareSize / 2, smallSquareSize, "lightcoral", "fruit4", 3, "");
        }
      }
      drawScope();
    } else if (currentView === 'included-build') {
      const urlParams = new URLSearchParams(window.location.search);
      const squareClass = urlParams.get('class') || 'root';
      const parentText = urlParams.get('parent') || 'Center';

      drawSquare(
        centerX,
        centerY,
        centerSquareSize,
        "lightblue",
        squareClass,
        1,
        parentText
      );

      const corners = [
        [centerX - centerSquareSize / 2, centerY - centerSquareSize / 2],
        [centerX + centerSquareSize / 2, centerY - centerSquareSize / 2],
        [centerX - centerSquareSize / 2, centerY + centerSquareSize / 2],
        [centerX + centerSquareSize / 2, centerY + centerSquareSize / 2],
      ];

      function drawIncludedBuildSquares(corners: [number, number][], size: number, depth: number, className: string, parentText: string) {
        if (depth > 1) return;

        corners.forEach(([x, y], index) => {
          let currentClassName = className;
          if (depth === 0) {
            currentClassName = "branch";
          } else if (depth === 1) {
            currentClassName = "leaf";
          }

          drawSquare(
            x,
            y,
            size,
            currentClassName === "branch" ? "lightgray" : "lightgreen",
            currentClassName,
            depth,
            `${parentText}_${index + 1}`
          );

          if (size > tinySquareSize) {
            const nextSize = size / 2;
            const nextCorners = [
              [x - size / 2, y - size / 2],
              [x + size / 2, y - size / 2],
              [x - size / 2, y + size / 2],
              [x + size / 2, y + size / 2],
            ] as [number, number][];

            requestAnimationFrame(() => {
              drawIncludedBuildSquares(
                nextCorners,
                nextSize,
                depth + 1,
                currentClassName,
                `${parentText}_${index + 1}`
              );
            });
          }
        });
      }

      drawIncludedBuildSquares(corners, smallSquareSize, 0, squareClass, parentText);
    }
  }, [currentView]);

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
          onClick={() => setCurrentView('included-build')}
          variant={currentView === 'included-build' ? 'default' : 'outline'}
          className="w-32"
        >
          Include Build
        </Button>
      </div>
      <div className="flex-1 min-h-0 border rounded-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ width: '90vw', height: '90vh', margin: 'auto', display: 'block' }}
        />
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Square</DialogTitle>
          </DialogHeader>
          {selectedSquare && (
            <SquareForm
              squareData={{
                title: selectedSquare.class,
                parent_id: selectedSquare.parent,
                type: `Depth: ${selectedSquare.depth}`,
              }}
              onSubmit={handleFormSubmit}
              className="py-4"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}