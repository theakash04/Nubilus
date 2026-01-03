import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "./ui/Button";

interface AccessDeniedProps {
  message?: string;
  onGoBack?: () => void;
}

export default function AccessDenied({
  message = "You don't have permission to access this resource.",
  onGoBack,
}: AccessDeniedProps) {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="rounded-full bg-destructive/10 p-6">
        <ShieldAlert className="h-16 w-16 text-destructive" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Access Denied</h1>
        <p className="text-muted-foreground max-w-[500px] text-lg">{message}</p>
      </div>

      <div className="flex items-center gap-4">
        {onGoBack && (
          <Button variant="secondary" onClick={onGoBack}>
            Go Back
          </Button>
        )}
        <Link to="/">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
