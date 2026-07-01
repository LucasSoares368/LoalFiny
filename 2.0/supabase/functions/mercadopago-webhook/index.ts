import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function mapStatus(mpStatus: string): string {
  switch (mpStatus) {
    case "approved":
      return "completed";
    case "rejected":
    case "cancelled":
      return "failed";
    case "expired":
      return "expired";
    case "in_process":
    case "in_mediation":
      return "processing";
    case "refunded":
    case "charged_back":
      return "refunded";
    default:
      return "pending";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawBody = await req.text();

    // ---- HMAC signature verification ----
    const signatureHeader = req.headers.get("x-signature") || "";
    const requestId = req.headers.get("x-request-id") || "";
    const url = new URL(req.url);
    const dataIdParam = url.searchParams.get("data.id") || url.searchParams.get("id") || "";

    const { data: mpCfgRows } = await supabase
      .from("mercado_pago_config")
      .select("webhook_secret, access_token")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1);
    const webhookSecret = mpCfgRows?.[0]?.webhook_secret?.trim();
    const accessToken = (mpCfgRows?.[0]?.access_token || Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN"))?.trim();

    if (webhookSecret) {
      const parts = Object.fromEntries(
        signatureHeader.split(",").map((p) => {
          const [k, v] = p.split("=");
          return [k?.trim(), v?.trim()];
        }),
      );
      const ts = parts["ts"];
      const v1 = parts["v1"];
      if (!ts || !v1) {
        return new Response("Invalid signature", { status: 401, headers: corsHeaders });
      }
      const manifest = `id:${dataIdParam};request-id:${requestId};ts:${ts};`;
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(webhookSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
      const expected = Array.from(new Uint8Array(sigBuf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      if (expected !== v1) {
        return new Response("Invalid signature", { status: 401, headers: corsHeaders });
      }
    } else {
      console.warn("MP webhook_secret not configured — refusing webhook in strict mode");
      return new Response("Webhook secret not configured", { status: 401, headers: corsHeaders });
    }

    const body = JSON.parse(rawBody || "{}");
    const { action, type, data } = body;
    console.log(`WEBHOOK RECEIVED: ${action} for ${type}. ID: ${data?.id}. Payload:`, JSON.stringify(body));

    if (type !== "payment") {
      return json({ success: true, ignored: true });
    }

    const paymentId = data?.id || body.resource?.split("/").pop();
    if (!paymentId) {
      console.warn("Payment ID missing in webhook payload");
      return json({ success: false, error: "Payment ID missing" });
    }

    if (!accessToken) {
      throw new Error("Mercado Pago Access Token not configured");
    }

    // ---- Re-fetch payment from MP ----
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error(`MP fetch failed: ${mpResponse.status}`, errorText);
      throw new Error(`MP API error: ${mpResponse.status}`);
    }
    const paymentData = await mpResponse.json();
    const {
      status,
      status_detail,
      transaction_amount,
      currency_id,
      external_reference,
      preference_id,
    } = paymentData;

    // ---- Locate the payment record STRICTLY (no user_id fallback) ----
    let { data: rows } = await supabase
      .from("payments")
      .select("*")
      .eq("mercadopago_payment_id", paymentId.toString())
      .limit(1);

    if ((!rows || rows.length === 0) && preference_id) {
      const r = await supabase
        .from("payments")
        .select("*")
        .eq("mercadopago_preference_id", preference_id)
        .limit(1);
      rows = r.data || [];
    }

    if (!rows || rows.length === 0) {
      console.warn(`No matching payment record for MP id=${paymentId} pref=${preference_id}`);
      return json({ success: true, message: "No matching record" });
    }

    const paymentRecord = rows[0];
    const newStatus = mapStatus(status);

    // ---- Strict validation BEFORE marking completed ----
    let validationFailed: string | null = null;

    if (status === "approved") {
      if (currency_id !== "BRL") {
        validationFailed = `currency mismatch: ${currency_id}`;
      } else if (status_detail !== "accredited") {
        validationFailed = `status_detail not accredited: ${status_detail}`;
      } else {
        // Compare paid amount (BRL) to expected amount (cents) on the record
        const paidCents = Math.round(Number(transaction_amount) * 100);
        if (paidCents !== Number(paymentRecord.amount)) {
          validationFailed = `amount mismatch: paid=${paidCents} expected=${paymentRecord.amount}`;
        }

        // Cross-check against the live plan price for the plan locked at checkout time
        if (!validationFailed && paymentRecord.plan_id && paymentRecord.billing_period) {
          const { data: plan } = await supabase
            .from("plans")
            .select("price_monthly, price_yearly")
            .eq("id", paymentRecord.plan_id)
            .single();
          const expected =
            paymentRecord.billing_period === "yearly" ? plan?.price_yearly : plan?.price_monthly;
          if (!expected || Number(expected) !== paidCents) {
            validationFailed = `plan price mismatch: paid=${paidCents} plan=${expected}`;
          }
        }

        // External reference sanity check (user_id must match)
        if (!validationFailed && external_reference) {
          const refUser = String(external_reference).split(":")[0];
          if (refUser !== paymentRecord.user_id) {
            validationFailed = `user mismatch: ref=${refUser} record=${paymentRecord.user_id}`;
          }
        }
      }
    }

    if (validationFailed) {
      console.error(`Webhook validation FAILED for payment ${paymentId}: ${validationFailed}`);
      await supabase
        .from("payments")
        .update({
          status: "failed",
          mercadopago_payment_id: paymentId.toString(),
        })
        .eq("id", paymentRecord.id);
      return json({ success: false, error: "validation_failed", reason: validationFailed });
    }

    // ---- Apply update ----
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: newStatus,
        paid_at: status === "approved" ? new Date().toISOString() : paymentRecord.paid_at,
        mercadopago_payment_id: paymentId.toString(),
      })
      .eq("id", paymentRecord.id);

    if (updateError) {
      console.error("Error updating payment:", updateError);
      throw updateError;
    }

    // ---- Subscription side-effects ----
    // ---- Activation Logic ----
    if (paymentRecord.subscription_id) {
      if (status === "approved" && status_detail === "accredited") {
        // Only activate if the payment was not already marked as completed
        // this avoids race conditions and multiple activations
        if (paymentRecord.status !== "completed") {
          console.log(`Activating subscription ${paymentRecord.subscription_id} for user ${paymentRecord.user_id}`);
          
          // Activate using the plan/billing locked on the payment, NOT current subscription state.
          const planId = paymentRecord.plan_id;
          const billingPeriod = paymentRecord.billing_period || "monthly";
          const periodEnd = new Date();
          if (billingPeriod === "yearly") {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
          }

          const update: Record<string, unknown> = {
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
            billing_period: billingPeriod,
          };
          if (planId) update.plan_id = planId;

          const { error: subErr } = await supabase
            .from("subscriptions")
            .update(update)
            .eq("id", paymentRecord.subscription_id);
          
          if (subErr) {
            console.error("Error activating subscription:", subErr);
          } else {
            console.log(`Subscription ${paymentRecord.subscription_id} successfully activated for plan ${planId}`);
          }
        } else {
          console.log(`Payment ${paymentId} was already completed. Skipping activation.`);
        }
      } else if (status === "refunded" || status === "charged_back") {
        console.log(`Cancelling subscription ${paymentRecord.subscription_id} due to status ${status}`);
        await supabase
          .from("subscriptions")
          .update({ status: "cancelled", canceled_at: new Date().toISOString() })
          .eq("id", paymentRecord.subscription_id);
      }
    }

    return json({ success: true, payment_id: paymentId, status: newStatus });
  } catch (error: any) {
    console.error("CRITICAL ERROR in MP Webhook:", error.message);
    return json({ error: error.message }, 200);
  }
});
