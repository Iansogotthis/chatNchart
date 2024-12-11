import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import * as d3 from 'd3';
import '@/styles/chart.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SquareForm } from './SquareForm';
import SquareModal from './SquareModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';

type ViewType = 'standard' | 'delineated' | 'scaled' | 'scoped' | 'included-build';

interface SelectedSquare {
  class: string;
  parent: string;
  depth: number;
}

const colors = {
  "root": "lightblue",
  "branch": "lightgray",
  "leaf": "lightgreen",
  "fruit": "lightcoral"
} as const;

export function ChartVisualization() {
  const [currentView, setCurrentView] = useState<ViewType>('scaled');
  const [selectedSquare, setSelectedSquare] = useState<SelectedSquare | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const queryClient = useQueryClient();
  const { user } = useUser();

  const [squareStyles, setSquareStyles] = useState<Record<string, any>>({});

  // Fetch current chart
  const { data: charts } = useQuery({
    queryKey: ['charts'],
    queryFn: async () => {
      const response = await fetch('/api/charts');
      if (!response.ok) throw new Error('Failed to fetch charts');
      return response.json();
    },
  });

  const currentChart = charts?.[0];
  const chartId = currentChart?.id;

  // Square customization mutation
  const squareCustomizationMutation = useMutation({
    mutationFn: async (customization: any) => {
      const response = await fetch('/api/square-customization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customization),
      });
      if (!response.ok) throw new Error('Failed to save square customization');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charts'] });
    },
  });

  const handleSquareClick = (className: string, parentText: string, depth: number) => {
    setSelectedSquare({ class: className, parent: parentText, depth });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    if (!selectedSquare || !chartId || !user) {
      console.error('Missing required data for submission');
      return;
    }

    const squareId = `${selectedSquare.class}_${selectedSquare.parent}_${selectedSquare.depth}`;
    
    try {
      await squareCustomizationMutation.mutateAsync({
        chartId,
        squareClass: selectedSquare.class,
        parentText: selectedSquare.parent,
        depth: selectedSquare.depth,
        title: data.title,
        priority: data.priority,
        urgency: data.urgency,
        aesthetic: data.aesthetic,
      });

      // Update local state
      setSquareStyles(prev => ({
        ...prev,
        [squareId]: {
          priority: data.priority,
          urgency: data.urgency,
          aesthetic: data.aesthetic
        }
      }));

      // Update square visual properties
      if (svgRef.current) {
        const square = d3.select(svgRef.current)
          .selectAll(`.square.${selectedSquare.class}`)
          .filter(function() {
            const text = d3.select(this.nextSibling as Element);
            return text.text() === selectedSquare.class;
          });

        // Apply styles based on settings
        square
          .style('stroke-width', `${data.priority.density}px`)
          .style('stroke-dasharray', data.priority.durability === 'dotted' ? '3,3' : null)
          .style('stroke', data.priority.decor)
          .style('fill', data.urgency);

        // Apply text styles
        const text = square.nodes()[0]?.nextSibling;
        if (text) {
          d3.select(text)
            .style('font-weight', data.aesthetic.impact.bold ? 'bold' : 'normal')
            .style('font-style', data.aesthetic.impact.italic ? 'italic' : 'normal')
            .style('text-decoration', data.aesthetic.impact.underline ? 'underline' : 'none')
            .style('font-family', data.aesthetic.affect.fontFamily)
            .style('font-size', `${data.aesthetic.affect.fontSize}px`)
            .style('fill', data.aesthetic.effect.color);
        }
      }
    } catch (error) {
      console.error('Error saving square customization:', error);
    }
    
    setIsModalOpen(false);
    setSelectedSquare(null);
  };

  const handleViewChange = (viewType: ViewType) => {
    if (selectedSquare) {
      if (viewType === 'included-build') {
        // Show form for the selected square
        const params = new URLSearchParams({
          class: selectedSquare.class,
          parent: selectedSquare.parent,
          depth: selectedSquare.depth.toString(),
        });
        window.location.href = `/form?${params.toString()}`;
      } else if (viewType === 'scaled' || viewType === 'scoped') {
        // Update current view for scaled or scoped
        setCurrentView(viewType);
        setIsModalOpen(false);
      }
    }
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Reset view if selected square is cleared
    if (!selectedSquare && (currentView === 'scaled' || currentView === 'scoped')) {
      setCurrentView('standard');
    }

    const width = window.innerWidth * 0.9;
    const height = window.innerHeight * 0.9;
    const centerX = width / 2;
    const centerY = height / 2;
    const centerSquareSize = Math.min(width, height) / 2;
    const smallSquareSize = centerSquareSize / 2;
    const smallestSquareSize = smallSquareSize / 2;
    const tinySquareSize = smallestSquareSize / 2;

    // For delineated view, calculate branch positions with 25% closer spacing
    const delineationFactor = currentView === 'delineated' ? 0.75 : 1; // Reduce spacing by 25%

    svg.attr("viewBox", `0 0 ${width} ${height}`)
       .attr("preserveAspectRatio", "xMidYMid meet");

    // Calculate adjusted positions for delineated view
    const getAdjustedPosition = (x: number, y: number) => {
      if (currentView !== 'delineated') return [x, y];
      
      // Move points 25% closer to center
      const dx = x - centerX;
      const dy = y - centerY;
      return [
        centerX + dx * delineationFactor,
        centerY + dy * delineationFactor
      ];
    };

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

    if (currentView === 'standard' || currentView === 'delineated') {
      drawSquare(centerX, centerY, centerSquareSize, "lightblue", "root", 0, "Center");
      const baseCorners = [
        [centerX - centerSquareSize / 2, centerY - centerSquareSize / 2],
        [centerX + centerSquareSize / 2, centerY - centerSquareSize / 2],
        [centerX - centerSquareSize / 2, centerY + centerSquareSize / 2],
        [centerX + centerSquareSize / 2, centerY + centerSquareSize / 2],
      ];
      
      const corners = baseCorners.map(([x, y]) => getAdjustedPosition(x, y));

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
    } else if (currentView === 'scoped' && selectedSquare) {
      // Draw only the selected square and its immediate children
      const colors = {
        "root": "lightblue",
        "branch": "lightgray",
        "leaf": "lightgreen",
        "fruit": "lightcoral"
      };

      // Draw the selected square in the center
      drawSquare(
        centerX,
        centerY,
        centerSquareSize,
        colors[selectedSquare.class as keyof typeof colors] || "",
        selectedSquare.class,
        selectedSquare.depth,
        selectedSquare.parent
      );

      // Draw its children in smaller squares around it
      const childCorners = [
        [centerX - centerSquareSize / 2, centerY - centerSquareSize / 2],
        [centerX + centerSquareSize / 2, centerY - centerSquareSize / 2],
        [centerX - centerSquareSize / 2, centerY + centerSquareSize / 2],
        [centerX + centerSquareSize / 2, centerY + centerSquareSize / 2],
      ];

      childCorners.forEach(([x, y], index) => {
        let childClass = "";
        if (selectedSquare.class === "root") childClass = "branch";
        else if (selectedSquare.class === "branch") childClass = "leaf";
        else if (selectedSquare.class === "leaf") childClass = "fruit";

        if (childClass) {
          drawSquare(
            x,
            y,
            smallSquareSize,
            colors[childClass as keyof typeof colors] || "",
            `${childClass}${index + 1}`,
            selectedSquare.depth + 1,
            `${selectedSquare.parent}_${index + 1}`
          );
        }
      });
    } else if (currentView === 'scaled' && selectedSquare) {
      // Draw an expanded view starting from the selected square
      drawSquare(
        centerX,
        centerY,
        centerSquareSize * 1.5, // Make the central square 50% larger
        colors[selectedSquare.class as keyof typeof colors] || "",
        selectedSquare.class,
        selectedSquare.depth,
        selectedSquare.parent
      );

      // Draw expanded children
      const expandedCorners = [
        [centerX - centerSquareSize, centerY - centerSquareSize],
        [centerX + centerSquareSize, centerY - centerSquareSize],
        [centerX - centerSquareSize, centerY + centerSquareSize],
        [centerX + centerSquareSize, centerY + centerSquareSize],
      ];

      expandedCorners.forEach(([x, y], index) => {
        let childClass = "";
        if (selectedSquare.class === "root") childClass = "branch";
        else if (selectedSquare.class === "branch") childClass = "leaf";
        else if (selectedSquare.class === "leaf") childClass = "fruit";

        if (childClass) {
          drawSquare(
            x,
            y,
            smallSquareSize * 1.5, // Make child squares 50% larger too
            colors[childClass as keyof typeof colors] || "",
            `${childClass}${index + 1}`,
            selectedSquare.depth + 1,
            `${selectedSquare.parent}_${index + 1}`
          );
        }
      });

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
          onClick={() => setCurrentView('standard')}
          variant={currentView === 'standard' ? 'default' : 'outline'}
          className="w-32"
        >
          Standard Build
        </Button>
        <Button
          onClick={() => setCurrentView('delineated')}
          variant={currentView === 'delineated' ? 'default' : 'outline'}
          className="w-32"
        >
          Delineated View
        </Button>
      </div>
      <div className="flex-1 min-h-0 border rounded-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ width: '90vw', height: '90vh', margin: 'auto', display: 'block' }}
        />
      </div>

      {selectedSquare && (
        <SquareModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleFormSubmit}
          initialData={{
            title: selectedSquare.class,
            priority: {
              density: 2,
              durability: 'single',
              decor: '#000000',
            },
            urgency: 'black',
            aesthetic: {
              impact: {
                bold: false,
                italic: false,
                underline: false,
              },
              affect: {
                fontFamily: 'Arial',
                fontSize: 16,
              },
              effect: {
                color: '#000000',
              },
            },
          }}
        />
      )}
    </div>
  );
}