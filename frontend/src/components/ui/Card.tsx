import type { ReactNode } from "react";

export const Card: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div
    className={`bg-card text-card-foreground rounded-xl shadow-sm border border-border ${className}`}
  >
    {children}
  </div>
);
