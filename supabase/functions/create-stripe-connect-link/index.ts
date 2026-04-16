// Edge Function: create-stripe-connect-link
// Genera un enlace de onboarding de Stripe Connect Express para el productor.
// Si ya tiene cuenta → regenera el enlace (para continuar verificación o abrir dashboard).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe?target=deno&no-check";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const stripeKey   = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!stripeKey) {
      return Response.json({ error: "STRIPE_SECRET_KEY not configured" }, { status: 500, headers: CORS });
    }

    // Verificar sesión — usar serviceKey + auth.getUser(token) para soportar ES256
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS });

    const supabase = createClient(supabaseUrl, serviceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS });

    const { producer_id, action } = await req.json();
    if (!producer_id) return Response.json({ error: "producer_id required" }, { status: 400, headers: CORS });

    // Verificar que el productor pertenece al usuario autenticado
    const { data: producer, error: prodError } = await supabase
      .from("producers")
      .select("id, stripe_account_id, stripe_connect_status")
      .eq("id", producer_id)
      .eq("user_id", user.id)
      .single();

    if (prodError || !producer) {
      return Response.json({ error: "Producer not found" }, { status: 404, headers: CORS });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // ── Acción: solo verificar estado (llamada al volver de Stripe) ──
    if (action === "check_status" && producer.stripe_account_id) {
      const account = await stripe.accounts.retrieve(producer.stripe_account_id);
      const isActive = account.charges_enabled && account.payouts_enabled;
      if (isActive && producer.stripe_connect_status !== "active") {
        await supabase
          .from("producers")
          .update({ stripe_connect_status: "active" })
          .eq("id", producer_id);
      }
      return Response.json({ status: isActive ? "active" : "pending" }, { headers: CORS });
    }

    const origin = req.headers.get("origin") ?? "http://localhost:5173";
    let accountId = producer.stripe_account_id;

    // Si ya está activo, generar login link al dashboard de Stripe Express
    if (producer.stripe_connect_status === "active" && accountId) {
      const loginLink = await stripe.accounts.createLoginLink(accountId);
      return Response.json({ url: loginLink.url }, { headers: CORS });
    }

    // Si no tiene cuenta aún, crear una nueva Express
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "ES",
        capabilities: { transfers: { requested: true } },
      });
      accountId = account.id;

      await supabase
        .from("producers")
        .update({ stripe_account_id: accountId, stripe_connect_status: "pending" })
        .eq("id", producer_id);
    }

    // Generar enlace de onboarding (funciona para cuentas nuevas y pendientes)
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/producer/dashboard?connect=refresh`,
      return_url:  `${origin}/producer/dashboard?connect=success`,
      type: "account_onboarding",
    });

    return Response.json({ url: link.url }, { headers: CORS });

  } catch (err) {
    console.error("Error create-stripe-connect-link:", err);
    return Response.json({ error: err.message }, { status: 500, headers: CORS });
  }
});
