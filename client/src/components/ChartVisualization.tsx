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

  const handleViewChange = (viewType: ViewType) => {
    if (viewType === 'included-build' && selectedSquare) {
      // Navigate to form view using wouter
      const params = new URLSearchParams({
        class: selectedSquare.class,
        parent: selectedSquare.parent,
        depth: selectedSquare.depth.toString(),
      });
      window.location.href = `/form?${params.toString()}`;
      setIsModalOpen(false);
    } else if (viewType === 'scaled' || viewType === 'scoped') {
      // Update current view for scaled or scoped
      setCurrentView(viewType);
      setIsModalOpen(false);
      // Force re-render of the chart
      if (svgRef.current) {
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();
        // The useEffect will handle redrawing
      }
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (!selectedSquare || !user) {
      console.error('Missing required data for submission');
      return;
    }

    const squareId = `${selectedSquare.class}_${selectedSquare.parent}_${selectedSquare.depth}`;
    
    try {
      await squareCustomizationMutation.mutateAsync({
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
          .filter(function(this: SVGElement) {
            const sibling = this.nextElementSibling;
            if (!sibling) return false;
            const text = d3.select(sibling);
            return text.text() === selectedSquare.class;
          });

        // Apply styles based on settings
        square
          .style('stroke-width', `${data.priority.density}px`)
          .style('stroke-dasharray', data.priority.durability === 'dotted' ? '3,3' : '')
          .style('stroke', data.priority.decor)
          .style('fill', data.urgency);

        // Apply text styles
        const element = square.nodes()[0] as SVGElement;
        const textElement = element?.nextElementSibling;
        if (textElement) {
          d3.select(textElement)
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
      // Draw root in center
      drawSquare(centerX, centerY, centerSquareSize, colors.root, "root", 0, "Center");

      // Draw branches at corners with adjusted positions to avoid overlap
      const branchOffset = centerSquareSize * 0.8; // Increased offset to prevent overlap
      const branchCorners = [
        [centerX - branchOffset, centerY - branchOffset],
        [centerX + branchOffset, centerY - branchOffset],
        [centerX - branchOffset, centerY + branchOffset],
        [centerX + branchOffset, centerY + branchOffset],
      ];

      // Apply delineation adjustment if needed
      const adjustedBranchCorners = currentView === 'delineated' 
        ? branchCorners.map(([x, y]) => getAdjustedPosition(x, y))
        : branchCorners;

      // Draw branches
      adjustedBranchCorners.forEach(([x, y], branchIndex) => {
        drawSquare(
          x,
          y,
          smallSquareSize,
          colors.branch,
          "branch",
          1,
          `Center_${branchIndex + 1}`
        );

        // Calculate leaf positions for each branch
        const leafOffset = smallSquareSize * 0.7; // Smaller offset for leaves
        const leafCorners = [
          [x - leafOffset, y - leafOffset],
          [x + leafOffset, y - leafOffset],
          [x - leafOffset, y + leafOffset],
          [x + leafOffset, y + leafOffset],
        ];

        // Skip the leaf position that would overlap with the root
        leafCorners.forEach(([leafX, leafY], leafIndex) => {
          // Calculate distance from root center to avoid overlap
          const distanceFromRoot = Math.sqrt(
            Math.pow(leafX - centerX, 2) + Math.pow(leafY - centerY, 2)
          );
          
          if (distanceFromRoot > centerSquareSize * 0.8) {
            drawSquare(
              leafX,
              leafY,
              smallSquareSize * 0.6,
              colors.leaf,
              "leaf",
              2,
              `Center_${branchIndex + 1}_${leafIndex + 1}`
            );

            // Draw fruits around leaves
            const fruitOffset = smallSquareSize * 0.4;
            const fruitCorners = [
              [leafX - fruitOffset, leafY - fruitOffset],
              [leafX + fruitOffset, leafY - fruitOffset],
              [leafX - fruitOffset, leafY + fruitOffset],
              [leafX + fruitOffset, leafY + fruitOffset],
            ];

            fruitCorners.forEach(([fruitX, fruitY], fruitIndex) => {
              const distanceFromBranch = Math.sqrt(
                Math.pow(fruitX - x, 2) + Math.pow(fruitY - y, 2)
              );
              
              if (distanceFromBranch > smallSquareSize * 0.8) {
                drawSquare(
                  fruitX,
                  fruitY,
                  smallSquareSize * 0.3,
                  colors.fruit,
                  "fruit",
                  3,
                  `Center_${branchIndex + 1}_${leafIndex + 1}_${fruitIndex + 1}`
                );
              }
            });
          }
        });
      });
    } else if (currentView === 'scoped' && selectedSquare) {
      if (selectedSquare.class === 'branch') {
        // Draw the branch in center
        drawSquare(
          centerX,
          centerY,
          centerSquareSize,
          colors.branch,
          'branch',
          1,
          selectedSquare.parent
        );

        // Draw parent root slightly above
        drawSquare(
          centerX,
          centerY - centerSquareSize,
          smallSquareSize,
          colors.root,
          'root',
          0,
          'Center'
        );

        // Draw leaves in a grid below
        const leafGrid: Array<[number, number]> = [];
        const gridSize = 3; // 3x3 grid
        const spacing = smallSquareSize * 1.2;
        
        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            if (!(row === 0 && col === 1)) { // Skip position that would overlap with root
              leafGrid.push([
                centerX + (col - 1) * spacing,
                centerY + spacing + row * spacing
              ]);
            }
          }
        }

        leafGrid.forEach(([x, y], index) => {
          drawSquare(
            x,
            y,
            smallSquareSize * 0.8,
            colors.leaf,
            'leaf',
            2,
            `${selectedSquare.parent}_${index + 1}`
          );
        });

      } else if (selectedSquare.class === 'leaf') {
        // Draw the leaf in center
        drawSquare(
          centerX,
          centerY,
          centerSquareSize,
          colors.leaf,
          'leaf',
          2,
          selectedSquare.parent
        );

        // Draw parent branch slightly above
        drawSquare(
          centerX,
          centerY - centerSquareSize,
          smallSquareSize,
          colors.branch,
          'branch',
          1,
          selectedSquare.parent.split('_')[0]
        );

        // Draw fruits in a grid pattern around the leaf
        const fruitGrid: Array<[number, number]> = [];
        const gridSize = 3;
        const spacing = smallSquareSize;

        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            if (!(row === 0 && col === 1)) { // Skip position that would overlap with branch
              fruitGrid.push([
                centerX + (col - 1) * spacing,
                centerY + spacing + row * spacing
              ]);
            }
          }
        }

        fruitGrid.forEach(([x, y], index) => {
          drawSquare(
            x,
            y,
            smallSquareSize * 0.6,
            colors.fruit,
            'fruit',
            3,
            `${selectedSquare.parent}_${index + 1}`
          );
        });
      }
    } else if (currentView === 'scaled' && selectedSquare) {
        if (selectedSquare.class === 'branch') {
          // Draw root in center
          drawSquare(
            centerX,
            centerY,
            centerSquareSize * 1.5,
            colors.root,
            'root',
            0,
            'Center'
          );

          // Draw all branches around it
          const branchPositions: Array<[number, number]> = [
            [centerX - centerSquareSize, centerY - centerSquareSize],
            [centerX + centerSquareSize, centerY - centerSquareSize],
            [centerX - centerSquareSize, centerY + centerSquareSize],
            [centerX + centerSquareSize, centerY + centerSquareSize]
          ];

          branchPositions.forEach(([x, y], index) => {
            drawSquare(
              x,
              y,
              smallSquareSize * 1.5,
              colors.branch,
              'branch',
              1,
              `Center_${index + 1}`
            );
          });
        } else if (selectedSquare.class === 'leaf') {
          // Draw parent branch in center
          drawSquare(
            centerX,
            centerY,
            centerSquareSize * 1.5,
            colors.branch,
            'branch',
            1,
            selectedSquare.parent
          );

          // Draw all sibling leaves around it
          const leafPositions: Array<[number, number]> = [
            [centerX - centerSquareSize, centerY - centerSquareSize],
            [centerX + centerSquareSize, centerY - centerSquareSize],
            [centerX - centerSquareSize, centerY + centerSquareSize],
            [centerX + centerSquareSize, centerY + centerSquareSize]
          ];

          leafPositions.forEach(([x, y], index) => {
            drawSquare(
              x,
              y,
              smallSquareSize * 1.5,
              colors.leaf,
              'leaf',
              2,
              `${selectedSquare.parent}_${index + 1}`
            );
          });
        }
    }
  }, [currentView]);

  return (
    <div className="flex flex-col h-full space-y-4 p-4">
      <div className="flex justify-center space-x-4">
        <Button
          onClick={() => {
            setCurrentView('standard');
            setSelectedSquare(null);
          }}
          variant={currentView === 'standard' ? 'default' : 'outline'}
          className="w-32"
        >
          Standard Build
        </Button>
        <Button
          onClick={() => {
            setCurrentView('delineated');
            setSelectedSquare(null);
          }}
          variant={currentView === 'delineated' ? 'default' : 'outline'}
          className="w-32"
        >
          Delineated View
        </Button>
        <Button
          onClick={() => selectedSquare && setCurrentView('scaled')}
          variant={currentView === 'scaled' ? 'default' : 'outline'}
          className="w-32"
          disabled={!selectedSquare}
        >
          Scale View
        </Button>
        <Button
          onClick={() => selectedSquare && setCurrentView('scoped')}
          variant={currentView === 'scoped' ? 'default' : 'outline'}
          className="w-32"
          disabled={!selectedSquare}
        >
          Scope View
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