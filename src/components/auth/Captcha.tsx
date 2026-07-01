import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
}

const Captcha = ({ onVerify }: CaptchaProps) => {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified'>('idle');

  const handleVerify = () => {
    if (status !== 'idle') return;
    
    setStatus('verifying');
    
    // Simular o comportamento do reCAPTCHA
    setTimeout(() => {
      setStatus('verified');
      onVerify(true);
    }, 1200);
  };

  return (
    <div className="w-full bg-[#f9f9f9] dark:bg-muted/10 border border-[#d3d3d3] dark:border-border rounded-sm p-[10px] flex items-center justify-between shadow-sm min-h-[78px] select-none">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleVerify}
          disabled={status !== 'idle'}
          className={cn(
            "w-[28px] h-[28px] border-2 rounded-[2px] flex items-center justify-center transition-all bg-white relative shrink-0",
            status === 'idle' ? "border-[#c1c1c1] hover:border-[#b2b2b2] shadow-inner" : "border-transparent bg-transparent"
          )}
        >
          {status === 'verifying' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#4A90E2] stroke-[3px]" />
            </div>
          )}
          {status === 'verified' && (
            <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in-50 duration-300">
              <Check className="w-8 h-8 text-[#009E5E] stroke-[4px]" />
            </div>
          )}
        </button>
        <span className="text-sm font-normal text-[#555] dark:text-foreground">
          Não sou um robô
        </span>
      </div>
      
      <div className="flex flex-col items-center justify-center gap-0 shrink-0">
        <img 
          src="https://www.gstatic.com/recaptcha/api2/logo_48.png" 
          alt="reCAPTCHA" 
          className="w-8 h-8 grayscale opacity-70"
        />
        <span className="text-[10px] text-[#777] font-semibold uppercase tracking-tighter mt-[-2px]">reCAPTCHA</span>
        <div className="flex gap-1 text-[8px] text-[#999] mt-[-2px]">
          <button type="button" className="hover:underline">Privacidade</button>
          <span>-</span>
          <button type="button" className="hover:underline">Termos</button>
        </div>
      </div>
    </div>
  );
};

export default Captcha;