import type React from "react";
import { Construction, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface ComingSoonProps {
  title?: string;
  description?: string;
  backLink?: string;
  backLabel?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
  title = "Coming Soon",
  description = "We're working hard to bring you this feature. Stay tuned!",
  backLink,
  backLabel = "Go Back",
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 h-full">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary-500/20 blur-2xl rounded-full" />
        <div className="relative p-4 bg-linear-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg">
          <Construction className="h-10 w-10 text-white" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
        {title}
      </h2>

      <p className="text-muted-foreground text-center max-w-md mb-6">
        {description}
      </p>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
        Under Development
      </div>

      {backLink && (
        <Link
          to={backLink}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:opacity-80 bg-primary/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      )}
    </div>
  );
};
