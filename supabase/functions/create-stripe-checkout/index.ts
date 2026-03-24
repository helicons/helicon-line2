// Edge Function: create-stripe-checkout
// Crea una sesión de Stripe Checkout vinculada a un booking_id
// Input:  { studioId, studioName, bookingId, artistName, totalPrice }
// Output: { url: string }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { studioId, studioName, bookingId, artistName, totalPrice } = await req.json();

    if (!bookingId) {
      return Response.json({ error: "bookingId es requerido" }, { status: 400, headers: CORS });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-06-20",
    });

    const origin = req.headers.get("origin") ?? "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Sesión en ${studioName}`,
              description: `Reserva para ${artistName}`,
            },
            unit_amount: Math.round(totalPrice * 100), // Stripe trabaja en céntimos
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/book-studio?success=true&booking=${bookingId}`,
      cancel_url: `${origin}/book-studio?cancelled=true&booking=${bookingId}`,
      client_reference_id: bookingId,  // Para recuperarlo en el webhook
      metadata: {
        booking_id: bookingId,
        studio_id: studioId,
        studio_name: studioName,
        artist_name: artistName,
      },
      // Sesión expira en 30 min — pg_cron cancela el booking pending tras 15 min
      expires_at: Math.floor(Date.now() / 1000) + 1800,
    });

    return Response.json({ url: session.url }, { headers: CORS });
  } catch (err) {
    console.error("create-stripe-checkout error:", err);
    return Response.json({ error: "Error al crear la sesión de pago" }, { status: 500, headers: CORS });
  }
});
