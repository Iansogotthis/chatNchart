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

interface SquareStyle {
  title: string;
  priority: {
    density: number;
    durability: 'single' | 'double' | 'dotted' | 'dashed';
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
}

const colors = {
  "root": "#60A5FA",
  "branch": "#34D399",
  "leaf": "#F472B6",
  "fruit": "#A78BFA"
} as const;

export function ChartVisualization() {
  const [currentView, setCurrentView] = useState<ViewType>('standard');
  const [selectedSquare, setSelectedSquare] = useState<SelectedSquare | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [squareStyles, setSquareStyles] = useState<Record<string, SquareStyle>>({});

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
    if ((viewType === 'standard' || viewType === 'delineated')) {
      setCurrentView(viewType);
      setSelectedSquare(null);
      setIsModalOpen(false);
    } 
    else if ((viewType === 'scaled' || viewType === 'scoped') && selectedSquare) {
      setCurrentView(viewType);
      setIsModalOpen(false);
    }
    
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      drawChart();
    }
  };

  const handleFormSubmit = async (data: SquareStyle) => {
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

      // Update local state
      setSquareStyles(prev => ({
        ...prev,
        [squareId]: data
      }));

      // Force a re-render of the chart
      if (svgRef.current) {
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();
        drawChart();
      }

    } catch (error) {
      console.error('Error saving square customization:', error);
    }
    
    setIsModalOpen(false);
    setSelectedSquare(null);
  };

  function shouldDrawFruit(branchNumber: number, leafIndex: number, cornerNumber: number): boolean {
    // Define fruit locations according to specification
    const fruitLocations: Record<number, Record<number, number[]>> = {
      1: { // Branch 1
        0: [1, 2, 3], // Leaf 1: corners 1,2,3
        1: [1, 2, 4], // Leaf 2: corners 1,2,4
        2: [1, 3, 4]  // Leaf 3: corners 1,3,4
      },
      2: { // Branch 2
        0: [1, 2, 3], // Leaf 1: corners 1,2,3
        1: [1, 2, 4], // Leaf 2: corners 1,2,4
        3: [2, 3, 4]  // Leaf 4: corners 2,3,4
      },
      3: { // Branch 3
        0: [1, 2, 3], // Leaf 1: corners 1,2,3
        2: [1, 3, 4], // Leaf 3: corners 1,3,4
        3: [2, 3, 4]  // Leaf 4: corners 2,3,4
      },
      4: { // Branch 4
        1: [1, 2, 4], // Leaf 2: corners 1,2,4
        2: [1, 3, 4], // Leaf 3: corners 1,3,4
        3: [2, 3, 4]  // Leaf 4: corners 2,3,4
      }
    };

    // Check if the fruit should be drawn at this location
    return fruitLocations[branchNumber]?.[leafIndex]?.includes(cornerNumber) ?? false;
  }

  function drawChart() {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Reset view if selected square is cleared
    if (!selectedSquare && (currentView === 'scaled' || currentView === 'scoped')) {
      setCurrentView('standard');
    }

    // Get the SVG container's dimensions
    const svgElement = svgRef.current;
    const boundingRect = svgElement.getBoundingClientRect();
    const width = boundingRect.width;
    const height = boundingRect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const centerSquareSize = Math.min(width, height) * 0.4;
    const smallSquareSize = centerSquareSize / 2;
    const smallestSquareSize = smallSquareSize / 2;
    const tinySquareSize = smallestSquareSize / 2;

    // For delineated view, calculate branch positions with 25% closer spacing
    const delineationFactor = currentView === 'delineated' ? 0.75 : 1;

    svg.attr("viewBox", `0 0 ${width} ${height}`)
       .attr("preserveAspectRatio", "xMidYMid meet");

    function drawSquare(x: number, y: number, size: number, defaultColor: string, className: string, depth: number, parentText: string) {
      const squareId = `${className}_${parentText}_${depth}`;
      const customStyle = squareStyles[squareId];

      // Create a group for better organization and accessibility
      const group = svg.append("g")
        .attr("class", `square-group ${className}`)
        .attr("role", "button")
        .attr("tabindex", "0")
        .attr("aria-label", `${className} square with ${customStyle?.title || 'no'} customization`)
        .style("cursor", "pointer")
        .on("click", () => handleSquareClick(className, parentText, depth))
        .on("keypress", (event: KeyboardEvent) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleSquareClick(className, parentText, depth);
          }
        });

      // Draw the square with customized styles
      const rect = group.append("rect")
        .attr("x", x - size / 2)
        .attr("y", y - size / 2)
        .attr("width", size)
        .attr("height", size)
        .attr("class", `square ${className}`)
        .attr("rx", 4)
        .attr("ry", 4);

      // Apply urgency color (background)
      if (customStyle?.urgency) {
        rect.style("fill", customStyle.urgency);
      } else {
        rect.style("fill", defaultColor);
      }

      // Apply priority settings (border)
      if (customStyle?.priority) {
        const { density, durability, decor } = customStyle.priority;
        
        // Set border color
        rect.style("stroke", decor);
        
        // Set border width
        rect.style("stroke-width", `${density}px`);
        
        // Set border style
        const borderStyle = (() => {
          switch (durability) {
            case 'dotted': return "2,2";
            case 'dashed': return "6,3";
            case 'double': return "none";  // Handle double border differently
            default: return "none";
          }
        })();
        rect.style("stroke-dasharray", borderStyle);
        
        // Handle double border
        if (durability === 'double') {
          group.append("rect")
            .attr("x", x - size / 2 + 2)
            .attr("y", y - size / 2 + 2)
            .attr("width", size - 4)
            .attr("height", size - 4)
            .attr("rx", 3)
            .attr("ry", 3)
            .style("fill", "none")
            .style("stroke", decor)
            .style("stroke-width", `${density}px`);
        }
      }

      // Add text with customizable appearance
      const text = group.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("pointer-events", "none");

      // Apply text styles from aesthetic settings
      if (customStyle?.aesthetic) {
        const { impact, affect, effect } = customStyle.aesthetic;
        
        text
          .style("font-weight", impact.bold ? "bold" : "normal")
          .style("font-style", impact.italic ? "italic" : "normal")
          .style("text-decoration", impact.underline ? "underline" : "none")
          .style("font-family", affect.fontFamily)
          .style("font-size", `${affect.fontSize}px`)
          .style("fill", effect.color);
      } else {
        // Default text styles
        text
          .style("font-family", "Arial")
          .style("font-size", `${size / 5}px`)
          .style("fill", "black");
      }

      // Set the text content
      text.text(customStyle?.title || className);
    }

    function shouldDrawLeaf(branchIndex: number, leafPosition: number): boolean {
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

    if (currentView === 'standard' || currentView === 'delineated') {
      // Draw root square
      drawSquare(centerX, centerY, centerSquareSize, colors.root, "root", 0, "Center");

      // Calculate adjusted positions for delineated view
      const getAdjustedPosition = (x: number, y: number): [number, number] => {
        if (currentView !== 'delineated') return [x, y];
        
        const dx = x - centerX;
        const dy = y - centerY;
        return [
          centerX + dx * delineationFactor,
          centerY + dy * delineationFactor
        ];
      };

      // Draw branches
      const branchPositions = [
        [centerX - centerSquareSize, centerY - centerSquareSize], // Branch 1
        [centerX + centerSquareSize, centerY - centerSquareSize], // Branch 2
        [centerX - centerSquareSize, centerY + centerSquareSize], // Branch 3
        [centerX + centerSquareSize, centerY + centerSquareSize], // Branch 4
      ].map(([x, y]) => getAdjustedPosition(x, y));

      branchPositions.forEach(([x, y], branchIndex) => {
        const branchNumber = branchIndex + 1;
        drawSquare(x, y, smallSquareSize, colors.branch, "branch", 1, `Center_${branchNumber}`);

        // Draw leaves for each branch
        if (smallSquareSize > tinySquareSize) {
          const leafSize = smallSquareSize / 2;
          const leafPositions = [
            [x - smallSquareSize / 2, y - smallSquareSize / 2], // Leaf 1
            [x + smallSquareSize / 2, y - smallSquareSize / 2], // Leaf 2
            [x - smallSquareSize / 2, y + smallSquareSize / 2], // Leaf 3
            [x + smallSquareSize / 2, y + smallSquareSize / 2], // Leaf 4
          ];

          leafPositions.forEach(([leafX, leafY], leafIndex) => {
            if (shouldDrawLeaf(branchNumber, leafIndex)) {
              const leafNumber = leafIndex + 1;
              drawSquare(
                leafX,
                leafY,
                leafSize,
                colors.leaf,
                "leaf",
                2,
                `Center_${branchNumber}_${leafNumber}`
              );

              // Draw fruits for this leaf based on the specification
              const fruitSize = leafSize / 2;
              const fruitCorners = {
                1: [leafX - leafSize / 2, leafY - leafSize / 2], // top-left
                2: [leafX + leafSize / 2, leafY - leafSize / 2], // top-right
                3: [leafX - leafSize / 2, leafY + leafSize / 2], // bottom-left
                4: [leafX + leafSize / 2, leafY + leafSize / 2]  // bottom-right
              };

              // Draw fruits only at specified corners
              Object.entries(fruitCorners).forEach(([corner, [fruitX, fruitY]]) => {
                if (shouldDrawFruit(branchNumber, leafIndex, parseInt(corner))) {
                  drawSquare(
                    fruitX,
                    fruitY,
                    fruitSize,
                    colors.fruit,
                    "fruit",
                    3,
                    `Center_${branchNumber}_${leafNumber}_${corner}`
                  );
                }
              });
            }
          });
        }
      });
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
            childClass,
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
            smallSquareSize * 1.5,
            colors[childClass as keyof typeof colors] || "",
            childClass,
            selectedSquare.depth + 1,
            `${selectedSquare.parent}_${index + 1}`
          );
        }
      });
    }
  }

  useEffect(() => {
    if (!svgRef.current) return;

    const handleResize = () => {
      if (!svgRef.current) return;
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      drawChart();
    };

    window.addEventListener('resize', handleResize);
    drawChart();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [currentView, selectedSquare, squareStyles]);

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
            urgency: '#000000',
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
