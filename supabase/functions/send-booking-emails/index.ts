// Edge Function: send-booking-emails
// Envía emails de confirmación al cliente y al productor vía Resend
// Input:  { booking_id: string }
// Requiere: RESEND_API_KEY en los secrets de la Edge Function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIMEZONE = "Europe/Madrid";

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString("es-ES", {
    timeZone: TIMEZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.error("RESEND_API_KEY no configurada");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Helicon <noreply@helicon.es>",
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Resend error (${res.status}):`, body);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { booking_id } = await req.json();

    if (!booking_id) {
      return Response.json({ error: "booking_id requerido" }, { status: 400, headers: CORS });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Obtener booking con todos los datos relacionados
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        id, client_name, client_email, start_datetime, end_datetime, amount_paid, status,
        spaces (
          name, price_per_hour,
          studios (
            name, location,
            producers ( name, email )
          )
        )
      `)
      .eq("id", booking_id)
      .single();

    if (error || !booking) {
      console.error("Error obteniendo booking:", error);
      return Response.json({ error: "Booking no encontrado" }, { status: 404, headers: CORS });
    }

    const space = booking.spaces as any;
    const studio = space?.studios as any;
    const producer = studio?.producers as any;

    const startFormatted = formatDateTime(booking.start_datetime);
    const endFormatted = formatDateTime(booking.end_datetime);
    const amount = booking.amount_paid?.toFixed(2) ?? "—";

    // ── Email al CLIENTE ──────────────────────────────────────────
    const clientHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="background:#050505;color:#E0E0E0;font-family:'Space Mono',monospace;margin:0;padding:40px 20px;">
        <div style="max-width:560px;margin:0 auto;">
          <div style="text-align:center;margin-bottom:32px;">
            <span style="font-size:28px;font-weight:700;color:#8A2BE2;letter-spacing:4px;">HELICON</span>
          </div>
          <div style="background:#1A1A1A;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:32px;">
            <h1 style="color:#ffffff;font-size:20px;margin:0 0 8px;">Reserva Confirmada</h1>
            <p style="color:#8A2BE2;font-size:13px;margin:0 0 28px;">ID: ${booking.id}</p>

            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#999;font-size:12px;width:40%;">ESTUDIO</td>
                <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;">${studio?.name ?? "—"}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#999;font-size:12px;">SALA</td>
                <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;">${space?.name ?? "—"}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#999;font-size:12px;">INICIO</td>
                <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;">${startFormatted}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#999;font-size:12px;">FIN</td>
                <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;">${endFormatted}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#999;font-size:12px;">IMPORTE</td>
                <td style="padding:10px 0;font-size:16px;color:#8A2BE2;font-weight:700;">${amount}€</td>
              </tr>
            </table>

            <div style="margin-top:28px;padding:16px;background:rgba(138,43,226,0.1);border-radius:8px;border:1px solid rgba(138,43,226,0.2);">
              <p style="margin:0;font-size:12px;color:#E0E0E0;">
                Si tienes alguna duda, contáctanos en <a href="mailto:hola@helicon.es" style="color:#8A2BE2;">hola@helicon.es</a>
              </p>
            </div>
          </div>
          <p style="text-align:center;color:#555;font-size:11px;margin-top:24px;">Helicon · Madrid</p>
        </div>
      </body>
      </html>
    `;

    await sendEmail(
      booking.client_email,
      `Reserva confirmada — ${studio?.name ?? "Helicon"}`,
      clientHtml
    );

    // ── Email al PRODUCTOR ──────────────────────────────────────────
    if (producer?.email) {
      const producerHtml = `
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="background:#050505;color:#E0E0E0;font-family:'Space Mono',monospace;margin:0;padding:40px 20px;">
          <div style="max-width:560px;margin:0 auto;">
            <div style="text-align:center;margin-bottom:32px;">
              <span style="font-size:28px;font-weight:700;color:#8A2BE2;letter-spacing:4px;">HELICON</span>
            </div>
            <div style="background:#1A1A1A;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:32px;">
              <h1 style="color:#ffffff;font-size:20px;margin:0 0 8px;">Nueva Reserva</h1>
              <p style="color:#8A2BE2;font-size:13px;margin:0 0 28px;">Hola ${producer.name}, tienes una nueva sesión confirmada.</p>

              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#999;font-size:12px;width:40%;">CLIENTE</td>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;">${booking.client_name}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#999;font-size:12px;">EMAIL</td>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;">
                    <a href="mailto:${booking.client_email}" style="color:#8A2BE2;">${booking.client_email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#999;font-size:12px;">SALA</td>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;">${space?.name ?? "—"}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#999;font-size:12px;">INICIO</td>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;">${startFormatted}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#999;font-size:12px;">FIN</td>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;">${endFormatted}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#999;font-size:12px;">IMPORTE</td>
                  <td style="padding:10px 0;font-size:16px;color:#8A2BE2;font-weight:700;">${amount}€</td>
                </tr>
              </table>

              <div style="margin-top:28px;padding:16px;background:rgba(138,43,226,0.1);border-radius:8px;border:1px solid rgba(138,43,226,0.2);">
                <p style="margin:0;font-size:12px;color:#E0E0E0;">
                  Gestiona tus reservas en tu <a href="https://helicon.es/producer/dashboard" style="color:#8A2BE2;">dashboard</a>
                </p>
              </div>
            </div>
            <p style="text-align:center;color:#555;font-size:11px;margin-top:24px;">Helicon · Madrid</p>
          </div>
        </body>
        </html>
      `;

      await sendEmail(
        producer.email,
        `Nueva reserva — ${booking.client_name}`,
        producerHtml
      );
    }

    return Response.json({ sent: true }, { headers: CORS });
  } catch (err) {
    console.error("send-booking-emails error:", err);
    return Response.json({ error: "Error interno" }, { status: 500, headers: CORS });
  }
});
