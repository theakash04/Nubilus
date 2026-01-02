import type React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}
export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = "",
  ...props
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-foreground mb-1.5">
      {label}
    </label>
    <input
      className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-colors sm:text-sm bg-background text-foreground placeholder-muted-foreground ${
        error ? "border-destructive focus:ring-destructive" : "border-input"
      } ${className}`}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
  </div>
);
