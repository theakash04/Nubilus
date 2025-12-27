import { useUser, useLogout } from "@/hooks/useAuthActions";
import { useTheme } from "@/hooks/useTheme";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ListMyOrgs, createOrg } from "@/lib/api/organizations.api";
import type { Organization } from "@/lib/types/org.types";
import {
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CloudLightning,
  Database,
  Globe,
  Key,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Server,
  Sun,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import NavItem from "./NavLayout";

export const AppLayout: React.FC<{
  children: React.ReactNode;
  orgId?: string;
}> = ({ children, orgId }) => {
  const { user } = useUser();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar_collapsed") === "true";
    }
    return false;
  });

  // Org Switcher State
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const orgMenuRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { theme, setUserTheme, currentTheme } = useTheme();

  // Fetch organizations from TanStack Query (same cache as dashboard)
  const { data: orgsResponse } = useQuery({
    queryKey: ["organizations"],
    queryFn: ListMyOrgs,
    staleTime: 1000 * 60 * 5,
  });

  const organizations: Organization[] = Array.isArray(
    orgsResponse?.data?.organizations
  )
    ? orgsResponse.data.organizations
    : [];

  // Get current organization from orgId prop or first org in list
  const currentOrganization = orgId
    ? organizations.find((org) => org.id === orgId)
    : organizations[0];

  // Close org menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        orgMenuRef.current &&
        !orgMenuRef.current.contains(event.target as Node)
      ) {
        setOrgMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("sidebar_collapsed", String(newState));
  };

  const handleCreateOrg = async () => {
    if (!newOrgName || isCreating) return;

    setIsCreating(true);
    try {
      const org = await createOrg({ name: newOrgName });
      if (org.success) {
        await queryClient.invalidateQueries({ queryKey: ["organizations"] });
        setNewOrgName("");
        setIsCreateOrgModalOpen(false);
        setOrgMenuOpen(false);
        navigate({ to: "/dashboard/$orgId", params: { orgId: org.data.id } });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const navItems = [
    { to: `/dashboard/${orgId}`, icon: LayoutDashboard, label: "Dashboard" },
    { to: `/dashboard/${orgId}/servers`, icon: Server, label: "Servers" },
    { to: `/dashboard/${orgId}/endpoints`, icon: Globe, label: "Endpoints" },
    { to: `/dashboard/${orgId}/databases`, icon: Database, label: "Databases" },
    { to: `/dashboard/${orgId}/keys`, icon: Key, label: "API Keys" },
    { to: `/dashboard/${orgId}/users`, icon: Users, label: "Members" },
  ];

  const SidebarContent = ({ isMobile = false }) => (
    <>
      {/* Org Switcher Header */}
      <div
        className={`h-16 flex items-center border-b border-slate-100 dark:border-slate-800 transition-all duration-300 relative z-20 ${sidebarCollapsed && !isMobile ? "justify-center px-0" : "px-4"}`}
      >
        <div className="w-full" ref={orgMenuRef}>
          <button
            onClick={() =>
              (!sidebarCollapsed || isMobile) && setOrgMenuOpen(!orgMenuOpen)
            }
            className={`flex items-center w-full cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1.5 rounded-lg transition-colors group ${sidebarCollapsed && !isMobile ? "justify-center cursor-default" : "justify-between"}`}
          >
            <div className="flex items-center min-w-0">
              <div className="h-8 w-8 bg-linear-to-br from-primary-500 to-primary-600 rounded-lg shadow-sm flex items-center justify-center shrink-0 text-white">
                <span className="font-bold text-sm">
                  {currentOrganization?.name.charAt(0)}
                </span>
              </div>
              {(!sidebarCollapsed || isMobile) && (
                <div className="ml-3 text-left min-w-0">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {currentOrganization?.name || "Nubilus"}
                  </span>
                </div>
              )}
            </div>
            {(!sidebarCollapsed || isMobile) && (
              <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
            )}
          </button>

          {/* Dropdown Menu */}
          {orgMenuOpen && (!sidebarCollapsed || isMobile) && (
            <div className="absolute top-full left-2 right-2 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150 z-50">
              <div className="py-1">
                <div className="px-3 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Organizations
                </div>
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      navigate({
                        to: "/dashboard/$orgId",
                        params: { orgId: org.id },
                      });
                      setOrgMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 group cursor-pointer"
                  >
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 mr-2 group-hover:bg-white dark:group-hover:bg-slate-700">
                        {org.name.charAt(0)}
                      </div>
                      <span className="truncate">{org.name}</span>
                    </div>
                    {currentOrganization?.id === org.id && (
                      <Check className="h-3.5 w-3.5 text-primary-500" />
                    )}
                  </button>
                ))}
                <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                <button
                  onClick={() => setIsCreateOrgModalOpen(true)}
                  className="w-full text-left px-3 py-2 text-sm flex items-center text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Organization
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden pt-4 pb-4 space-y-6">
        <nav className="space-y-0.5">
          <div
            className={`px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider ${sidebarCollapsed && !isMobile ? "text-center" : ""}`}
          >
            {sidebarCollapsed && !isMobile ? "App" : "Platform"}
          </div>
          {navItems.slice(0, 4).map((item) => (
            <NavItem
              key={item.to}
              {...item}
              collapsed={sidebarCollapsed && !isMobile}
              onClick={() => isMobile && setMobileMenuOpen(false)}
            />
          ))}
        </nav>

        <nav className="space-y-0.5">
          <div
            className={`px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider ${sidebarCollapsed && !isMobile ? "text-center" : ""}`}
          >
            {sidebarCollapsed && !isMobile ? "Dev" : "Configuration"}
          </div>
          {navItems.slice(4).map((item) => (
            <NavItem
              key={item.to}
              {...item}
              collapsed={sidebarCollapsed && !isMobile}
              onClick={() => isMobile && setMobileMenuOpen(false)}
            />
          ))}
        </nav>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div
          className={`flex items-center ${sidebarCollapsed && !isMobile ? "justify-center flex-col space-y-4" : "justify-between"}`}
        >
          <div className="flex items-center space-x-3 overflow-hidden">
            <Link
              to="/profile"
              className="shrink-0"
              onClick={() => isMobile && setMobileMenuOpen(false)}
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs border border-white dark:border-slate-700 shadow-sm">
                {user?.name?.charAt(0) || "U"}
              </div>
            </Link>
            {(!sidebarCollapsed || isMobile) && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[100px]">
                  {user?.name}
                </p>
              </div>
            )}
          </div>

          <div
            className={`flex items-center ${sidebarCollapsed && !isMobile ? "flex-col space-y-2" : "space-x-1"}`}
          >
            <button
              onClick={() =>
                setUserTheme(currentTheme === "dark" ? "light" : "dark")
              }
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex transition-colors duration-200">
      {/* Mobile Menu Backdrop & Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out border-r border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent isMobile={true} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-col fixed inset-y-0 left-0 z-40 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <SidebarContent />

        {/* Collapse Toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shadow-sm hover:shadow-md transition-all z-50 hidden lg:flex"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </aside>

      {/* Main Content Wrapper */}
      <div
        className={`flex flex-col flex-1 w-full min-h-screen transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}
      >
        {/* Mobile / Tablet Header */}
        <header className="sticky top-0 z-30 flex h-16 bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md lg:hidden">
          <div className="flex-1 flex justify-between items-center px-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-linear-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white">
                  <CloudLightning className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  Nubilus
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <Search className="h-5 w-5" />
              </button>
              <Link to="/profile">
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                  {user?.name?.charAt(0)}
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Desktop Top Bar (Optional, for search/breadcrumbs if needed, mostly hidden in design for cleaner look, but good for structure) */}
        <div className="hidden lg:flex h-16 items-center justify-between px-8 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center">
            <Link to="/dashboard">
              <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors">
                Dashboard
              </span>
            </Link>
            <span className="mx-2 text-slate-300 dark:text-slate-700">/</span>
            <span className="text-slate-900 dark:text-white">
              {currentOrganization?.name}
            </span>
          </div>
        </div>

        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Create Org Modal */}
      <Modal
        isOpen={isCreateOrgModalOpen}
        onClose={() => setIsCreateOrgModalOpen(false)}
        title="Create Organization"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setIsCreateOrgModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateOrg} disabled={!newOrgName}>
              Create
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Organizations allow you to group servers, endpoints, and team members
          together.
        </p>
        <Input
          label="Organization Name"
          placeholder="Acme Inc."
          value={newOrgName}
          onChange={(e) => setNewOrgName(e.target.value)}
          autoFocus
        />
      </Modal>
    </div>
  );
};
