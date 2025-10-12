"use client";

import { Loader2, CheckCircle2, XCircle, Clock, X } from "lucide-react";
import { JobStatus } from "@/app/page.types";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProcessingToastProps {
  status: JobStatus;
  currentStep?: string | null;
  progress?: number;
  totalSteps?: number;
  currentClip?: number;
  totalClips?: number;
  error?: string | null;
  onClose?: () => void;
}

export function ProcessingToast({ status, currentStep, progress, totalSteps, currentClip, totalClips, error, onClose }: ProcessingToastProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const getStatusIcon = () => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />;
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

  const getStatusText = () => {
    if (currentStep) {
      return currentStep;
    }
    switch (status) {
      case "PENDING":
        return "Queued...";
      case "PROCESSING":
        return "Processing video...";
      case "COMPLETED":
        return "Video ready!";
      case "FAILED":
        return "Processing failed";
      default:
        return "";
    }
  };

  const getProgressText = () => {
    const parts: string[] = [];
    if (totalClips && totalClips > 0) {
      parts.push(`Clip ${currentClip || 0}/${totalClips}`);
    }
    if (totalSteps && totalSteps > 0) {
      parts.push(`Step ${progress || 0}/${totalSteps}`);
    }
    return parts.join(" • ");
  };

  const handleCloseClick = () => {
    if (status === "PENDING" || status === "PROCESSING") {
      setShowCancelDialog(true);
    } else {
      onClose?.();
    }
  };

  const handleCancelConfirm = () => {
    setShowCancelDialog(false);
    onClose?.();
  };

  const progressText = getProgressText();

  return (
    <>
      <div className="flex items-center justify-between gap-3 bg-background border rounded-lg p-4 shadow-lg min-w-[300px] max-w-[400px]">
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>
          {progressText && (
            <div className="text-xs text-muted-foreground ml-8">
              {progressText}
            </div>
          )}
          {status === "FAILED" && error && (
            <div className="text-xs text-red-500 ml-8 mt-1">
              {error}
            </div>
          )}
        </div>
        <button
          onClick={handleCloseClick}
          className="text-muted-foreground hover:text-foreground transition-colors self-start"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Processing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the video processing. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Processing</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelConfirm}>
              Cancel Processing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
