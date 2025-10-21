export interface CustomToastProps {
  variant: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  "data-cy"?: string;
}
