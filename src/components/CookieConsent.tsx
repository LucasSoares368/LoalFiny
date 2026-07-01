import { useState, useEffect } from 'react';
import { useCookieConsent, CookiePreferences } from '@/contexts/CookieConsentContext';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Info, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const CookieConsent = () => {
  const { showBanner, savePreferences, preferences, isLoading } = useCookieConsent();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempPrefs, setTempPrefs] = useState<CookiePreferences>({
    essential: true,
    analytical: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    if (preferences) {
      setTempPrefs(preferences);
    }
  }, [preferences]);

  if (isLoading || !showBanner) return null;

  const handleAcceptAll = () => {
    savePreferences({
      essential: true,
      analytical: true,
      marketing: true,
      functional: true,
    });
  };

  const handleRejectAll = () => {
    savePreferences({
      essential: true,
      analytical: false,
      marketing: false,
      functional: false,
    });
  };

  const handleSaveSettings = () => {
    savePreferences(tempPrefs);
    setIsSettingsOpen(false);
  };

  return (
    <>
      {/* Banner */}
      {!isSettingsOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in fade-in slide-in-from-bottom-10 duration-500">
        <div className="container max-w-7xl mx-auto">
          <div className="bg-background/95 backdrop-blur-md border border-border shadow-2xl rounded-xl p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="bg-primary/10 p-2.5 rounded-full shrink-0">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-base">Valorizamos sua privacidade</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                  Utilizamos cookies para melhorar sua experiência, analisar o tráfego e personalizar anúncios. 
                  Respeitamos sua privacidade de acordo com a LGPD. 
                  Você pode aceitar todos ou configurar suas preferências. 
                  Conheça nossa <Link to="/privacy" className="text-primary hover:underline font-medium">Política de Privacidade</Link>.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center md:justify-end shrink-0">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsSettingsOpen(true)}
                className="text-xs font-medium"
              >
                Configurar preferências
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRejectAll}
                className="text-xs font-medium"
              >
                Recusar não essenciais
              </Button>
              <Button 
                size="sm" 
                onClick={handleAcceptAll}
                className="text-xs font-medium bg-primary hover:bg-primary/90"
              >
                Aceitar todos
              </Button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Preferências de Cookies
            </DialogTitle>
            <DialogDescription>
              Configure como utilizamos os cookies em seu navegador.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Essential */}
            <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold">Essenciais</Label>
                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase">Sempre Ativo</span>
                </div>
                <p className="text-xs text-muted-foreground leading-snug">
                  Necessários para o funcionamento básico do sistema, como segurança, autenticação e gerenciamento de rede.
                </p>
              </div>
              <Switch checked disabled />
            </div>

            {/* Functional */}
            <div className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="space-y-1">
                <Label className="text-sm font-semibold">Funcionais</Label>
                <p className="text-xs text-muted-foreground leading-snug">
                  Permitem que o site forneça funcionalidades avançadas e personalização, como lembrar suas preferências de tema.
                </p>
              </div>
              <Switch 
                checked={tempPrefs.functional} 
                onCheckedChange={(checked) => setTempPrefs(p => ({ ...p, functional: checked }))} 
              />
            </div>

            {/* Analytical */}
            <div className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="space-y-1">
                <Label className="text-sm font-semibold">Analíticos</Label>
                <p className="text-xs text-muted-foreground leading-snug">
                  Nos ajudam a entender como os visitantes interagem com o site, coletando informações anônimas para melhorias.
                </p>
              </div>
              <Switch 
                checked={tempPrefs.analytical} 
                onCheckedChange={(checked) => setTempPrefs(p => ({ ...p, analytical: checked }))} 
              />
            </div>

            {/* Marketing */}
            <div className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="space-y-1">
                <Label className="text-sm font-semibold">Marketing</Label>
                <p className="text-xs text-muted-foreground leading-snug">
                  Utilizados para rastrear visitantes em sites. A intenção é exibir anúncios relevantes para o usuário individual.
                </p>
              </div>
              <Switch 
                checked={tempPrefs.marketing} 
                onCheckedChange={(checked) => setTempPrefs(p => ({ ...p, marketing: checked }))} 
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="ghost" onClick={() => setIsSettingsOpen(false)} className="sm:flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSaveSettings} className="sm:flex-1">
              Salvar Preferências
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsent;
