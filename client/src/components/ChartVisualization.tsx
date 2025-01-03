import { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';
import '@/styles/chart.css';
import SquareModal from '@/components/SquareModal';
import { SquareForm } from '@/components/SquareForm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import type { Chart } from "@db/schema";
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

type ViewType = 'standard' | 'delineated' | 'scaled' | 'scoped';

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
  const [buttonsEnabled, setButtonsEnabled] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [squareStyles, setSquareStyles] = useState<Record<string, any>>({});

  const getNextHierarchyLevel = (currentClass: string) => {
    switch (currentClass) {
      case 'root': return 'branch';
      case 'branch': return 'leaf';
      case 'leaf': return 'fruit';
      default: return null;
    }
  };

  const getPreviousHierarchyLevel = (currentClass: string) => {
    switch (currentClass) {
      case 'fruit': return 'leaf';
      case 'leaf': return 'branch';
      case 'branch': return 'root';
      default: return null;
    }
  };

  function handleSquareClick(className: string, parentText: string, depth: number) {
    const newSquare = { class: className, parent: parentText, depth };

    // If buttons are enabled, this is a second click
    if (buttonsEnabled && selectedSquare?.class === className &&
        selectedSquare?.parent === parentText && selectedSquare?.depth === depth) {
      setIsModalOpen(true);
      setButtonsEnabled(false);
    } else {
      // First click - enable buttons and select square
      setSelectedSquare(newSquare);
      setButtonsEnabled(true);

      // Handle view transitions
      if (currentView === 'scoped') {
        const previousClass = getPreviousHierarchyLevel(className);
        if (!previousClass) {
          toast.error("Cannot go up further from root");
          return;
        }

        const pathParts = parentText.split('_');
        const parentPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('_') : 'Center';

        setSelectedSquare({
          class: previousClass,
          parent: parentPath,
          depth: depth - 1
        });
      } else if (currentView === 'scaled') {
        setSelectedSquare(newSquare);
      }
    }
  }

  function drawSquare(x: number, y: number, size: number, color: string, className: string, depth: number, parentText: string) {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    const squareId = `${className}_${parentText}_${depth}`;
    const customStyle = squareStyles[squareId];

    const group = svg.append("g")
      .attr("class", `square-group ${className}`)
      .attr("transform", `translate(${x},${y})`)
      .attr("role", "button")
      .attr("tabindex", "0")
      .on("click", () => handleSquareClick(className, parentText, depth));

    const rect = group.append("rect")
      .attr("x", -size / 2)
      .attr("y", -size / 2)
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
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
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
    return size;
  }

  function drawChart() {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const boundingRect = svgRef.current.getBoundingClientRect();
    const width = boundingRect.width;
    const height = boundingRect.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Base size calculations
    const baseSize = Math.min(width, height) * 0.35;
    const centerSize = baseSize;
    const leafSize = baseSize * 0.45;
    const fruitSize = leafSize * 0.45;

    function drawSquareFamily(centerSquare: SelectedSquare) {
      // Draw center square
      drawSquare(
        centerX,
        centerY,
        centerSize,
        colors[centerSquare.class as keyof typeof colors] || "",
        centerSquare.class,
        centerSquare.depth,
        centerSquare.parent
      );

      const childClass = getNextHierarchyLevel(centerSquare.class);
      if (!childClass) return;

      const offset = centerSize * 0.75;
      const childPositions = [
        [centerX - offset, centerY - offset],
        [centerX + offset, centerY - offset],
        [centerX - offset, centerY + offset],
        [centerX + offset, centerY + offset]
      ];

      childPositions.forEach(([x, y], index) => {
        const childParent = `${centerSquare.parent}_${index + 1}`;

        drawSquare(
          x,
          y,
          leafSize,
          colors[childClass as keyof typeof colors] || "",
          childClass,
          centerSquare.depth + 1,
          childParent
        );

        // In scaled view, show all descendants
        if (currentView === 'scaled') {
          const grandchildClass = getNextHierarchyLevel(childClass);
          if (grandchildClass) {
            const grandchildOffset = leafSize * 0.75;
            const grandchildPositions = [
              [x - grandchildOffset, y - grandchildOffset],
              [x + grandchildOffset, y - grandchildOffset],
              [x - grandchildOffset, y + grandchildOffset],
              [x + grandchildOffset, y + grandchildOffset]
            ];

            grandchildPositions.forEach(([gx, gy], gIndex) => {
              drawSquare(
                gx,
                gy,
                fruitSize,
                colors[grandchildClass as keyof typeof colors] || "",
                grandchildClass,
                centerSquare.depth + 2,
                `${childParent}_${gIndex + 1}`
              );
            });
          }
        }
      });
    }

    if (currentView === 'scaled' || currentView === 'scoped') {
      if (selectedSquare) {
        drawSquareFamily(selectedSquare);
      }
    } else {
      const rootSquare = { class: 'root', parent: 'Center', depth: 0 };
      drawSquareFamily(rootSquare);
    }

    // Add CSS styles for animations and interactions
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = `
      .square { transition: all 0.3s ease-in-out; }
      .square:hover { filter: brightness(0.9); cursor: pointer; }
      .square-selected { 
        filter: brightness(1.1);
        stroke: var(--primary);
        stroke-width: 2px;
      }
      text { user-select: none; }
      .square-group:focus { outline: none; }
      .square-group:focus .square { 
        stroke: var(--primary);
        stroke-width: 2px;
      }
    `;
    svg.node()?.appendChild(style);
  }

  useEffect(() => {
    const container = svgRef.current?.parentElement;
    if (!container) return;

    function updateDimensions() {
      if (!svgRef.current || !container) return;

      const boundingRect = container.getBoundingClientRect();
      const svg = d3.select(svgRef.current);

      svg
        .attr("width", boundingRect.width)
        .attr("height", boundingRect.height)
        .attr("viewBox", `0 0 ${boundingRect.width} ${boundingRect.height}`);

      drawChart();
    }

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [currentView, selectedSquare, squareStyles]);

  const handleViewChange = (viewType: ViewType) => {
    if (!selectedSquare && (viewType === 'scaled' || viewType === 'scoped')) {
      toast.info("Please select a square first");
      return;
    }

    setCurrentView(viewType);
    if (viewType === 'standard' || viewType === 'delineated') {
      setSelectedSquare(null);
      setButtonsEnabled(false);
    }
  };

  const toggleSquareForm = () => {
    if (!selectedSquare) {
      toast.info("Please select a square first");
      return;
    }
    setShowSquareForm(!showSquareForm);
  };

  const { data: customizations } = useQuery({
    queryKey: ['square-customizations', chart.id],
    queryFn: async () => {
      if (!chart.id) return [];
      const response = await fetch(`/api/square-customization/${chart.id}`);
      if (!response.ok) throw new Error('Failed to fetch customizations');
      return response.json();
    },
    enabled: !!chart.id,
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
          chartId: chart.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save square customization');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['square-customizations', chart.id] });
      toast.success('Square customization saved');
    },
    onError: (error) => {
      console.error('Error saving square customization:', error);
      toast.error('Failed to save customization');
    }
  });

  const handleFormSubmit = async (data: any) => {
    if (!selectedSquare || !user) {
      console.error('Missing required data for submission');
      return;
    }

    try {
      await squareCustomizationMutation.mutateAsync({
        squareClass: selectedSquare.class,
        parentText: selectedSquare.parent,
        depth: selectedSquare.depth,
        ...data
      });

      setIsModalOpen(false);
      setSelectedSquare(null);
    } catch (error) {
      console.error('Error saving square customization:', error);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full space-y-4 p-4">
        <div className="flex justify-between items-center sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4">
          <div className="flex space-x-2 overflow-x-auto scrollbar-thin scrollbar-thumb-border">
            {['standard', 'delineated', 'scaled', 'scoped'].map((viewType) => (
              <Button
                key={viewType}
                onClick={() => handleViewChange(viewType as ViewType)}
                variant={currentView === viewType ? 'default' : 'outline'}
                className="whitespace-nowrap"
                disabled={!selectedSquare && (viewType === 'scaled' || viewType === 'scoped')}
              >
                {viewType.charAt(0).toUpperCase() + viewType.slice(1)} View
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-4">
            {selectedSquare && (
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Selected: {selectedSquare.class}
              </span>
            )}
            <Button
              onClick={toggleSquareForm}
              variant={showSquareForm ? 'default' : 'outline'}
              className="whitespace-nowrap"
              disabled={!selectedSquare}
            >
              In/Exclude
            </Button>
          </div>
        </div>

        <div className="flex-1 flex gap-4 min-h-0">
          <div className={`flex-1 min-h-0 border rounded-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative ${
            showSquareForm ? 'w-2/3' : 'w-full'
          }`}>
            <div className="absolute inset-0 overflow-auto">
              <div className="aspect-square w-full h-full relative">
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
                </svg>
              </div>
            </div>
          </div>

          {showSquareForm && selectedSquare && (
            <div className="w-1/3 overflow-auto border rounded-lg p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <ScrollArea className="h-full pr-4">
                <SquareForm
                  squareData={{
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
                  }}
                  onSubmit={handleFormSubmit}
                />
              </ScrollArea>
            </div>
          )}
        </div>

        {selectedSquare && (
          <SquareModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              if (currentView === 'standard' || currentView === 'delineated') {
                setSelectedSquare(null);
              }
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
            squareClass={selectedSquare.class}
            parentText={selectedSquare.parent}
            depth={selectedSquare.depth}
          />
        )}
      </div>
    </TooltipProvider>
  );
}