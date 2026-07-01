import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function getMercadoPagoErrorMessage(errorData: Record<string, unknown>, status: number) {
  if (errorData?.code === "PA_UNAUTHORIZED_RESULT_FROM_POLICIES" || status === 403) {
    return (
      "A requisição foi bloqueada pelas políticas de segurança do Mercado Pago (PolicyAgent). " +
      "Isso geralmente ocorre por: (1) conta não homologada para produção, (2) tentativa de auto-compra (mesmo email comprador e vendedor), " +
      "ou (3) campos obrigatórios incompletos. Verifique os logs detalhados."
    );
  }

  return typeof errorData?.message === "string"
    ? errorData.message
    : `Erro na API do Mercado Pago (Status ${status})`;
}

interface CreateCheckoutRequest {
  planId: string;
  billingPeriod: "monthly" | "yearly";
  paymentMethod?: "checkout" | "pix";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verify Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return jsonResponse({ success: false, error: "Invalid token" }, 401);
    }

    // 2. Get Request Body
    const { planId, billingPeriod, paymentMethod = "checkout" }: CreateCheckoutRequest = await req.json();

    // 3. Get Mercado Pago Config (latest active)
    const { data: mpRows, error: mpErr } = await supabase
      .from("mercado_pago_config")
      .select("*")
      .eq("is_active", true)
      .neq("access_token", "")
      .not("access_token", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (mpErr) console.error("mp config query error:", mpErr);
    
    const dbRow = mpRows?.[0];
    let accessToken = (dbRow?.access_token || Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN"))?.trim();
    let publicKey = (dbRow?.public_key)?.trim();

    // AUTO-SWAP LOGIC: If the access_token is shorter than the public_key, they are likely swapped.
    // In Mercado Pago, Access Token is the private/long one, Public Key is the public/short one.
    if (accessToken && publicKey && accessToken.length < publicKey.length && publicKey.length > 60) {
      console.log("DEBUG: Detected swapped credentials. Swapping Token and Key for this request.");
      const temp = accessToken;
      accessToken = publicKey;
      publicKey = temp;
    }

    if (!accessToken) {
      return jsonResponse({
        success: false,
        error: "Mercado Pago Access Token não configurado. Verifique o Painel Admin.",
      });
    }

    // 4. Get Plan Details
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return jsonResponse({ success: false, error: "Plano não encontrado" });
    }

    const price = billingPeriod === "yearly" ? plan.price_yearly : plan.price_monthly;
    const amountInBrl = Number((price / 100).toFixed(2));

    // Handle Free Plan directly
    if (amountInBrl <= 0) {
      return jsonResponse({ success: false, error: "Este plano é gratuito. Não é necessário pagamento." });
    }

    // 5. Get User Profile for Payer details
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const nameParts = (profile?.full_name || "").split(" ");
    const firstName = nameParts[0] || "Usuário";
    const lastName = nameParts.slice(1).join(" ") || "Sistema";

    // 6. Create Mercado Pago Payment (Preference or Direct PIX)
    const origin = req.headers.get("origin") || "";
    const publicOrigin = origin.includes("localhost") ? "https://mercadopago.com" : origin;
    const externalReference = `${user.id}:${planId}:${billingPeriod}:${Date.now()}`;

    if (paymentMethod === "pix") {
      const paymentData = {
        transaction_amount: amountInBrl,
        description: `Assinatura ${plan.name} (${billingPeriod === "yearly" ? "Anual" : "Mensal"})`,
        payment_method_id: "pix",
        payer: {
          email: user.email,
          first_name: firstName,
          last_name: lastName,
        },
        external_reference: externalReference,
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      };

      const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `pix-${user.id}-${Date.now()}`,
        },
        body: JSON.stringify(paymentData),
      });

      if (!mpResponse.ok) {
        const errorData = await mpResponse.json().catch(() => ({}));
        console.error("Mercado Pago PIX error:", mpResponse.status, errorData);
        return jsonResponse({
          success: false,
          error: getMercadoPagoErrorMessage(errorData, mpResponse.status),
          mp_code: errorData?.code,
          mp_status: mpResponse.status,
          mp_message: errorData?.message
        });
      }

      const payment = await mpResponse.json();
      const subscriptionId = await ensureSubscription(supabase, user.id, planId, billingPeriod);
      
      const { error: insertError } = await supabase.from("payments").insert({
        user_id: user.id,
        subscription_id: subscriptionId,
        mercadopago_payment_id: payment.id.toString(),
        amount: price,
        plan_id: planId,
        billing_period: billingPeriod,
        status: "pending", // Force pending for PIX initially
        payment_method: "pix",
        qr_code: payment.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
        payment_link: payment.point_of_interaction?.transaction_data?.ticket_url,
      });

      if (insertError) {
        console.error("Error inserting payment record:", insertError);
        throw insertError;
      }

      console.log(`Payment record created for user ${user.id}, payment ID ${payment.id}`);

      return jsonResponse({ 
        success: true, 
        pix: {
          qr_code: payment.point_of_interaction?.transaction_data?.qr_code,
          qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
          ticket_url: payment.point_of_interaction?.transaction_data?.ticket_url,
        },
        payment_id: payment.id.toString()
      });
    }

    // Default: Checkout Pro Preference
    const preferenceData: Record<string, unknown> = {
      items: [
        {
          id: planId,
          title: `Assinatura ${plan.name} (${billingPeriod === "yearly" ? "Anual" : "Mensal"})`,
          description: `Acesso ao plano ${plan.name} por período ${billingPeriod}`,
          quantity: 1,
          unit_price: amountInBrl,
          currency_id: "BRL",
          category_id: "services",
        },
      ],
      payer: {
        email: user.email,
        name: firstName,
        surname: lastName,
      },
      external_reference: externalReference,
      back_urls: {
        success: `${publicOrigin}/dashboard?payment=success`,
        failure: `${publicOrigin}/upgrade?payment=failure`,
        pending: `${publicOrigin}/dashboard?payment=pending`,
      },
      auto_return: "approved",
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      statement_descriptor: "ASSINATURA APP",
    };

    const mpResponse = await fetch("https://api.mercadopago.com/v1/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Idempotency-Key": `pref-${user.id}-${Date.now()}`,
      },
      body: JSON.stringify(preferenceData),
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.json().catch(() => ({}));
      console.error("Mercado Pago Preference error:", mpResponse.status, errorData);

      return jsonResponse({
        success: false,
        error: getMercadoPagoErrorMessage(errorData, mpResponse.status),
        mp_code: errorData?.code,
        mp_status: mpResponse.status,
      });
    }

    const preference = await mpResponse.json();
    const subscriptionId = await ensureSubscription(supabase, user.id, planId, billingPeriod);

    await supabase.from("payments").insert({
      user_id: user.id,
      subscription_id: subscriptionId,
      mercadopago_preference_id: preference.id,
      amount: price,
      plan_id: planId,
      billing_period: billingPeriod,
      status: "pending",
      payment_link: preference.init_point,
    });

    return jsonResponse({ success: true, checkoutUrl: preference.init_point });
  } catch (error: any) {
    console.error("Error creating Mercado Pago checkout:", error);
    return jsonResponse({ success: false, error: error.message || "Erro ao criar checkout" });
  }
});

