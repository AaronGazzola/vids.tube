"use client";

import { cn } from "@/lib/utils";
import { Copy } from "lucide-react";
import { useState } from "react";
import { toast as sonnerToast } from "sonner";
import { CustomToastProps } from "./CustomToast.types";

export function CustomToast({
  variant,
  title,
  message,
  "data-cy": dataCy,
}: CustomToastProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const textToCopy = `${title}\n${message}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      throw new Error("Failed to copy to clipboard");
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4 shadow-lg flex items-start gap-3 min-w-[300px] max-w-[400px]",
        variant === "success" && "bg-green-50 border-green-200",
        variant === "error" && "bg-red-50 border-red-200",
        variant === "info" && "bg-blue-50 border-blue-200",
        variant === "warning" && "bg-yellow-50 border-yellow-200"
      )}
      data-cy={dataCy}
    >
      <div className="flex-1">
        <div className="font-semibold">{title}</div>
        <div className="text-sm mt-1">{message}</div>
      </div>
      <button
        onClick={handleCopy}
        className={cn(
          "p-1.5 rounded hover:bg-black/5 transition-colors flex-shrink-0",
          copied && "bg-black/10"
        )}
        title={copied ? "Copied!" : "Copy to clipboard"}
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>
  );
}

export const toast = {
  success: (title: string, message: string) => {
    sonnerToast.custom(() => (
      <CustomToast variant="success" title={title} message={message} />
    ));
  },
  error: (title: string, message: string) => {
    sonnerToast.custom(() => (
      <CustomToast variant="error" title={title} message={message} />
    ));
  },
  info: (title: string, message: string) => {
    sonnerToast.custom(() => (
      <CustomToast variant="info" title={title} message={message} />
    ));
  },
  warning: (title: string, message: string) => {
    sonnerToast.custom(() => (
      <CustomToast variant="warning" title={title} message={message} />
    ));
  },
};
