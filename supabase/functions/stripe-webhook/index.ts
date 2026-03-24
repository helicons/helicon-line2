// Edge Function: stripe-webhook
// Escucha eventos de Stripe y confirma/cancela reservas
// Registrar en Stripe Dashboard > Developers > Webhooks:
//   URL: https://<proyecto>.supabase.co/functions/v1/stripe-webhook
//   Eventos: checkout.session.completed, checkout.session.expired

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await req.text();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2024-06-20",
  });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature error:", err);
    return new Response(`Webhook signature error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;

    if (!bookingId) {
      console.error("checkout.session.completed: no booking_id en metadata");
      return Response.json({ received: true });
    }

    const { error } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        stripe_session_id: session.id,
        amount_paid: (session.amount_total ?? 0) / 100,
      })
      .eq("id", bookingId)
      .eq("status", "pending"); // Solo confirmar si sigue pending (idempotente)

    if (error) {
      console.error("Error confirmando booking:", error);
      return new Response("Error updating booking", { status: 500 });
    }

    // Disparar emails de confirmación
    const { error: emailError } = await supabase.functions.invoke("send-booking-emails", {
      body: { booking_id: bookingId },
    });

    if (emailError) {
      // No fallamos el webhook por un error de email — el pago ya fue procesado
      console.error("Error enviando emails:", emailError);
    }

    console.log(`Booking ${bookingId} confirmado correctamente`);
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;

    if (!bookingId) {
      console.error("checkout.session.expired: no booking_id en metadata");
      return Response.json({ received: true });
    }

    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId)
      .eq("status", "pending"); // Solo cancelar si sigue pending

    if (error) {
      console.error("Error cancelando booking expirado:", error);
    } else {
      console.log(`Booking ${bookingId} cancelado por expiración de sesión Stripe`);
    }
  }

  return Response.json({ received: true });
});
