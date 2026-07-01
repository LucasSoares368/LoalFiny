import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidityChange?: (isValid: boolean) => void;
  id?: string;
  label?: string;
  showRequirements?: boolean;
}

const PasswordInput = ({ 
  value, 
  onChange, 
  onValidityChange, 
  id = "password", 
  label = "Senha",
  showRequirements = true
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const requirements = useMemo(() => [
    { label: "Mínimo de 8 caracteres", test: (val: string) => val.length >= 8 },
    { label: "Pelo menos 1 letra maiúscula", test: (val: string) => /[A-Z]/.test(val) },
    { label: "Pelo menos 1 letra minúscula", test: (val: string) => /[a-z]/.test(val) },
    { label: "Pelo menos 1 número", test: (val: string) => /[0-9]/.test(val) },
    { label: "Pelo menos 1 caractere especial", test: (val: string) => /[!@#$%^&*(),.?":{}|<>]/.test(val) },
  ], []);

  const strength = useMemo(() => {
    if (!value) return 0;
    const passed = requirements.filter(req => req.test(value)).length;
    return (passed / requirements.length) * 100;
  }, [value, requirements]);

  const isValid = strength === 100;

  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  const getStrengthColor = (val: number) => {
    if (val <= 20) return "bg-red-500";
    if (val <= 40) return "bg-orange-500";
    if (val <= 60) return "bg-yellow-500";
    if (val <= 80) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthLabel = (val: number) => {
    if (val === 0) return "";
    if (val <= 40) return "Fraca";
    if (val <= 80) return "Média";
    return "Forte";
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="relative">
          <Input
            id={id}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {value && showRequirements && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Força da senha: {getStrengthLabel(strength)}</span>
            <span className={cn(
              "font-medium",
              strength <= 40 ? "text-red-500" : strength <= 80 ? "text-yellow-600" : "text-green-600"
            )}>
              {Math.round(strength)}%
            </span>
          </div>
          <Progress 
            value={strength} 
            className="h-1" 
            indicatorClassName={getStrengthColor(strength)}
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {requirements.map((req, idx) => {
              const isMet = req.test(value);
              return (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  {isMet ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <X className="h-3 w-3 text-muted-foreground/50" />
                  )}
                  <span className={cn(
                    isMet ? "text-green-600 font-medium" : "text-muted-foreground"
                  )}>
                    {req.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordInput;