import { Mail, Instagram, Linkedin, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
// Logo import removed as we now use text branding

const Footer = () => {
  const navigate = useNavigate();
  const { setShowBanner } = useCookieConsent();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    produto: [
      { label: "Funcionalidades", href: "#features" },
      { label: "Planos de Acesso", href: "#pricing" },
      { label: "Metodologia", href: "#how-it-works" },
    ],

    legal: [
      { label: "Termos de Uso", href: "/terms" },
      { label: "Política de Privacidade", href: "/privacy" },
      { label: "Política de Cookies", href: "/privacy" },
    ],
  };

  const scrollToSection = (href: string) => {
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Financeiro Pro
              </span>
            </div>
            <p className="text-muted-foreground max-w-xs">
              Sua central inteligente para domínio financeiro. 
              Organize sua vida e acelere rumo à independência.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Produto</h4>
            <ul className="space-y-2">
              {footerLinks.produto.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>



          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  onClick={() => setShowBanner(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  Configurar Cookies
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Financeiro Pro. Todos os direitos reservados.
          </p>
          <p className="text-sm text-muted-foreground">
            Desenvolvido com 💙 para facilitar sua vida financeira
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
