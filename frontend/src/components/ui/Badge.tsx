import type React from "react";
import type { ReactNode } from "react";

export const Badge: React.FC<{
  status: "success" | "warning" | "error" | "neutral" | "info";
  children: ReactNode;
}> = ({ status, children }) => {
  const styles = {
    success: "bg-success/10 text-success border border-success/20",
    warning: "bg-warning/10 text-warning border border-warning/20",
    error: "bg-destructive/10 text-destructive border border-destructive/20",
    neutral: "bg-muted text-muted-foreground border border-border",
    info: "bg-primary/10 text-primary border border-primary/20",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}
    >
      {children}
    </span>
  );
};
