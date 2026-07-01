import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <Button
      variant="default"
      size="icon"
      className={cn(
        "fixed bottom-8 right-8 z-50 h-12 w-12 rounded-2xl bg-primary text-white shadow-2xl shadow-primary/40 transition-all duration-500 hover:scale-110 active:scale-90 border-2 border-white/20 backdrop-blur-xl",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20 pointer-events-none"
      )}
      onClick={scrollToTop}
      aria-label="Voltar ao topo"
    >
      <ArrowUp className="h-6 w-6 stroke-[3]" />
    </Button>
  );
};

export default BackToTop;
