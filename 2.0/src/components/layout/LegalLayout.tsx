import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
// Logo import removed as we now use text branding

interface LegalLayoutProps {
  children: ReactNode;
  title: string;
}

const LegalLayout = ({ children, title }: LegalLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span 
              className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent hidden sm:block cursor-pointer"
              onClick={() => navigate("/")}
            >
              Financeiro Pro
            </span>
          </div>
          <div className="flex flex-1 items-center justify-center sm:justify-start">
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
        </div>
      </header>
      
      <main className="container max-w-4xl py-12 px-4 md:px-6">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {children}
        </div>
      </main>

      <footer className="border-t py-6 mt-12">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row md:py-0">
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} Financeiro Pro. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LegalLayout;