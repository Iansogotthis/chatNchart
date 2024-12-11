import { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';
import '@/styles/chart.css';
import SquareModal from '@/components/SquareModal';
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
  const [currentView, setCurrentView] = useState<ViewType>('standard');
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
    // Reset the view if changing to standard or delineated without a square selected
    if ((viewType === 'standard' || viewType === 'delineated')) {
      setCurrentView(viewType);
      setSelectedSquare(null);
      setIsModalOpen(false);
    } 
    // Only allow scale/scope views when a square is selected
    else if ((viewType === 'scaled' || viewType === 'scoped') && selectedSquare) {
      setCurrentView(viewType);
      setIsModalOpen(false);
    }
    // Force re-render of the chart
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
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
          .filter(function() {
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

    // Handle window resize
    const handleResize = () => {
      if (!svgRef.current) return;
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      drawChart();
    };

    window.addEventListener('resize', handleResize);
    
    // Initial draw
    drawChart();

    return () => {
      window.removeEventListener('resize', handleResize);
    };

    function drawChart() {

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Reset view if selected square is cleared
    if (!selectedSquare && (currentView === 'scaled' || currentView === 'scoped')) {
      setCurrentView('standard');
    }

    // Get the SVG container's dimensions
    const svgElement = svgRef.current;
    if (!svgElement) return;
    
    const boundingRect = svgElement.getBoundingClientRect();
    const width = boundingRect.width;
    const height = boundingRect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const centerSquareSize = Math.min(width, height) * 0.4; // Reduced to ensure visibility
    const smallSquareSize = centerSquareSize / 2;
    const smallestSquareSize = smallSquareSize / 2;
    const tinySquareSize = smallestSquareSize / 2;

    // For delineated view, calculate branch positions with 25% closer spacing
    const delineationFactor = currentView === 'delineated' ? 0.75 : 1;

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
        .attr("rx", 4)
        .attr("ry", 4)
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

    function shouldDrawLeaf(branchIndex: number, leafPosition: number): boolean {
      // branchIndex is 1-based (1-4)
      // leafPosition is the position of the leaf in the branch (0-3, clockwise from top-left)
      switch (branchIndex) {
        case 1: // top-left branch
          return leafPosition !== 3; // skip bottom-right leaf
        case 2: // top-right branch
          return leafPosition !== 2; // skip bottom-left leaf
        case 3: // bottom-right branch
          return leafPosition !== 1; // skip top-right leaf
        case 4: // bottom-left branch
          return leafPosition !== 0; // skip top-left leaf
        default:
          return true;
      }
    }

    function drawSquares(corners: [number, number][], size: number, depth: number, className: string, parentText: string) {
      if (depth > 2) return;

      corners.forEach(([x, y], index) => {
        const branchIndex = index + 1;
        let currentClassName = className;
        
        if (depth === 0) {
          currentClassName = "branch";
        } else if (depth === 1) {
          currentClassName = "leaf";
        } else if (depth === 2) {
          currentClassName = "fruit";
        }

        // Draw the current square (branch or leaf)
        if (currentClassName === "leaf") {
          // Only draw leaf if it should be drawn based on its position
          const parentBranchNumber = parseInt(parentText.split('_').pop() || '0');
          if (shouldDrawLeaf(parentBranchNumber, index)) {
            drawSquare(
              x,
              y,
              size,
              colors[currentClassName as keyof typeof colors] || "",
              currentClassName,
              depth,
              `${parentText}_${branchIndex}`
            );

            // Draw fruits for this leaf if size is sufficient
            if (size > tinySquareSize) {
              const fruitSize = size / 2;
              const outerCorners = [
                [x - size / 2, y - size / 2], // top-left
                [x + size / 2, y - size / 2], // top-right
                [x - size / 2, y + size / 2], // bottom-left
              ];

              // Draw fruits on outer corners only
              outerCorners.forEach((corner, fruitIndex) => {
                drawSquare(
                  corner[0],
                  corner[1],
                  fruitSize,
                  colors["fruit"],
                  "fruit",
                  depth + 1,
                  `${parentText}_${branchIndex}_${fruitIndex + 1}`
                );
              });
            }
          }
        } else if (currentClassName === "branch") {
          drawSquare(
            x,
            y,
            size,
            colors[currentClassName as keyof typeof colors] || "",
            currentClassName,
            depth,
            `${parentText}_${branchIndex}`
          );

          // Continue drawing leaves if size is sufficient
          if (size > tinySquareSize) {
            const nextSize = size / 2;
            const nextCorners = [
              [x - size / 2, y - size / 2],
              [x + size / 2, y - size / 2],
              [x - size / 2, y + size / 2],
              [x + size / 2, y + size / 2],
            ] as [number, number][];

            requestAnimationFrame(() => {
              drawSquares(
                nextCorners,
                nextSize,
                depth + 1,
                currentClassName,
                `${parentText}_${branchIndex}`
              );
            });
          }
        }
      });
    }

    // Calculate adjusted positions for delineated view
    const getAdjustedPosition = (x: number, y: number): [number, number] => {
      if (currentView !== 'delineated') return [x, y];
      
      // Move points closer to center
      const dx = x - centerX;
      const dy = y - centerY;
      return [
        centerX + dx * delineationFactor,
        centerY + dy * delineationFactor
      ];
    };

    if (currentView === 'standard' || currentView === 'delineated') {
      // Draw root square
      drawSquare(centerX, centerY, centerSquareSize, colors.root, "root", 0, "Center");

      // Draw branches and their children
      const baseCorners = [
        [centerX - centerSquareSize / 2, centerY - centerSquareSize / 2],
        [centerX + centerSquareSize / 2, centerY - centerSquareSize / 2],
        [centerX - centerSquareSize / 2, centerY + centerSquareSize / 2],
        [centerX + centerSquareSize / 2, centerY + centerSquareSize / 2],
      ].map(([x, y]) => getAdjustedPosition(x, y)) as [number, number][];

      drawSquares(baseCorners, smallSquareSize, 0, "root", "Center");
    } else if (currentView === 'scoped' && selectedSquare) {
      // Draw only the selected square and its immediate children
      drawSquare(
        centerX,
        centerY,
        centerSquareSize,
        colors[selectedSquare.class as keyof typeof colors] || "",
        selectedSquare.class,
        selectedSquare.depth,
        selectedSquare.parent
      );

      const childCorners = [
        [centerX - centerSquareSize / 2, centerY - centerSquareSize / 2],
        [centerX + centerSquareSize / 2, centerY - centerSquareSize / 2],
        [centerX - centerSquareSize / 2, centerY + centerSquareSize / 2],
        [centerX + centerSquareSize / 2, centerY + centerSquareSize / 2],
      ] as [number, number][];

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
        centerSquareSize * 1.5,
        colors[selectedSquare.class as keyof typeof colors] || "",
        selectedSquare.class,
        selectedSquare.depth,
        selectedSquare.parent
      );

      const expandedCorners = [
        [centerX - centerSquareSize, centerY - centerSquareSize],
        [centerX + centerSquareSize, centerY - centerSquareSize],
        [centerX - centerSquareSize, centerY + centerSquareSize],
        [centerX + centerSquareSize, centerY + centerSquareSize],
      ] as [number, number][];

      expandedCorners.forEach(([x, y], index) => {
        let childClass = "";
        if (selectedSquare.class === "root") childClass = "branch";
        else if (selectedSquare.class === "branch") childClass = "leaf";
        else if (selectedSquare.class === "leaf") childClass = "fruit";

        if (childClass && (!childClass || shouldDrawLeaf(index + 1, index))) {
          drawSquare(
            x,
            y,
            smallSquareSize * 1.5,
            colors[childClass as keyof typeof colors] || "",
            `${childClass}${index + 1}`,
            selectedSquare.depth + 1,
            `${selectedSquare.parent}_${index + 1}`
          );
        }
      });
    }
  }
  }, [currentView, selectedSquare]); // Close both the drawChart function and useEffect

  return (
    <div className="flex flex-col h-full space-y-4 p-4">
      <div className="flex justify-center space-x-4">
        <Button
          onClick={() => handleViewChange('standard')}
          variant={currentView === 'standard' ? 'default' : 'outline'}
          className="w-32"
        >
          Standard Build
        </Button>
        <Button
          onClick={() => handleViewChange('delineated')}
          variant={currentView === 'delineated' ? 'default' : 'outline'}
          className="w-32"
        >
          Delineated View
        </Button>
        <Button
          onClick={() => handleViewChange('scaled')}
          variant={currentView === 'scaled' ? 'default' : 'outline'}
          className={`w-32 ${!selectedSquare && 'opacity-50'}`}
          disabled={!selectedSquare}
          title={!selectedSquare ? "Select a square first" : "View scaled version"}
        >
          Scale View
        </Button>
        <Button
          onClick={() => handleViewChange('scoped')}
          variant={currentView === 'scoped' ? 'default' : 'outline'}
          className={`w-32 ${!selectedSquare && 'opacity-50'}`}
          disabled={!selectedSquare}
          title={!selectedSquare ? "Select a square first" : "View scoped version"}
        >
          Scope View
        </Button>
      </div>
      <div className="flex-1 min-h-0 border rounded-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative">
        <div className="aspect-square w-full h-full absolute inset-0">
          <svg
            ref={svgRef}
            className="w-full h-full"
            aria-label="Chart visualization"
            role="img"
            style={{ margin: 'auto', display: 'block' }}
            preserveAspectRatio="xMidYMid meet"
          >
            <title>Interactive Chart Visualization</title>
            <desc>A visualization of nested squares representing different hierarchical levels</desc>
          </svg>
        </div>
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
