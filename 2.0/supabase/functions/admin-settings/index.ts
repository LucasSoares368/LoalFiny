import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get current user and check admin role
    const authHeader = req.headers.get("Authorization")!;
    const {
      data: { user: currentUser },
      error: userError,
    } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));

    if (userError || !currentUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin, error: roleError } = await supabaseClient.rpc("has_role", {
      _user_id: currentUser.id,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, table, data } = body;
    console.log("admin-settings request:", JSON.stringify({ action, table, hasData: !!data }));

    if (action === "get") {
      if (table === "mercado_pago_config") {
        const { data: rows, error: configError } = await supabaseClient
          .from(table)
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(1);
        
        if (configError) throw configError;
        return new Response(JSON.stringify(rows?.[0] ?? null), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (table === "plans") {
        const { data: plans, error: plansError } = await supabaseClient
          .from("plans")
          .select("*")
          .order("price_monthly", { ascending: true });
        
        if (plansError) throw plansError;
        return new Response(JSON.stringify(plans), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (table === "payments") {
        const page = parseInt(data?.page || "1");
        const pageSize = parseInt(data?.pageSize || "10");
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data: payments, error: paymentsError, count } = await supabaseClient
          .from("payments")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(from, to);
        
        if (paymentsError) throw paymentsError;

        const userIds = [...new Set((payments || []).map((p: any) => p.user_id))];
        const { data: profiles } = await supabaseClient
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        const enriched = (payments || []).map((p: any) => ({
          ...p,
          profiles: profileMap.get(p.user_id) || null,
        }));

        return new Response(JSON.stringify({ 
          data: enriched, 
          count: count || 0,
          page,
          pageSize
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "update") {
      if (table === "mercado_pago_config") {
        const { error: updateError } = await supabaseClient
          .from(table)
          .upsert({
            ...data,
            updated_at: new Date().toISOString(),
          });
        
        if (updateError) throw updateError;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (table === "plans") {
        const { error: updateError } = await supabaseClient
          .from("plans")
          .update(data)
          .eq("id", data.id);
        
        if (updateError) throw updateError;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (table === "subscriptions") {
        const { user_id, plan_id, status, billing_period, current_period_start, current_period_end } = data;
        
        const { data: existing } = await supabaseClient
          .from("subscriptions")
          .select("id")
          .eq("user_id", user_id)
          .maybeSingle();

        let result;
        if (existing) {
          result = await supabaseClient
            .from("subscriptions")
            .update({
              plan_id,
              status,
              billing_period,
              current_period_start,
              current_period_end,
              updated_at: new Date().toISOString()
            })
            .eq("user_id", user_id);
        } else {
          result = await supabaseClient
            .from("subscriptions")
            .insert({
              user_id,
              plan_id,
              status,
              billing_period,
              current_period_start,
              current_period_end,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }

        if (result.error) throw result.error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (table === "profiles") {
        const { id, ...updateData } = data;
        const { error: updateError } = await supabaseClient
          .from("profiles")
          .update({
            ...updateData,
            updated_at: new Date().toISOString()
          })
          .eq("id", id);
        
        if (updateError) throw updateError;
        
        // If blocking/unblocking, we might want to sign out the user session if possible
        // but Supabase Admin API is better for that
        if (updateData.is_blocked !== undefined) {
           // We can also update auth metadata to be extra safe
           await supabaseClient.auth.admin.updateUserById(id, {
             user_metadata: { is_blocked: updateData.is_blocked }
           });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (table === "payments") {
        const { id, status } = data;
        
        // Update payment status
        const { data: updatedPayments, error: updateError } = await supabaseClient
          .from("payments")
          .update({
            status,
            updated_at: new Date().toISOString()
          })
          .eq("id", id)
          .select();
        
        if (updateError) throw updateError;

        // If status is completed, activate subscription
        if (status === "completed" && updatedPayments && updatedPayments.length > 0) {
          const payment = updatedPayments[0];
          if (payment.user_id && payment.subscription_id) {
            const { data: subscription } = await supabaseClient
              .from("subscriptions")
              .select("billing_period")
              .eq("id", payment.subscription_id)
              .single();

            const periodEnd = new Date();
            if (subscription?.billing_period === "yearly") {
              periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            } else {
              periodEnd.setMonth(periodEnd.getMonth() + 1);
            }

            await supabaseClient
              .from("subscriptions")
              .update({
                status: "active",
                current_period_start: new Date().toISOString(),
                current_period_end: periodEnd.toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq("id", payment.subscription_id);
          }
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "clear_all") {
      if (table === "payments") {
        // Explicit bulk-clear of payments history (admin-only, distinct from per-row delete)
        const { error: deleteError } = await supabaseClient
          .from("payments")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");

        if (deleteError) throw deleteError;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "delete") {
      if (table === "payments") {
        const paymentId = data?.id;
        if (!paymentId || typeof paymentId !== "string") {
          return new Response(JSON.stringify({ error: "ID do pagamento é obrigatório" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { error: deleteError } = await supabaseClient
          .from("payments")
          .delete()
          .eq("id", paymentId);

        if (deleteError) throw deleteError;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (table === "subscriptions") {
        const { user_id } = data || {};
        if (!user_id || typeof user_id !== "string") {
          return new Response(JSON.stringify({ error: "user_id é obrigatório" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { error: deleteError } = await supabaseClient
          .from("subscriptions")
          .delete()
          .eq("user_id", user_id);

        if (deleteError) throw deleteError;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (table === "users") {
        const { id } = data || {};
        if (!id || typeof id !== "string") {
          return new Response(JSON.stringify({ error: "id é obrigatório" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (id === currentUser.id) {
          return new Response(JSON.stringify({ error: "Não é possível excluir a própria conta de admin" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(id);

        if (deleteError) throw deleteError;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.error("admin-settings: no handler matched", { action, table });
    return new Response(JSON.stringify({ error: `Invalid action or table (action=${action}, table=${table})` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("admin-settings error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});