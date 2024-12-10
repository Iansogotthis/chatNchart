import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';

interface ChartProps {
  data?: any;
  onSave?: (data: any) => void;
}

export function ChartVisualization({ data, onSave }: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = window.innerWidth * 0.9;
    const height = window.innerHeight * 0.9;
    
    // Clear existing content
    svg.selectAll("*").remove();
    
    svg.attr("viewBox", `0 0 ${width} ${height}`)
       .attr("preserveAspectRatio", "xMidYMid meet");

    // Implement existing D3.js visualization logic here
    // Converted from the provided HTML/JS implementation
    const centerX = width / 2;
    const centerY = height / 2;
    const centerSquareSize = Math.min(width, height) / 2;

    function drawSquare(x: number, y: number, size: number, color: string, className: string) {
      svg.append("rect")
         .attr("x", x - size / 2)
         .attr("y", y - size / 2)
         .attr("width", size)
         .attr("height", size)
         .attr("class", `square ${className}`)
         .attr("fill", color)
         .on("click", () => {
           toast({
             title: "Square clicked",
             description: `${className} square was clicked`
           });
         });

      svg.append("text")
         .attr("x", x)
         .attr("y", y)
         .attr("dy", "0.35em")
         .attr("text-anchor", "middle")
         .attr("font-size", size / 5)
         .attr("pointer-events", "none")
         .text(className);
    }

    // Draw root square
    drawSquare(centerX, centerY, centerSquareSize, "#60A5FA", "root");

    // Draw child squares
    const childSize = centerSquareSize * 0.4;
    const offset = centerSquareSize * 0.6;

    // Top square
    drawSquare(centerX, centerY - offset, childSize, "#34D399", "metrics");
    
    // Right square
    drawSquare(centerX + offset, centerY, childSize, "#F472B6", "trends");
    
    // Bottom square
    drawSquare(centerX, centerY + offset, childSize, "#A78BFA", "analysis");
    
    // Left square
    drawSquare(centerX - offset, centerY, childSize, "#FBBF24", "data");

    // Add interactivity
    svg.selectAll(".square")
       .style("cursor", "pointer")
       .style("transition", "transform 0.2s")
       .on("mouseover", function() {
         d3.select(this)
           .style("transform", "scale(1.1)");
       })
       .on("mouseout", function() {
         d3.select(this)
           .style("transform", "scale(1)");
       });
    
  }, [data]);

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}
