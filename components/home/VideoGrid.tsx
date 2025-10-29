"use client";

import { useState, useRef, useEffect } from "react";
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
import { SortAsc, Search, Loader2 } from "lucide-react";
import { useDebounce } from "use-debounce";
import { useGetVideosInfinite } from "@/app/page.hooks";

export function VideoGrid({ className }: Omit<VideoGridProps, "videos">) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch] = useDebounce(searchInput, 500);
  const [sortOption, setSortOption] = useState<SortOption>({
    field: "publishedAt",
    order: "desc",
  });
  const observerTarget = useRef<HTMLDivElement>(null);

  const queryParams: Omit<VideoQueryParams, "cursor"> = {
    search: debouncedSearch || undefined,
    sort: sortOption,
  };

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetVideosInfinite(queryParams);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const videos = data?.pages.flatMap((page) => page.videos) ?? [];

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

      {!isLoading && videos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground text-lg">No videos found</p>
          <p className="text-muted-foreground text-sm mt-2">
            {searchInput
              ? "Try adjusting your search"
              : "Videos will appear here once they are synced from your YouTube channel"}
          </p>
        </div>
      )}

      {videos.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>

          <div ref={observerTarget} className="flex justify-center py-8">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading more videos...</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
