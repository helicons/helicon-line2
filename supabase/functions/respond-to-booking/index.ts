// Edge Function: respond-to-booking
// POST { booking_id, action: 'accept'|'reject', origin }
// Authorization: Bearer <producer session token>

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe@17";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const stripeKey   = Deno.env.get("STRIPE_SECRET_KEY")!;

  const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authErr } = await authClient.auth.getUser();
  if (authErr || !user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS });

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { booking_id, action, origin } = await req.json();
    if (!booking_id || !["accept", "reject"].includes(action)) {
      return Response.json({ error: "Invalid params" }, { status: 400, headers: CORS });
    }

    const { data: booking, error: bErr } = await supabase
      .from("bookings")
      .select(`
        id, status, payment_method, client_name, client_email, amount_paid,
        start_datetime, end_datetime,
        spaces ( id, name, price_per_hour,
          studios ( id, name,
            producers ( user_id, email, name )
          )
        )
      `)
      .eq("id", booking_id)
      .single();

    if (bErr || !booking) {
      return Response.json({ error: "Booking not found" }, { status: 404, headers: CORS });
    }

    const space    = (booking as any).spaces;
    const studio   = space?.studios;
    const producer = studio?.producers;

    if (producer?.user_id !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403, headers: CORS });
    }

    if ((booking as any).status !== "pending_review") {
      return Response.json({
        error: "Booking is not pending review",
        current_status: (booking as any).status,
      }, { status: 409, headers: CORS });
    }

    if (action === "reject") {
      await supabase.from("bookings").update({ status: "rejected" }).eq("id", booking_id);
      await supabase.functions.invoke("send-booking-emails", {
        body: { type: "booking_rejected", booking_id },
      });
      return Response.json({ ok: true, status: "rejected" }, { headers: CORS });
    }

    // accept
    const paymentMethod = (booking as any).payment_method ?? "card";

    if (paymentMethod === "cash") {
      await supabase.from("bookings").update({ status: "confirmed" }).eq("id", booking_id);
      await supabase.functions.invoke("send-booking-emails", {
        body: { type: "booking_confirmed_cash", booking_id },
      });
      return Response.json({ ok: true, status: "confirmed" }, { headers: CORS });
    }

    // card: create Stripe Checkout session (24h)
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const startDate  = new Date((booking as any).start_datetime);
    const endDate    = new Date((booking as any).end_datetime);
    const hours      = Math.round((endDate.getTime() - startDate.getTime()) / 3600000);
    const pricePerHour = Number(space?.price_per_hour ?? 0);
    const unitAmount   = Math.round(pricePerHour * hours * 100);

    if (!unitAmount || unitAmount < 100) {
      return Response.json({ error: "Cannot determine booking price" }, { status: 500, headers: CORS });
    }

    const appOrigin = (origin ?? "https://heliconradar.com").replace(/\/$/, "");

    // Destination charge: 90% al productor si tiene Stripe activo
    const { data: producerStripe } = await supabase
      .from("producers")
      .select("stripe_account_id, stripe_connect_status")
      .eq("user_id", user.id)
      .single();

    const sessionConfig: any = {
      payment_method_types: ["card"],
      mode: "payment",
      expires_at: Math.floor(Date.now() / 1000) + 86400,
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: `Sesión en ${studio?.name ?? "estudio"}`,
            description: `${space?.name ?? ""} · ${startDate.toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })}`,
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      }],
      customer_email: (booking as any).client_email,
      success_url: `${appOrigin}/booking/${booking_id}?paid=true`,
      cancel_url:  `${appOrigin}/booking/${booking_id}?cancelled=true`,
      metadata: { type: "studio", booking_id },
    };

    if (producerStripe?.stripe_connect_status === "active" && producerStripe?.stripe_account_id) {
      const producerAmount = Math.round(unitAmount * 0.90);
      sessionConfig.payment_intent_data = {
        transfer_data: {
          destination: producerStripe.stripe_account_id,
          amount: producerAmount,
        },
      };
      sessionConfig.metadata.destination_charge = "true";
      console.log(`Destination charge: ${producerAmount} cents → ${producerStripe.stripe_account_id}`);
    } else {
      console.log(`Producer sin Stripe activo para booking ${booking_id} — pago queda en plataforma`);
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    await supabase.from("bookings").update({
      status: "pending",
      stripe_session_id: session.id,
    }).eq("id", booking_id);

    await supabase.functions.invoke("send-booking-emails", {
      body: {
        type: "booking_accepted_card",
        booking_id,
        checkout_url: `${appOrigin}/booking/${booking_id}`,
      },
    });

    return Response.json({ ok: true, status: "pending", checkout_url: session.url }, { headers: CORS });

  } catch (err) {
    console.error("respond-to-booking error:", err);
    return Response.json({ error: err.message }, { status: 500, headers: CORS });
  }
});
