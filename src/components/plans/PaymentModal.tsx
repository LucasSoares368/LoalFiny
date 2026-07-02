import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  QrCode, 
  Copy, 
  CheckCircle2, 
  Loader2, 
  XCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PixData {
  qr_code: string;
  qr_code_base64: string;
  ticket_url: string;
  payment_id: string;
}

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pixData: PixData | null;
  initialStatus?: string;
  onSuccess: () => void;
  onRetry: () => void;
}

export function PaymentModal({ 
  open, 
  onOpenChange, 
  pixData, 
  initialStatus = "pending",
  onSuccess,
  onRetry
}: PaymentModalProps) {
  const [status, setStatus] = useState<string>(initialStatus);
  const [copied, setCopied] = useState(false);
  const pollingIntervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const checkStatus = async () => {
    if (!pixData?.payment_id) return;

    try {
      const { data, error } = await supabase
        .from("payments")
        .select("status")
        .eq("mercadopago_payment_id", pixData.payment_id)
        .maybeSingle();

      if (error) {
        console.error("Error checking payment status:", error);
        return;
      }

      if (data) {
        setStatus(data.status);
        if (data.status === 'completed') {
          stopPolling();
          toast.success("Pagamento aprovado!");
          setTimeout(onSuccess, 2000);
        } else if (data.status === 'failed' || data.status === 'expired') {
          stopPolling();
        }
      }
    } catch (err) {
      console.error("Polling error:", err);
    }
  };

  const startPolling = () => {
    stopPolling();
    
    // Initial check
    checkStatus();

    // Set interval for 3 seconds
    pollingIntervalRef.current = window.setInterval(checkStatus, 3000);

    // Set timeout for 15 minutes (900000ms) to prevent infinite polling
    timeoutRef.current = window.setTimeout(() => {
      stopPolling();
      if (status === 'pending' || status === 'processing') {
        setStatus('expired');
        toast.error("Tempo limite de pagamento excedido.");
      }
    }, 900000);

    // Realtime subscription as a secondary mechanism
    const channel = supabase
      .channel(`payment-modal-${pixData?.payment_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments',
          filter: `mercadopago_payment_id=eq.${pixData?.payment_id}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          setStatus(newStatus);
          if (newStatus === 'completed') {
            stopPolling();
            toast.success("Pagamento aprovado!");
            setTimeout(onSuccess, 2000);
          } else if (newStatus === 'failed' || newStatus === 'expired') {
            stopPolling();
          }
        }
      )
      .subscribe();

    return channel;
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    let channel: any;
    if (open && pixData?.payment_id && status !== 'completed') {
      channel = startPolling();
    }
    return () => {
      stopPolling();
      if (channel) supabase.removeChannel(channel);
    };
  }, [open, pixData?.payment_id]);

  // Sync status if it changes externally
  useEffect(() => {
    if (initialStatus) setStatus(initialStatus);
  }, [initialStatus]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle2 className="h-12 w-12 text-success" />,
          title: "Pagamento Concluído",
          description: "Seu plano foi atualizado com sucesso. Aproveite os novos recursos!",
          color: "bg-success",
          badge: "Aprovado"
        };
      case 'processing':
        return {
          icon: <Loader2 className="h-12 w-12 text-primary animate-spin" />,
          title: "Processando Pagamento",
          description: "Estamos verificando o seu pagamento. Isso pode levar alguns segundos.",
          color: "bg-primary",
          badge: "Processando"
        };
      case 'failed':
        return {
          icon: <XCircle className="h-12 w-12 text-destructive" />,
          title: "Pagamento Falhou",
          description: "Não foi possível processar o seu pagamento. Por favor, tente novamente ou use outro método.",
          color: "bg-destructive",
          badge: "Falhou"
        };
      case 'expired':
        return {
          icon: <Clock className="h-12 w-12 text-amber-500" />,
          title: "Pagamento Expirado",
          description: "O tempo para realizar este pagamento expirou. Por favor, gere um novo código.",
          color: "bg-amber-500",
          badge: "Expirou"
        };
      default:
        return {
          icon: <QrCode className="h-5 w-5 text-primary" />,
          title: "Pagamento via PIX",
          description: "Escaneie o QR Code ou copie o código abaixo para pagar.",
          color: "bg-secondary",
          badge: "Aguardando"
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {status === 'pending' || status === 'processing' ? <QrCode className="h-5 w-5 text-primary" /> : null}
            {config.title}
          </DialogTitle>
          <DialogDescription className="flex flex-col gap-2">
            <span>{config.description}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold uppercase">Status:</span>
              <Badge 
                variant={status === 'completed' ? 'default' : status === 'failed' ? 'destructive' : 'secondary'}
                className={`rounded-full text-[10px] ${status === 'pending' || status === 'processing' ? 'animate-pulse' : ''}`}
              >
                {config.badge}
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center space-y-6 py-6">
          {status === 'completed' ? (
            <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                {config.icon}
              </div>
              <p className="text-xs text-muted-foreground animate-pulse">Redirecionando você...</p>
            </div>
          ) : status === 'failed' || status === 'expired' ? (
            <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className={`flex h-20 w-20 items-center justify-center rounded-full ${status === 'failed' ? 'bg-destructive/10' : 'bg-amber-500/10'}`}>
                {config.icon}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="rounded-2xl" onClick={() => onOpenChange(false)}>Fechar</Button>
                <Button className="rounded-2xl" onClick={onRetry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar novamente
                </Button>
              </div>
            </div>
          ) : (
            <>
              {pixData?.qr_code_base64 && status === 'pending' && (
                <div className="animate-in fade-in zoom-in rounded-2xl border bg-white p-4 shadow-sm duration-300">
                  <img 
                    src={`data:image/png;base64,${pixData.qr_code_base64}`} 
                    alt="QR Code PIX" 
                    className="h-48 w-48"
                  />
                </div>
              )}

              {status === 'processing' && (
                <div className="flex h-48 w-48 items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              )}
              
              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Código Copia e Cola
                  </p>
                  <div className="flex items-center gap-2">
                    <Input 
                      readOnly 
                      value={pixData?.qr_code || ""} 
                      className="h-10 rounded-xl bg-muted/50 font-mono text-[10px]"
                    />
                    <Button 
                      size="icon" 
                      className="h-10 w-10 shrink-0 rounded-xl"
                      onClick={() => copyToClipboard(pixData?.qr_code || "")}
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {pixData?.ticket_url && (
                  <Button 
                    variant="link" 
                    className="h-auto w-full py-0 text-xs text-muted-foreground"
                    onClick={() => window.open(pixData.ticket_url, '_blank')}
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Abrir link do pagamento
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
