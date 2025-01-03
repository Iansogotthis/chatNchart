import { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';
import '@/styles/chart.css';
import SquareModal from '@/components/SquareModal';
import { SquareForm } from '@/components/SquareForm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import type { Chart } from "@db/schema";

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

interface ChartVisualizationProps {
  chart: Chart;
}

export function ChartVisualization({ chart }: ChartVisualizationProps) {
  const [currentView, setCurrentView] = useState<ViewType>('standard');
  const [selectedSquare, setSelectedSquare] = useState<SelectedSquare | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSquareForm, setShowSquareForm] = useState(false);
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

  const chartId = chart.id;

  const { data: customizations } = useQuery({
    queryKey: ['square-customizations', chartId],
    queryFn: async () => {
      if (!chartId) return [];
      const response = await fetch(`/api/square-customization/${chartId}`);
      if (!response.ok) throw new Error('Failed to fetch customizations');
      return response.json();
    },
    enabled: !!chartId,
  });

  useEffect(() => {
    if (customizations?.length) {
      const styles: Record<string, any> = {};
      customizations.forEach((customization: any) => {
        const squareId = `${customization.squareClass}_${customization.parentText}_${customization.depth}`;
        styles[squareId] = {
          title: customization.title,
          priority: customization.priority,
          urgency: customization.urgency,
          aesthetic: customization.aesthetic,
        };
      });
      setSquareStyles(styles);
    }
  }, [customizations]);

  const squareCustomizationMutation = useMutation({
    mutationFn: async (customization: any) => {
      const response = await fetch('/api/square-customization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...customization,
          chartId,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to save square customization');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['square-customizations', chartId] });
    },
  });

  const handleSquareClick = (className: string, parentText: string, depth: number) => {
    setSelectedSquare({ class: className, parent: parentText, depth });
    setIsModalOpen(true);
  };

  const toggleSquareForm = () => {
    setShowSquareForm(!showSquareForm);
  };

  const handleViewChange = (viewType: ViewType) => {
    if ((viewType === 'standard' || viewType === 'delineated')) {
      setCurrentView(viewType);
      setSelectedSquare(null);
      setIsModalOpen(false);
    } else if ((viewType === 'scaled' || viewType === 'scoped') && selectedSquare) {
      setCurrentView(viewType);
      setIsModalOpen(false);
    }
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
    }
  };

  const drawChart = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (!selectedSquare && (currentView === 'scaled' || currentView === 'scoped')) {
      setCurrentView('standard');
    }

    const svgElement = svgRef.current;
    if (!svgElement) return;

    const boundingRect = svgElement.getBoundingClientRect();
    const width = boundingRect.width;
    const height = boundingRect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const centerSquareSize = Math.min(width, height) * 0.4;
    const smallSquareSize = centerSquareSize / 2;
    const smallestSquareSize = smallSquareSize / 2;
    const tinySquareSize = smallestSquareSize / 2;

    const delineationFactor = currentView === 'delineated' ? 0.75 : 1;

    svg.attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    function drawSquare(x: number, y: number, size: number, color: string, className: string, depth: number, parentText: string) {
      const squareId = `${className}_${parentText}_${depth}`;
      const customStyle = squareStyles[squareId];

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

      const rect = group.append("rect")
        .attr("x", x - size / 2)
        .attr("y", y - size / 2)
        .attr("width", size)
        .attr("height", size)
        .attr("class", `square ${className}`)
        .attr("fill", customStyle?.urgency || color)
        .attr("rx", 4)
        .attr("ry", 4);

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

      const text = group.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("pointer-events", "none");

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
      switch (branchIndex) {
        case 1:
          return leafPosition !== 3;
        case 2:
          return leafPosition !== 2;
        case 3:
          return leafPosition !== 1;
        case 4:
          return leafPosition !== 0;
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

                const fruitSize = leafSize / 2;
                const fruitCorners = {
                  1: [corner[0] - leafSize / 2, corner[1] - leafSize / 2],
                  2: [corner[0] + leafSize / 2, corner[1] - leafSize / 2],
                  3: [corner[0] - leafSize / 2, corner[1] + leafSize / 2],
                  4: [corner[0] + leafSize / 2, corner[1] + leafSize / 2]
                };

                let fruitCornerNumbers: number[] = [];
                if (branchIndex === 1) {
                  if (leafIndex === 0) fruitCornerNumbers = [1, 2, 3];
                  if (leafIndex === 1) fruitCornerNumbers = [1, 2, 4];
                  if (leafIndex === 2) fruitCornerNumbers = [1, 3, 4];
                } else if (branchIndex === 2) {
                  if (leafIndex === 0) fruitCornerNumbers = [1, 2, 3];
                  if (leafIndex === 1) fruitCornerNumbers = [1, 2, 4];
                  if (leafIndex === 3) fruitCornerNumbers = [2, 3, 4];
                } else if (branchIndex === 3) {
                  if (leafIndex === 0) fruitCornerNumbers = [1, 2, 3];
                  if (leafIndex === 2) fruitCornerNumbers = [1, 3, 4];
                  if (leafIndex === 3) fruitCornerNumbers = [2, 3, 4];
                } else if (branchIndex === 4) {
                  if (leafIndex === 1) fruitCornerNumbers = [1, 2, 4];
                  if (leafIndex === 2) fruitCornerNumbers = [1, 3, 4];
                  if (leafIndex === 3) fruitCornerNumbers = [2, 3, 4];
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

    const getAdjustedPosition = (x: number, y: number): [number, number] => {
      if (currentView !== 'delineated') return [x, y];

      const dx = x - centerX;
      const dy = y - centerY;
      return [
        centerX + dx * delineationFactor,
        centerY + dy * delineationFactor
      ];
    };

    if (currentView === 'standard' || currentView === 'delineated') {
      drawSquare(centerX, centerY, centerSquareSize, colors.root, "root", 0, "Center");

      const baseCorners = [
        [centerX - centerSquareSize / 2, centerY - centerSquareSize / 2],
        [centerX + centerSquareSize / 2, centerY - centerSquareSize / 2],
        [centerX - centerSquareSize / 2, centerY + centerSquareSize / 2],
        [centerX + centerSquareSize / 2, centerY + centerSquareSize / 2],
      ].map(([x, y]) => getAdjustedPosition(x, y)) as [number, number][];

      drawSquares(baseCorners, smallSquareSize, 0, "root", "Center");
    } else if (currentView === 'scoped' && selectedSquare) {
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
        chartId,
        ...data
      });

      setSquareStyles(prev => ({
        ...prev,
        [squareId]: {
          title: data.title,
          priority: data.priority,
          urgency: data.urgency,
          aesthetic: data.aesthetic
        }
      }));

      if (svgRef.current) {
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();
        drawChart();
      }

      setIsModalOpen(false);
      setSelectedSquare(null);

    } catch (error) {
      console.error('Error saving square customization:', error);
    }
  };

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const container = svgElement.parentElement;
    if (!container) return;

    function updateSVGDimensions() {
      if (!svgRef.current || !container) return;

      const boundingRect = container.getBoundingClientRect();
      const svg = d3.select(svgRef.current);

      svg
        .attr("width", boundingRect.width)
        .attr("height", boundingRect.height)
        .attr("viewBox", `0 0 ${boundingRect.width} ${boundingRect.height}`);
    }

    updateSVGDimensions();
    drawChart();

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
  }, [currentView, selectedSquare, squareStyles]);

  return (
    <div className="flex flex-col h-full space-y-4 p-4">
      <div className="flex justify-between">
        <div className="flex space-x-4">
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
        <Button
          onClick={toggleSquareForm}
          variant={showSquareForm ? 'default' : 'outline'}
        >
          {showSquareForm ? 'Hide Form' : 'Include/Exclude'}
        </Button>
      </div>

      <div className="flex-1 flex gap-4">
        <div className={`flex-1 min-h-0 border rounded-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative ${showSquareForm ? 'w-2/3' : 'w-full'}`}>
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

        {showSquareForm && (
          <div className="w-1/3 overflow-auto border rounded-lg p-4">
            <SquareForm
              squareData={selectedSquare ? {
                title: '',
                plane: '',
                purpose: '',
                delineator: '',
                notations: '',
                details: '',
                extraData: '',
                name: selectedSquare.class,
                size: '',
                color: '',
                type: selectedSquare.class,
                parent_id: selectedSquare.parent
              } : undefined}
              onSubmit={handleFormSubmit}
            />
          </div>
        )}
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