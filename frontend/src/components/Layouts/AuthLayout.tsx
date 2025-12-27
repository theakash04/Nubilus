import { useTheme } from "@/hooks/useTheme";
import { Link } from "@tanstack/react-router";
import { CloudLightning, Moon, Sun } from "lucide-react";

export const AuthLayout: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => {
  const { currentTheme, setUserTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200 relative">
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
        <button
          onClick={() =>
            setUserTheme(currentTheme === "dark" ? "light" : "dark")
          }
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
          aria-label="Toggle theme"
        >
          {currentTheme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-linear-to-br from-primary-500 to-primary-700 rounded-xl shadow-lg shadow-primary-500/30">
              <CloudLightning className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              Nubilus
            </span>
          </Link>
        </div>
        <h2 className="text-center text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-xl ring-1 ring-slate-900/5 dark:ring-slate-800 sm:rounded-xl sm:px-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary-500 via-fuchsia-500 to-primary-500"></div>
          {children}
        </div>
      </div>
    </div>
  );
};
