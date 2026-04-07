// Edge Function: stripe-webhook
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe?target=deno&no-check";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const body = await req.text();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

  if (!stripeKey || !webhookSecret) {
    return new Response("Missing env", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2024-06-20",
    httpClient: Stripe.createFetchHttpClient(),
  });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    return new Response(`Webhook signature error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const type = session.metadata?.type || 'studio';

    if (type === 'beat') {
      const { beat_id, license_type, beat_title } = session.metadata;
      const buyer_email = session.customer_details?.email;

      await supabase.from("sales").insert({
        beat_id,
        buyer_email,
        license_type,
        amount_paid: (session.amount_total ?? 0) / 100,
        stripe_session_id: session.id,
      });

      await supabase.functions.invoke("send-booking-emails", {
        body: { type: 'beat_delivery', beat_id, buyer_email, license_type, beat_title },
      });
    } else {
      const bookingId = session.metadata?.booking_id;
      if (bookingId) {
        await supabase.from("bookings").update({
          status: "confirmed",
          stripe_session_id: session.id,
          amount_paid: (session.amount_total ?? 0) / 100,
        }).eq("id", bookingId);
        await supabase.functions.invoke("send-booking-emails", { body: { booking_id: bookingId } });
      }
    }
  }

  return Response.json({ received: true });
});
