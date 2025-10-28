"use client";

import { useState } from "react";
import { VideoGridProps, SortOption, VideoQueryParams } from "@/app/page.types";
import { cn } from "@/lib/utils";
import { VideoCard } from "./VideoCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Filter, SortAsc, Search } from "lucide-react";
import { useDebounce } from "use-debounce";
import { useGetVideos } from "@/app/page.hooks";

export function VideoGrid({ className }: Omit<VideoGridProps, "videos">) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch] = useDebounce(searchInput, 500);
  const [sortOption, setSortOption] = useState<SortOption>({
    field: "publishedAt",
    order: "desc",
  });
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [viewFilter, setViewFilter] = useState<string>("all");

  const getDateFilterValue = () => {
    const now = new Date();
    switch (dateFilter) {
      case "week":
        return {
          from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        };
      case "month":
        return {
          from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        };
      case "year":
        return {
          from: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
        };
      default:
        return undefined;
    }
  };

  const getViewFilterValue = () => {
    switch (viewFilter) {
      case "1k":
        return { minViews: 1000 };
      case "10k":
        return { minViews: 10000 };
      case "100k":
        return { minViews: 100000 };
      case "1m":
        return { minViews: 1000000 };
      default:
        return {};
    }
  };

  const queryParams: VideoQueryParams = {
    search: debouncedSearch || undefined,
    dateFilter: getDateFilterValue(),
    sort: sortOption,
    ...getViewFilterValue(),
  };

  const { data: videos, isLoading, error } = useGetVideos(queryParams);

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">Failed to load videos</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos by title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Date Published</h4>
                <RadioGroup value={dateFilter} onValueChange={setDateFilter}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="date-all" />
                    <Label htmlFor="date-all">All time</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="week" id="date-week" />
                    <Label htmlFor="date-week">Last week</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="month" id="date-month" />
                    <Label htmlFor="date-month">Last month</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="year" id="date-year" />
                    <Label htmlFor="date-year">Last year</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <h4 className="font-medium mb-3">Minimum Views</h4>
                <RadioGroup value={viewFilter} onValueChange={setViewFilter}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="views-all" />
                    <Label htmlFor="views-all">Any</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1k" id="views-1k" />
                    <Label htmlFor="views-1k">1,000+</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="10k" id="views-10k" />
                    <Label htmlFor="views-10k">10,000+</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="100k" id="views-100k" />
                    <Label htmlFor="views-100k">100,000+</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1m" id="views-1m" />
                    <Label htmlFor="views-1m">1,000,000+</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <SortAsc className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium mb-3">Sort By</h4>
              <RadioGroup
                value={`${sortOption.field}-${sortOption.order}`}
                onValueChange={(value) => {
                  const [field, order] = value.split("-") as [
                    SortOption["field"],
                    SortOption["order"]
                  ];
                  setSortOption({ field, order });
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="publishedAt-desc"
                    id="sort-newest"
                  />
                  <Label htmlFor="sort-newest">Newest first</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="publishedAt-asc"
                    id="sort-oldest"
                  />
                  <Label htmlFor="sort-oldest">Oldest first</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="viewCount-desc"
                    id="sort-most-views"
                  />
                  <Label htmlFor="sort-most-views">Most views</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="viewCount-asc"
                    id="sort-least-views"
                  />
                  <Label htmlFor="sort-least-views">Least views</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="likeCount-desc"
                    id="sort-most-likes"
                  />
                  <Label htmlFor="sort-most-likes">Most likes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="likeCount-asc"
                    id="sort-least-likes"
                  />
                  <Label htmlFor="sort-least-likes">Least likes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="duration-desc"
                    id="sort-longest"
                  />
                  <Label htmlFor="sort-longest">Longest duration</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="duration-asc"
                    id="sort-shortest"
                  />
                  <Label htmlFor="sort-shortest">Shortest duration</Label>
                </div>
              </RadioGroup>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading videos...</p>
        </div>
      )}

      {!isLoading && videos && videos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground text-lg">No videos found</p>
          <p className="text-muted-foreground text-sm mt-2">
            {searchInput || dateFilter !== "all" || viewFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Videos will appear here once they are synced from your YouTube channel"}
          </p>
        </div>
      )}

      {!isLoading && videos && videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