async function ensureSubscription(supabase: any, userId: string, planId: string, billingPeriod: string) {
  // 1. Try to find any existing subscription record for this user.
  // In our system, users should have exactly one subscription record (usually 'active' Free).
  const { data: existingSub, error: fetchError } = await supabase
    .from("subscriptions")
    .select("id, status, plan_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    console.error("Error fetching existing subscription:", fetchError);
    throw fetchError;
  }

  if (existingSub) {
    // If they have an active subscription, just return its ID. 
    // We don't want to set it to 'pending' now because that would revoke their current features 
    // (like Free plan) while they are still in the payment process.
    // The webhook will handle the plan swap only when payment is actually 'approved'.
    if (existingSub.status === "active") {
      console.log(`User ${userId} has an active subscription ${existingSub.id}. Using it for payment link.`);
      return existingSub.id;
    }

    // If it's not active (e.g., 'pending' or 'cancelled'), we update it to the target plan/period
    // to ensure the payment is linked to the correct record.
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        plan_id: planId,
        billing_period: billingPeriod,
        status: "pending", // Reset to pending if it was cancelled
        updated_at: new Date().toISOString()
      })
      .eq("id", existingSub.id);

    if (updateError) {
      console.error("Error updating existing subscription:", updateError);
      throw updateError;
    }

    return existingSub.id;
  }

  // 2. If for some reason no subscription record exists, create one as pending.
  console.log(`No subscription found for user ${userId}. Creating new pending record.`);
  const { data: newSub, error: subError } = await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      plan_id: planId,
      billing_period: billingPeriod,
      status: "pending",
    })
    .select("id")
    .single();

  if (subError) {
    console.error("Error creating new subscription:", subError);
    throw subError;
  }

  return newSub.id;
}