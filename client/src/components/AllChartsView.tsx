import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useState } from "react";
import { Chart } from "@db/schema";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export function AllChartsView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "title">("recent");
  const [, setLocation] = useLocation();

  const { data: charts, isLoading } = useQuery<Chart[]>({
    queryKey: ["charts"],
    queryFn: async () => {
      const response = await fetch("/api/charts");
      if (!response.ok) throw new Error("Failed to fetch charts");
      return response.json();
    },
  });

  const filteredAndSortedCharts = charts
    ?.filter((chart) =>
      chart.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "recent") {
        return (
          new Date(b.updatedAt || Date.now()).getTime() - 
          new Date(a.updatedAt || Date.now()).getTime()
        );
      }
      return a.title.localeCompare(b.title);
    });

  return (
    <div className="container mx-auto max-w-7xl p-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Input
            placeholder="Search charts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={sortBy} onValueChange={(value: "recent" | "title") => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAndSortedCharts?.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedCharts.map((chart) => (
              <Card key={chart.id} className="overflow-hidden">
                <CardHeader className="space-y-1">
                  <CardTitle className="line-clamp-1">{chart.title}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Updated {new Date(chart.updatedAt || Date.now()).toLocaleDateString()}
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setLocation(`/chart/${chart.id}`)}
                  >
                    View Chart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-lg font-medium">No charts found</p>
            <p className="text-sm text-muted-foreground">
              {searchTerm
                ? "Try adjusting your search"
                : "Create your first chart to get started"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}