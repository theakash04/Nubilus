import { AuthLayout } from "@/components/Layouts/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { acceptInvite, setPassword } from "@/lib/api/Authapi";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle, Loader2, Lock, Users, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/accept-invite")({
  component: AcceptInvitePage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || undefined,
  }),
});

function AcceptInvitePage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();

  const [status, setStatus] = useState<
    "loading" | "password" | "success" | "error"
  >("loading");
  const [error, setError] = useState<string | null>(null);
  const [password, setPasswordValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Invalid invite link - no token provided");
      return;
    }

    async function processInvite() {
      try {
        const result = await acceptInvite(token!);
        if (result.success) {
          if (result.data.mustSetPassword) {
            setStatus("password");
          } else {
            setStatus("success");
            setTimeout(() => navigate({ to: "/dashboard" }), 2000);
          }
        } else {
          setStatus("error");
          setError(result.message || "Failed to accept invite");
        }
      } catch (err: any) {
        setStatus("error");
        setError(err?.response?.data?.message || "Failed to accept invite");
      }
    }

    processInvite();
  }, [token, navigate]);

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await setPassword(password);
      if (result.success) {
        setStatus("success");
        setTimeout(() => navigate({ to: "/dashboard" }), 2000);
      } else {
        setError(result.message || "Failed to set password");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to set password");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Accept Invitation">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Main Card */}
      <div className="relative w-full">

        {/* Icon Badge - overlapping header */}
        <div className="flex justify-center  relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-card">
            {status === "loading" && (
              <Loader2 className="h-8 w-8 text-primary-foreground animate-spin" />
            )}
            {status === "error" && (
              <XCircle className="h-8 w-8 text-primary-foreground" />
            )}
            {status === "success" && (
              <CheckCircle className="h-8 w-8 text-primary-foreground" />
            )}
            {status === "password" && (
              <Lock className="h-8 w-8 text-primary-foreground" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-4">
          {/* Loading State */}
          {status === "loading" && (
            <div className="text-center space-y-3">
              <h1 className="text-xl font-bold text-foreground">
                Accepting Invitation
              </h1>
              <p className="text-sm text-muted-foreground">
                Please wait while we verify your invitation...
              </p>
              <div className="flex items-center justify-center gap-2 pt-4">
                <div
                  className="w-2 h-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="text-center space-y-4">
              <h1 className="text-xl font-bold text-foreground">
                Invitation Failed
              </h1>
              <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg">
                {error}
              </p>
              <Button
                variant="secondary"
                className="w-full mt-4"
                onClick={() => navigate({ to: "/" })}
              >
                Go to Login
              </Button>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <div className="text-center space-y-3">
              <h1 className="text-xl font-bold text-foreground">
                Welcome to Nubilus!
              </h1>
              <p className="text-sm text-muted-foreground">
                You're all set! Redirecting to dashboard...
              </p>
              <div className="flex items-center justify-center gap-2 text-success mt-4">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">
                  You're now a team member
                </span>
              </div>
            </div>
          )}

          {/* Password Setup State */}
          {status === "password" && (
            <div className="space-y-4">
              <div className="text-center">
                <h1 className="text-xl font-bold text-foreground">
                  Set Your Password
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a password to complete your account setup
                </p>
              </div>

              <form onSubmit={handleSetPassword} className="space-y-4 pt-2">
                {error && (
                  <p className="text-sm text-center text-destructive bg-destructive/10 px-4 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  placeholder="Enter your password"
                  required
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />

                {password && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${password.length >= 6 ? "bg-success" : "bg-muted"}`}
                      />
                      <span
                        className={
                          password.length >= 6
                            ? "text-success"
                            : "text-muted-foreground"
                        }
                      >
                        At least 6 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${password === confirmPassword && confirmPassword ? "bg-success" : "bg-muted"}`}
                      />
                      <span
                        className={
                          password === confirmPassword && confirmPassword
                            ? "text-success"
                            : "text-muted-foreground"
                        }
                      >
                        Passwords match
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  isLoading={isSubmitting}
                  disabled={password.length < 6 || password !== confirmPassword}
                >
                  Set Password & Continue
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted/30 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            Nubilus • Server Monitoring Platform
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
