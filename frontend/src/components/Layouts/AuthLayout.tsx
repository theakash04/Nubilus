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
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200 relative">
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
        <button
          onClick={() =>
            setUserTheme(currentTheme === "dark" ? "light" : "dark")
          }
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
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
            <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/30">
              <CloudLightning className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">Nubilus</span>
          </Link>
        </div>
        <h2 className="text-center text-3xl font-bold text-foreground tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-xl ring-1 ring-border sm:rounded-xl sm:px-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary via-purple-500 to-primary"></div>
          {children}
        </div>
      </div>
    </div>
  );
};
