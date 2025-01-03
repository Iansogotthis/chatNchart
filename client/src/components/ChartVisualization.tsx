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

  const [squareStyles, setSquareStyles] = useState<Record<string, {
    title: string;
    priority: {
      density: number;
      durability: string;
      decor: string;
    };
    urgency: string;
    aesthetic: {
      impact: {
        bold: boolean;
        italic: boolean;
        underline: boolean;
      };
      affect: {
        fontFamily: string;
        fontSize: number;
      };
      effect: {
        color: string;
      };
    };
  }>>({});

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
      // Save to backend
      await squareCustomizationMutation.mutateAsync({
        squareClass: selectedSquare.class,
        parentText: selectedSquare.parent,
        depth: selectedSquare.depth,
        ...data
      });

      // Ensure data has all required properties with proper types
      const updatedStyles = {
        title: data.title || selectedSquare.class,
        priority: {
          density: Number(data.priority?.density) || 1,
          durability: data.priority?.durability || 'single',
          decor: data.priority?.decor || '#000000'
        },
        urgency: data.urgency || 'black',
        aesthetic: {
          impact: {
            bold: Boolean(data.aesthetic?.impact?.bold),
            italic: Boolean(data.aesthetic?.impact?.italic),
            underline: Boolean(data.aesthetic?.impact?.underline)
          },
          affect: {
            fontFamily: data.aesthetic?.affect?.fontFamily || 'Arial',
            fontSize: Number(data.aesthetic?.affect?.fontSize) || 14
          },
          effect: {
            color: data.aesthetic?.effect?.color || '#000000'
          }
        }
      };

      // Update local state
      setSquareStyles(prev => ({
        ...prev,
        [squareId]: updatedStyles
      }));

      // Force a re-render of the chart
      if (svgRef.current) {
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();
        drawChart(); // This will redraw with updated styles
      }

    } catch (error) {
      console.error('Error saving square customization:', error);
    }

    setIsModalOpen(false);
    setSelectedSquare(null);
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const container = svgRef.current.parentElement;
    if (!container) return;

    function updateSVGDimensions() {
      const boundingRect = container.getBoundingClientRect();
      const svg = d3.select(svgRef.current!);

      // Set explicit dimensions
      svg
        .attr("width", boundingRect.width)
        .attr("height", boundingRect.height)
        .attr("viewBox", `0 0 ${boundingRect.width} ${boundingRect.height}`);
    }

    // Initial update
    updateSVGDimensions();
    drawChart();

    // Debounced resize handler
    let resizeTimeout: number;
    const handleResize = () => {
      if (resizeTimeout) {
        window.clearTimeout(resizeTimeout);
      }

      resizeTimeout = window.setTimeout(() => {
        updateSVGDimensions();
        drawChart();
      }, 250);
    };

    // Event listeners
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      if (resizeTimeout) {
        window.clearTimeout(resizeTimeout);
      }
      resizeObserver.disconnect();
      window.removeEventListener('orientationchange', handleResize);
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
        const squareId = `${className}_${parentText}_${depth}`;
        const customStyle = squareStyles[squareId];

        // Create a group for better organization and accessibility
        const group = svg.append("g")
          .attr("class", `square-group ${className}`)
          .attr("role", "button")
          .attr("tabindex", "0")
          .attr("aria-label", `${className} square with ${customStyle?.title || 'no'} customization`)
          .on("click", () => handleSquareClick(className, parentText, depth))
          .on("keypress", (event: KeyboardEvent) => {
            if (event.key === "Enter" || event.key === " ") {
              handleSquareClick(className, parentText, depth);
            }
          });

        // Draw the square
        const rect = group.append("rect")
          .attr("x", x - size / 2)
          .attr("y", y - size / 2)
          .attr("width", size)
          .attr("height", size)
          .attr("class", `square ${className}`)
          .attr("fill", customStyle?.urgency || color)
          .attr("rx", 4)
          .attr("ry", 4);

        // Apply border styles if priority is set
        if (customStyle?.priority) {
          rect.style("stroke", customStyle.priority.decor || "none")
            .style("stroke-width", `${customStyle.priority.density || 1}px`)
            .style("stroke-dasharray", (() => {
              switch (customStyle.priority.durability) {
                case 'dotted': return "3,3";
                case 'dashed': return "5,5";
                case 'double': return "8,2";
                default: return "none";
              }
            })());
        }

        // Add text with all aesthetic properties
        const text = group.append("text")
          .attr("x", x)
          .attr("y", y)
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .attr("pointer-events", "none");

        // Apply text styles if aesthetic is set
        if (customStyle?.aesthetic) {
          const { impact, affect, effect } = customStyle.aesthetic;
          text.style("font-weight", impact.bold ? "bold" : "normal")
            .style("font-style", impact.italic ? "italic" : "normal")
            .style("text-decoration", impact.underline ? "underline" : "none")
            .style("font-family", affect.fontFamily || "Arial")
            .style("font-size", `${affect.fontSize || size / 5}px`)
            .style("fill", effect.color || "black");
        } else {
          text.style("font-size", `${size / 5}px`)
            .style("fill", "black");
        }

        text.text(customStyle?.title || className);
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
            drawSquare(
              x,
              y,
              size,
              colors[currentClassName as keyof typeof colors] || "",
              currentClassName,
              depth,
              `${parentText}_${branchIndex}`
            );

            // Draw leaves
            if (size > tinySquareSize) {
              const leafSize = size / 2;
              const leafCorners = [
                [x - size / 2, y - size / 2],
                [x + size / 2, y - size / 2],
                [x - size / 2, y + size / 2],
                [x + size / 2, y + size / 2],
              ] as [number, number][];

              leafCorners.forEach((corner, leafIndex) => {
                if (shouldDrawLeaf(branchIndex, leafIndex)) {
                  drawSquare(
                    corner[0],
                    corner[1],
                    leafSize,
                    colors["leaf"],
                    "leaf",
                    depth + 1,
                    `${parentText}_${branchIndex}_${leafIndex + 1}`
                  );

                  // Draw fruits for this leaf
                  const fruitSize = leafSize / 2;
                  const fruitCorners = {
                    1: [corner[0] - leafSize / 2, corner[1] - leafSize / 2], // top-left
                    2: [corner[0] + leafSize / 2, corner[1] - leafSize / 2], // top-right
                    3: [corner[0] - leafSize / 2, corner[1] + leafSize / 2], // bottom-left
                    4: [corner[0] + leafSize / 2, corner[1] + leafSize / 2]  // bottom-right
                  };

                  // Determine which corners should have fruits based on branch and leaf position
                  let fruitCornerNumbers: number[] = [];
                  if (branchIndex === 1) {
                    if (leafIndex === 0) fruitCornerNumbers = [1, 2, 3]; // Leaf 1: top-left, top-right, bottom-left
                    if (leafIndex === 1) fruitCornerNumbers = [1, 2, 4]; // Leaf 2: top-left, top-right, bottom-right
                    if (leafIndex === 2) fruitCornerNumbers = [1, 3, 4]; // Leaf 3: top-left, bottom-left, bottom-right
                  } else if (branchIndex === 2) {
                    if (leafIndex === 0) fruitCornerNumbers = [1, 2, 3]; // Leaf 1: top-left, top-right, bottom-left
                    if (leafIndex === 1) fruitCornerNumbers = [1, 2, 4]; // Leaf 2: top-left, top-right, bottom-right
                    if (leafIndex === 3) fruitCornerNumbers = [2, 3, 4]; // Leaf 4: top-right, bottom-left, bottom-right
                  } else if (branchIndex === 3) {
                    if (leafIndex === 0) fruitCornerNumbers = [1, 2, 3]; // Leaf 1: top-left, top-right, bottom-left
                    if (leafIndex === 2) fruitCornerNumbers = [1, 3, 4]; // Leaf 3: top-left, bottom-left, bottom-right
                    if (leafIndex === 3) fruitCornerNumbers = [2, 3, 4]; // Leaf 4: top-right, bottom-left, bottom-right
                  } else if (branchIndex === 4) {
                    if (leafIndex === 1) fruitCornerNumbers = [1, 2, 4]; // Leaf 2: top-left, top-right, bottom-right
                    if (leafIndex === 2) fruitCornerNumbers = [1, 3, 4]; // Leaf 3: top-left, bottom-left, bottom-right
                    if (leafIndex === 3) fruitCornerNumbers = [2, 3, 4]; // Leaf 4: top-right, bottom-left, bottom-right
                  }

                  fruitCornerNumbers.forEach(cornerNum => {
                    const fruitCorner = fruitCorners[cornerNum as keyof typeof fruitCorners];
                    if (fruitCorner) {
                      drawSquare(
                        fruitCorner[0],
                        fruitCorner[1],
                        fruitSize,
                        colors["fruit"],
                        "fruit",
                        depth + 2,
                        `${parentText}_${branchIndex}_${leafIndex + 1}_${cornerNum}`
                      );
                    }
                  });
                }
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
  }, [currentView, selectedSquare, squareStyles]); // Added squareStyles dependency

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
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflow: 'visible'
            }}
            aria-label="Chart visualization"
            role="img"
          >
            <title>Interactive Chart Visualization</title>
            <desc>A visualization of nested squares representing different hierarchical levels</desc>
            <defs>
              <style type="text/css">
                {`
                  .square { transition: all 0.3s ease-in-out; }
                  .square:hover { filter: brightness(0.9); cursor: pointer; }
                  text { user-select: none; }
                `}
              </style>
            </defs>
          </svg>
        </div>
      </div>

      {selectedSquare && (
        <SquareModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSquare(null);
          }}
          onSave={handleFormSubmit}
          initialData={{
            title: selectedSquare.class,
            priority: {
              density: 1,
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