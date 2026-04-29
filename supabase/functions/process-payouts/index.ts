// Edge Function: process-payouts
// Transfiere a cada productor su parte de ventas de beats y reservas de estudio finalizadas.
// Diseñado para ejecutarse vía cron cada hora.
// También actualiza stripe_connect_status si la cuenta ha completado la verificación.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe@17";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PRODUCER_SHARE = 0.90; // 90% sobre precio base (sin tarifa de servicio)
const SERVICE_FEE_FACTOR = 1.05; // El amount_paid de beats incluye un 5% de tarifa de servicio
const STRIPE_MIN_CENTS = 50; // Mínimo de Stripe: 0.50€

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const stripeKey   = Deno.env.get("STRIPE_SECRET_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!stripeKey) return new Response("STRIPE_SECRET_KEY not set", { status: 500, headers: CORS });

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2024-06-20",
    httpClient: Stripe.createFetchHttpClient(),
  });

  const supabase = createClient(supabaseUrl, serviceKey);

  // Si viene producer_id en el body, procesar solo ese productor (retiro manual)
  let filterProducerId: string | null = null;
  try {
    const body = await req.json();
    filterProducerId = body?.producer_id ?? null;
  } catch { /* cron llama sin body */ }

  // Obtener productores con cuenta Stripe
  let query = supabase
    .from("producers")
    .select("id, stripe_account_id, stripe_connect_status")
    .not("stripe_account_id", "is", null);

  if (filterProducerId) query = query.eq("id", filterProducerId);

  const { data: producers } = await query;

  if (!producers || producers.length === 0) {
    return Response.json({ processed: 0, message: "No producers with Stripe accounts" }, { headers: CORS });
  }

  let totalTransfers = 0;
  const errors: string[] = [];

  for (const producer of producers) {
    // ── Verificar estado de la cuenta Stripe ──────────────────────
    let account: Stripe.Account;
    try {
      account = await stripe.accounts.retrieve(producer.stripe_account_id);
    } catch (err) {
      errors.push(`Account retrieve failed for producer ${producer.id}: ${err.message}`);
      continue;
    }

    const isActive = account.charges_enabled && account.payouts_enabled;

    // Actualizar estado en DB si cambió
    if (isActive && producer.stripe_connect_status !== "active") {
      await supabase
        .from("producers")
        .update({ stripe_connect_status: "active" })
        .eq("id", producer.id);
    }

    if (!isActive) continue; // No procesar pagos hasta verificación completa

    // ── Ventas de beats pendientes ────────────────────────────────
    const { data: beatRows } = await supabase
      .from("beats")
      .select("id")
      .eq("producer_id", producer.id);

    if (beatRows && beatRows.length > 0) {
      const beatIds = beatRows.map((b: any) => b.id);

      const { data: pendingSales } = await supabase
        .from("sales")
        .select("id, amount_paid")
        .in("beat_id", beatIds)
        .is("payout_transferred_at", null)
        .not("amount_paid", "is", null);

      for (const sale of pendingSales ?? []) {
        const basePrice = (sale.amount_paid ?? 0) / SERVICE_FEE_FACTOR;
        const amount = Math.round(basePrice * PRODUCER_SHARE * 100);
        if (amount < STRIPE_MIN_CENTS) continue;

        try {
          const transfer = await stripe.transfers.create({
            amount,
            currency: "eur",
            destination: producer.stripe_account_id,
            metadata: { sale_id: sale.id, type: "beat_sale" },
          });

          await supabase
            .from("sales")
            .update({
              payout_transferred_at: new Date().toISOString(),
              payout_transfer_id: transfer.id,
            })
            .eq("id", sale.id);

          totalTransfers++;
        } catch (err) {
          errors.push(`Beat sale ${sale.id}: ${err.message}`);
        }
      }
    }

    // ── Reservas de estudio finalizadas pendientes ────────────────
    const { data: studioRows } = await supabase
      .from("studios")
      .select("id")
      .eq("producer_id", producer.id);

    if (studioRows && studioRows.length > 0) {
      const studioIds = studioRows.map((s: any) => s.id);

      const { data: spaceRows } = await supabase
        .from("spaces")
        .select("id")
        .in("studio_id", studioIds);

      if (spaceRows && spaceRows.length > 0) {
        const spaceIds = spaceRows.map((s: any) => s.id);
        const now = new Date().toISOString();

        const { data: pendingBookings } = await supabase
          .from("bookings")
          .select("id, amount_paid")
          .in("space_id", spaceIds)
          .eq("status", "confirmed")
          .lt("end_datetime", now)
          .is("payout_transferred_at", null)
          .not("amount_paid", "is", null);

        for (const booking of pendingBookings ?? []) {
          const amount = Math.round((booking.amount_paid ?? 0) * PRODUCER_SHARE * 100);
          if (amount < STRIPE_MIN_CENTS) continue;

          try {
            const transfer = await stripe.transfers.create({
              amount,
              currency: "eur",
              destination: producer.stripe_account_id,
              metadata: { booking_id: booking.id, type: "studio_booking" },
            });

            await supabase
              .from("bookings")
              .update({
                payout_transferred_at: new Date().toISOString(),
                payout_transfer_id: transfer.id,
              })
              .eq("id", booking.id);

            totalTransfers++;
          } catch (err) {
            errors.push(`Booking ${booking.id}: ${err.message}`);
          }
        }
      }
    }
  }

  return Response.json({ processed: totalTransfers, errors }, { headers: CORS });
});
