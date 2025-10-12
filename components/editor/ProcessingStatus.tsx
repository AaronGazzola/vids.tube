"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProcessingStatusDisplay } from "./ProcessingStatus.hooks";
import { ProcessingStatusProps } from "./ProcessingStatus.types";

export function ProcessingStatus({ className }: ProcessingStatusProps) {
  const { job, statusText, canDownload, handleDownload } =
    useProcessingStatusDisplay();

  if (!job) return null;

  const getStatusIcon = () => {
    switch (job.status) {
      case "PENDING":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "PROCESSING":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case "COMPLETED":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "FAILED":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Processing Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <span className="font-medium">{statusText}</span>
        </div>

        {job.status === "FAILED" && job.error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {job.error}
          </div>
        )}

        {canDownload && (
          <Button onClick={handleDownload} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download Video
          </Button>
        )}

        {(job.status === "PENDING" || job.status === "PROCESSING") && (
          <p className="text-sm text-muted-foreground">
            This may take several minutes depending on video length...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
