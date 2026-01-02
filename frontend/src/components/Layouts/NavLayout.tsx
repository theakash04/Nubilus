import { Link, useLocation } from "@tanstack/react-router";

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  collapsed?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  to,
  icon: Icon,
  label,
  collapsed,
  onClick,
}) => {
  const location = useLocation();

  const isDashboardIndex = /^\/dashboard\/[^/]+$/.test(to);

  const isActive = isDashboardIndex
    ? location.pathname === to || location.pathname === `${to}/`
    : location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <div className="relative group px-2">
      <Link
        to={to}
        onClick={onClick}
        className={`flex items-center ${collapsed ? "justify-center" : ""} px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 group-hover:translate-x-1 ${
          isActive
            ? "bg-accent text-accent-foreground shadow-sm"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        }`}
      >
        <Icon
          className={`shrink-0 h-4 w-4 ${collapsed ? "" : "mr-3"} ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
        />
        {!collapsed && <span>{label}</span>}

        {isActive && !collapsed && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"></div>
        )}
      </Link>

      {/* Tooltip for collapsed state */}
      {collapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg border border-border">
          {label}
        </div>
      )}
    </div>
  );
};

export default NavItem;
