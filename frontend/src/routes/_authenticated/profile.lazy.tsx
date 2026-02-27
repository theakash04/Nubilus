import { Card } from "@/components/ui/Card";
import { ComingSoon } from "@/components/ComingSoon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useTheme } from "@/hooks/useTheme";
import { useUser, useLogout } from "@/hooks/useAuthActions";
import { getActiveSessionsAuth, revokeSession } from "@/lib/api/Authapi";
import type { SessionInfo } from "@/lib/api/Authapi";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Layout,
  LogOut,
  Monitor,
  Moon,
  Shield,
  Smartphone,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const Route = createLazyFileRoute("/_authenticated/profile")({
  component: RouteComponent,
});

function parseDeviceInfo(userAgent: string) {
  if (!userAgent || userAgent === "Unknown Device") {
    return { browser: "Unknown", os: "Unknown Device", isMobile: false };
  }

  let browser = "Unknown";
  if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Edg/")) browser = "Edge";
  else if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Safari")) browser = "Safari";

  let os = "Unknown";
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac OS")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad"))
    os = "iOS";

  const isMobile =
    userAgent.includes("Mobile") ||
    userAgent.includes("Android") ||
    userAgent.includes("iPhone");

  return { browser, os, isMobile };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function SessionCard({
  session,
  onRevoke,
  isRevoking,
}: {
  session: SessionInfo;
  onRevoke: (id: string) => void;
  isRevoking: boolean;
}) {
  const { browser, os, isMobile } = parseDeviceInfo(session.deviceInfo);
  const DeviceIcon = isMobile ? Smartphone : Monitor;

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
        session.isCurrent
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card hover:bg-accent/30"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`p-2 rounded-lg shrink-0 ${
            session.isCurrent
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <DeviceIcon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">
              {browser} on {os}
            </span>
            {session.isCurrent && (
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary whitespace-nowrap">
                This device
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{session.ipAddress || "Unknown IP"}</span>
            <span>·</span>
            <span>Active {timeAgo(session.createdAt)}</span>
          </div>
        </div>
      </div>

      {!session.isCurrent && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRevoke(session.id)}
          disabled={isRevoking}
          isLoading={isRevoking}
          className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function RouteComponent() {
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "preferences"
  >("profile");
  const navigate = useNavigate();
  const { theme, currentTheme, setUserTheme } = useTheme();
  const { user } = useUser();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();

  // Profile Form State (read-only for now since we don't have update API)
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  // Session data
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const {
    data: sessionData,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useQuery({
    queryKey: ["sessions"],
    queryFn: getActiveSessionsAuth,
    enabled: activeTab === "security",
    staleTime: 1000 * 30,
  });

  const revokeMutation = useMutation({
    mutationFn: revokeSession,
    onMutate: (id) => setRevokingId(id),
    onSettled: () => setRevokingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const sessions: SessionInfo[] = sessionData?.sessions ?? [];

  return (
    <div className="min-h-screen bg-background transition-colors duration-200 flex flex-col">
      {/* Header with glassmorphism */}
      <header className="px-4 sm:px-6 py-3 flex justify-between items-center bg-background/80 backdrop-blur-xl sticky top-0 z-10 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: ".." })}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              setUserTheme(currentTheme === "dark" ? "light" : "dark")
            }
            className="relative p-2.5 rounded-xl text-muted-foreground hover:text-warning hover:bg-accent transition-all cursor-pointer"
            title={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="p-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Log out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Account Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your personal details and security preferences.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Settings Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <nav className="space-y-1">
              {[
                { id: "profile", icon: User, label: "Profile" },
                { id: "security", icon: Shield, label: "Security" },
                { id: "preferences", icon: Layout, label: "App Preferences" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as typeof activeTab)}
                  className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    activeTab === item.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <item.icon
                    className={`shrink-0 -ml-1 mr-3 h-4 w-4 ${activeTab === item.id ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 space-y-6">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border border-primary/20">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        Personal Info
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        View your account details.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5 max-w-lg">
                    <Input
                      label="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled
                    />
                    <Input
                      label="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Profile editing coming soon.
                    </p>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="mb-5">
                    <h3 className="text-lg font-bold text-foreground">
                      Active Sessions
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage your active login sessions. You can revoke access
                      from any device you no longer use.
                    </p>
                  </div>

                  {sessionsLoading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <svg
                          className="animate-spin h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        <span className="text-sm">Loading sessions...</span>
                      </div>
                    </div>
                  )}

                  {sessionsError && (
                    <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      Failed to load sessions. Please try again.
                    </div>
                  )}

                  {!sessionsLoading && !sessionsError && (
                    <div className="space-y-3">
                      {sessions.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No active sessions found.
                        </p>
                      ) : (
                        <>
                          {/* Current session first, then others */}
                          {[
                            ...sessions.filter((s) => s.isCurrent),
                            ...sessions.filter((s) => !s.isCurrent),
                          ].map((session) => (
                            <SessionCard
                              key={session.id}
                              session={session}
                              onRevoke={(id) => revokeMutation.mutate(id)}
                              isRevoking={revokingId === session.id}
                            />
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {activeTab === "preferences" && (
              <ComingSoon
                title="App Preferences"
                description="Customize your startup view, notification settings, and more. Coming soon."
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
