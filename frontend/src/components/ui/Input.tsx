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
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
      {label}
    </label>
    <input
      className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-colors sm:text-sm bg-white dark:bg-slate-950 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 ${
        error
          ? "border-rose-300 focus:ring-rose-500 focus:border-rose-500 dark:border-rose-700"
          : "border-slate-300 dark:border-slate-700"
      } ${className}`}
      {...props}
    />
    {error && (
      <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{error}</p>
    )}
  </div>
);
