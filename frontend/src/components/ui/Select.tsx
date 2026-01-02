import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { label: string; value: string }[];
}
export const Select: React.FC<SelectProps> = ({
  label,
  options,
  className = "",
  ...props
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-foreground mb-1.5">
      {label}
    </label>
    <div className="relative">
      <select
        className={`appearance-none w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-colors sm:text-sm bg-background text-foreground border-input ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
        <ChevronDown className="h-4 w-4" />
      </div>
    </div>
  </div>
);
