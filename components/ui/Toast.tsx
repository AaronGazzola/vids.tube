import { cn } from "@/lib/utils";

interface ToastProps {
  variant: "success" | "error";
  title: string;
  message: string;
  "data-cy"?: string;
}

export function Toast({ variant, title, message, "data-cy": dataCy }: ToastProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 shadow-lg",
        variant === "success" && "bg-green-50 border-green-200",
        variant === "error" && "bg-red-50 border-red-200"
      )}
      data-cy={dataCy}
    >
      <div className="font-semibold">{title}</div>
      <div className="text-sm mt-1">{message}</div>
    </div>
  );
}
