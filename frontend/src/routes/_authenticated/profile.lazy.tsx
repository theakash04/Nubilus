import { Card } from "@/components/ui/Card";
import { ComingSoon } from "@/components/ComingSoon";
import { Input } from "@/components/ui/Input";
import { useTheme } from "@/hooks/useTheme";
import { useUser, useLogout } from "@/hooks/useAuthActions";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CloudLightning,
  Layout,
  LogOut,
  Moon,
  Shield,
  Sun,
  User,
} from "lucide-react";
import { useState } from "react";

export const Route = createLazyFileRoute("/_authenticated/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "preferences"
  >("profile");
  const navigate = useNavigate();
  const { theme, currentTheme, setUserTheme } = useTheme();
  const { user } = useUser();
  const logoutMutation = useLogout();

  // Profile Form State (read-only for now since we don't have update API)
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  const handleLogout = () => {
    logoutMutation.mutate();
  };

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
              <ComingSoon
                title="Security Settings"
                description="Two-factor authentication, password changes, and session management are coming soon."
              />
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
