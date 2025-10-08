"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatTime } from "@/lib/time.utils";
import { cn } from "@/lib/utils";
import { useClipCreator } from "./ClipCreator.hooks";
import { ClipCreatorProps } from "./ClipCreator.types";

export function ClipCreator({ className }: ClipCreatorProps) {
  const {
    startTime,
    endTime,
    clipDuration,
    validationErrors,
    setStartTime,
    setEndTime,
    setStartToCurrentTime,
    setEndToCurrentTime,
    handleAddClip,
    resetClip,
  } = useClipCreator();

  const hasErrors = validationErrors.length > 0;
  const canAddClip = startTime !== null && endTime !== null && !hasErrors;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Create Clip</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="start-time">Start Time</Label>
          <div className="flex gap-2">
            <Input
              id="start-time"
              type="number"
              value={startTime ?? ""}
              onChange={(e) => setStartTime(Number(e.target.value))}
              placeholder="0.00"
              step="0.1"
              min="0"
              className="flex-1"
            />
            <Button
              onClick={setStartToCurrentTime}
              variant="outline"
            >
              Set Start
            </Button>
          </div>
          {startTime !== null && (
            <p className="text-sm text-muted-foreground">
              {formatTime(startTime)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="end-time">End Time</Label>
          <div className="flex gap-2">
            <Input
              id="end-time"
              type="number"
              value={endTime ?? ""}
              onChange={(e) => setEndTime(Number(e.target.value))}
              placeholder="0.00"
              step="0.1"
              min="0"
              className="flex-1"
            />
            <Button
              onClick={setEndToCurrentTime}
              variant="outline"
            >
              Set End
            </Button>
          </div>
          {endTime !== null && (
            <p className="text-sm text-muted-foreground">
              {formatTime(endTime)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Duration</Label>
          <p className="text-sm font-medium">
            {clipDuration > 0 ? formatTime(clipDuration) : "—"}
          </p>
        </div>

        {validationErrors.length > 0 && (
          <div className="space-y-1">
            {validationErrors.map((error, index) => (
              <p
                key={index}
                className="text-sm text-destructive"
              >
                {error.message}
              </p>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleAddClip}
            disabled={!canAddClip}
            className="flex-1"
          >
            Add Clip
          </Button>
          <Button
            onClick={resetClip}
            variant="outline"
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
