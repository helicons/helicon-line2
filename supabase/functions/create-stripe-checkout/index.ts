// Edge Function: create-stripe-checkout
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe?target=deno&no-check";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const body = await req.json();
    const { type = 'studio' } = body;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeKey) {
      return Response.json({ error: "STRIPE_SECRET_KEY no configurada" }, { status: 500, headers: CORS });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const origin = req.headers.get("origin") ?? "http://localhost:5173";

    let sessionConfig: any = {
      payment_method_types: ["card"],
      mode: "payment",
      expires_at: Math.floor(Date.now() / 1000) + 1800,
      metadata: { type },
      customer_email: body.customerEmail || null, // Pre-rellenar email si viene del frontend
    };

    if (type === 'beat') {
      const { beatId, beatTitle, licenseType, price, producerName } = body;

      sessionConfig = {
        ...sessionConfig,
        line_items: [{
          price_data: {
            currency: "eur",
            product_data: {
              name: `Beat: ${beatTitle || 'Sin título'}`,
              description: `Licencia ${licenseType} - Prod. by ${producerName || 'Producer'}`,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        }],
        success_url: `${origin}/beats?success=true&beat=${beatId}`,
        cancel_url: `${origin}/beats?cancelled=true`,
        metadata: { ...sessionConfig.metadata, beat_id: beatId, license_type: licenseType, beat_title: beatTitle },
      };
    } else {
      const { studioName, bookingId, totalPrice } = body;
      sessionConfig = {
        ...sessionConfig,
        line_items: [{
          price_data: {
            currency: "eur",
            product_data: { name: `Sesión en ${studioName}`, description: `Booking ID: ${bookingId}` },
            unit_amount: Math.round(totalPrice * 100),
          },
          quantity: 1,
        }],
        success_url: `${origin}/book-studio?success=true&booking=${bookingId}`,
        cancel_url: `${origin}/book-studio?cancelled=true&booking=${bookingId}`,
        metadata: { ...sessionConfig.metadata, booking_id: bookingId },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return Response.json({ url: session.url }, { headers: CORS });

  } catch (err) {
    console.error("Error create-stripe:", err);
    return Response.json({ error: err.message }, { status: 500, headers: CORS });
  }
});
