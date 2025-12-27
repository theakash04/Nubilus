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
            ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
        }`}
      >
        <Icon
          className={`shrink-0 h-4 w-4 ${collapsed ? "" : "mr-3"} ${isActive ? "text-primary-600 dark:text-primary-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}
        />
        {!collapsed && <span>{label}</span>}

        {isActive && !collapsed && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500"></div>
        )}
      </Link>

      {/* Tooltip for collapsed state */}
      {collapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg border border-slate-700">
          {label}
        </div>
      )}
    </div>
  );
};

export default NavItem;
