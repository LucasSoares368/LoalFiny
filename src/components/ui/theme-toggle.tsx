import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center p-1 bg-muted/30 rounded-full border border-border/40 w-fit">
        <div className="h-7 w-7 rounded-full bg-muted/50 animate-pulse" />
        <div className="h-7 w-7 rounded-full bg-muted/50 animate-pulse ml-1" />
        <div className="h-7 w-7 rounded-full bg-muted/50 animate-pulse ml-1" />
      </div>
    );
  }

  return (
    <div className="flex items-center p-1 bg-muted/50 rounded-full border border-border/40 w-fit backdrop-blur-sm shadow-inner">
      <button
        onClick={() => setTheme("light")}
        title="Modo Claro"
        className={cn(
          "flex items-center justify-center h-8 w-8 rounded-full transition-all duration-300 relative",
          theme === "light" 
            ? "bg-background text-primary shadow-sm ring-1 ring-border/20 scale-105" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
        )}
      >
        <Sun className={cn("h-4 w-4 transition-all", theme === "light" ? "opacity-100 rotate-0" : "opacity-70 -rotate-12")} />
      </button>
      <button
        onClick={() => setTheme("system")}
        title="Sistema"
        className={cn(
          "flex items-center justify-center h-8 w-8 rounded-full transition-all duration-300 ml-1 relative",
          theme === "system" 
            ? "bg-background text-primary shadow-sm ring-1 ring-border/20 scale-105" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
        )}
      >
        <Monitor className={cn("h-4 w-4 transition-all", theme === "system" ? "opacity-100" : "opacity-70")} />
      </button>
      <button
        onClick={() => setTheme("dark")}
        title="Modo Escuro"
        className={cn(
          "flex items-center justify-center h-8 w-8 rounded-full transition-all duration-300 ml-1 relative",
          theme === "dark" 
            ? "bg-background text-primary shadow-sm ring-1 ring-border/20 scale-105" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
        )}
      >
        <Moon className={cn("h-4 w-4 transition-all", theme === "dark" ? "opacity-100 rotate-0" : "opacity-70 rotate-12")} />
      </button>
    </div>
  );
}
