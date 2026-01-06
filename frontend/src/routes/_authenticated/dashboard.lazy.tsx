import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useUser, useLogout } from "@/hooks/useAuthActions";
import { useTheme } from "@/hooks/useTheme";
import { createOrg, ListMyOrgs } from "@/lib/api/organizations.api";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CloudLightning,
  Loader2,
  Moon,
  Plus,
  Sun,
} from "lucide-react";
import { useState } from "react";
import type { Organization } from "@/lib/types/org.types";

export const Route = createLazyFileRoute("/_authenticated/dashboard")({
  component: RouteComponent,
});

export default function RouteComponent() {
  const { user } = useUser();
  const logoutMutation = useLogout();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, setUserTheme, currentTheme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { data: orgsResponse, isLoading: orgsLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: ListMyOrgs,
    staleTime: 1000 * 60 * 5,
  });

  const organizations: Organization[] = Array.isArray(
    orgsResponse?.data?.organizations
  )
    ? orgsResponse.data.organizations
    : [];

  const handleOrgSelect = (orgId: string) => {
    navigate({ to: "/dashboard/$orgId", params: { orgId } });
  };

  const handleCreate = async () => {
    if (!newOrgName || isCreating) return;

    setIsCreating(true);
    try {
      const org = await createOrg({ name: newOrgName });
      if (!org.success) {
        return;
      }

      setIsModalOpen(false);
      setNewOrgName("");

      await queryClient.invalidateQueries({ queryKey: ["organizations"] });
      navigate({ to: "/dashboard/$orgId", params: { orgId: org.data.id } });
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-200 flex flex-col">
      <header className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-primary rounded-lg shadow-md shadow-primary/20">
            <CloudLightning className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">Nubilus</span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() =>
              setUserTheme(currentTheme === "dark" ? "light" : "dark")
            }
            className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-accent"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={() => navigate({ to: "/profile" })}
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            Profile
          </button>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Welcome back,{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-purple-500">
                {user?.name}
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Select an organization to launch your dashboard.
            </p>
          </div>

          {orgsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  onClick={() => handleOrgSelect(org.id)}
                  className="group bg-card border border-border hover:border-primary rounded-2xl p-6 cursor-pointer shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-200 transform hover:-translate-y-1 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="text-primary h-5 w-5" />
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center text-lg font-bold text-muted-foreground group-hover:text-primary mb-4 transition-colors">
                    {org.name.charAt(0)}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {org.name}
                  </h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    Organization
                  </p>
                </div>
              ))}
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-muted/50 border-2 border-dashed border-border hover:border-primary rounded-2xl p-6 flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted transition-all duration-200 h-full min-h-[180px] cursor-pointer"
              >
                <div className="h-10 w-10 rounded-full border-2 border-current flex items-center justify-center mb-3">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="font-medium">Create Organization</span>
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground">
        Nubilus Infrastructure Monitoring • MIT License
      </footer>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Organization"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newOrgName || isCreating}
              isLoading={isCreating}
            >
              Create
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground mb-4">
          Create a new workspace for your projects.
        </p>
        <Input
          label="Organization Name"
          placeholder="New Project"
          value={newOrgName}
          onChange={(e) => setNewOrgName(e.target.value)}
          autoFocus
        />
      </Modal>
    </div>
  );
}
