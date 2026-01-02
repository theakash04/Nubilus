import {
  Cog,
  Database,
  Globe,
  Key,
  LayoutDashboard,
  Server,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

// Navigation items for the sidebar - paths are relative to /dashboard/{orgId}
export const navItems: NavItem[] = [
  { path: "", label: "Dashboard", icon: LayoutDashboard },
  { path: "/servers", label: "Servers", icon: Server },
  { path: "/endpoints", label: "Endpoints", icon: Globe },
  { path: "/databases", label: "Databases", icon: Database },
  { path: "/keys", label: "API Keys", icon: Key },
  { path: "/users", label: "Members", icon: Users },
  { path: "/settings", label: "Settings", icon: Cog },
];

// Map route segments to readable labels for breadcrumbs
export const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  servers: "Servers",
  server: "Server",
  endpoints: "Endpoints",
  databases: "Databases",
  keys: "API Keys",
  users: "Members",
  profile: "Profile",
  settings: "Settings",
};

// Helper to get full nav item paths for a specific org
export function getNavItemsForOrg(orgId: string) {
  return navItems.map((item) => ({
    ...item,
    to: `/dashboard/${orgId}${item.path}`,
  }));
}
