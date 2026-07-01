import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, fullName, captchaVerified } = await req.json();

    // 0. Check if registration is globally enabled
    try {
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { data: settings } = await adminClient
        .from("app_settings")
        .select("allow_registration")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (settings && settings.allow_registration === false) {
        return new Response(
          JSON.stringify({ error: "O cadastro de novos usuários está temporariamente desabilitado. Tente novamente mais tarde." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (e) {
      console.error("Error checking app_settings:", e);
    }

    // 1. Basic validation
    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: "Todos os campos são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Email inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Password Strength Validation (Server reinforcement)
    const requirements = [
      { test: (val: string) => val.length >= 8, label: "mínimo de 8 caracteres" },
      { test: (val: string) => /[A-Z]/.test(val), label: "pelo menos 1 letra maiúscula" },
      { test: (val: string) => /[a-z]/.test(val), label: "pelo menos 1 letra minúscula" },
      { test: (val: string) => /[0-9]/.test(val), label: "pelo menos 1 número" },
      { test: (val: string) => /[!@#$%^&*(),.?":{}|<>]/.test(val), label: "pelo menos 1 caractere especial" },
    ];

    const failed = requirements.filter(req => !req.test(password));
    if (failed.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: "A senha não atende aos requisitos de segurança.",
          details: failed.map(f => f.label)
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Captcha validation
    if (!captchaVerified) {
      return new Response(
        JSON.stringify({ error: "Por favor, complete a verificação anti-spam." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If everything is fine
    return new Response(
      JSON.stringify({ success: true, message: "Validação concluída com sucesso." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});