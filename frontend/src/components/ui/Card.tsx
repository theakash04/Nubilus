import type { ReactNode } from "react";

export const Card: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div
    className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 ${className}`}
  >
    {children}
  </div>
);
