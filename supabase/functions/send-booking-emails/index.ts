// Edge Function: send-booking-emails
// Envía emails de confirmación para bookings y entregas de beats vía Resend

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIMEZONE = "Europe/Madrid";

// Helper para obtener archivos y convertirlos a base64 (requerido por Resend)
async function getFileAsBase64(url: string) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      console.error(`Error al descargar recurso: ${url} (${resp.status})`);
      return null;
    }
    const buffer = await resp.arrayBuffer();
    return encode(new Uint8Array(buffer));
  } catch (err) {
    console.error(`Excepción al descargar recurso: ${url}`, err);
    return null;
  }
}

async function sendEmail(to: string, subject: string, html: string, attachments?: any[]) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.error("RESEND_API_KEY no configurada");
    return;
  }

  const payload: any = {
    from: "Helicon <noreply@booking.heliconradar.com>",
    to,
    subject,
    html,
  };

  if (attachments && attachments.length > 0) {
    payload.attachments = attachments;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
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
    const body = await req.json();
    const type = body.type || 'booking_confirmation';

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (type === 'beat_delivery') {
      const { beat_id, buyer_email, license_type, beat_title } = body;

      // Obtener link de descarga y datos del productor
      const { data: beat, error: beatErr } = await supabase
        .from('beats')
        .select('audio_url, producer_id, producers(name, email)')
        .eq('id', beat_id)
        .single();

      if (beatErr || !beat) {
        console.error("Error obteniendo beat para email:", beatErr);
        return Response.json({ error: "Beat no encontrado" }, { status: 404, headers: CORS });
      }

      const producer = beat.producers as any;

      // Determinar qué licencia enviar según el tipo
      // Se asume que los archivos están en la carpeta public del frontend
      const SITE_URL = Deno.env.get("PUBLIC_SITE_URL") || "https://heliconradar.com";
      let licenseFilename = "";
      const lType = license_type?.toLowerCase() || "";

      if (lType === 'basic') licenseFilename = "Basic_License.docx";
      else if (lType === 'premium') licenseFilename = "Premium_License.docx";
      else if (lType === 'exclusive') licenseFilename = "Standart_License.docx"; // Ajustado según archivos en public
      
      const attachments = [];
      if (licenseFilename) {
        const fileUrl = `${SITE_URL}/${licenseFilename}`;
        const base64Content = await getFileAsBase64(fileUrl);
        if (base64Content) {
          attachments.push({
            content: base64Content,
            filename: licenseFilename
          });
        }
      }

      // Email al Comprador
      const buyerHtml = `
        <div style="background:#050505;color:#fff;padding:40px;font-family:sans-serif;max-width:600px;margin:0 auto;border-radius:12px;border:1px solid #333; text-align:center;">
          <h1 style="color:#8A2BE2;letter-spacing:2px;">HELICON</h1>
          <h2>Tu Beat está listo para descargar</h2>
          <div style="background:#111;padding:20px;border-radius:8px;margin:20px 0;text-align:left;">
            <p><strong>Beat:</strong> ${beat_title}</p>
            <p><strong>Licencia:</strong> ${license_type.toUpperCase()}</p>
            <p><strong>Producido por:</strong> ${producer?.name || 'Helicon Producer'}</p>
            <p style="font-size:12px;color:#8A2BE2;">He adjuntado el contrato de licencia en este email para tus registros.</p>
          </div>
          <div style="margin:30px 0;">
            <a href="${beat.audio_url}" style="background:#8A2BE2;color:#fff;padding:15px 30px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">DESCARGAR ARCHIVOS</a>
          </div>
          <p style="font-size:12px;color:#666;">Este es un email de entrega automática. Si tienes problemas con la descarga, contacta con soporte.</p>
        </div>
      `;

      await sendEmail(buyer_email, `Tu Beat: ${beat_title} (Licencia ${license_type})`, buyerHtml, attachments);

      // Email al Productor
      if (producer?.email) {
        const prodHtml = `
          <div style="background:#050505;color:#fff;padding:40px;font-family:sans-serif;max-width:600px;margin:0 auto;border-radius:12px;border:1px solid #333;">
            <h1 style="color:#8A2BE2;text-align:center;">NUEVA VENTA</h1>
            <p>Hola ${producer.name}, acabas de vender una licencia <strong>${license_type}</strong> de tu beat <strong>${beat_title}</strong>.</p>
            <p><strong>Comprador:</strong> ${buyer_email}</p>
            <p style="margin-top:30px;color:#666;">El pago ha sido procesado correctamente y los archivos han sido enviados.</p>
          </div>
        `;
        await sendEmail(producer.email, `¡Has vendido un beat! — ${beat_title}`, prodHtml);
      }

      return Response.json({ sent: true }, { headers: CORS });
    }

    // --- LOGICA DE BOOKING (EXISTENTE) ---
    const { booking_id } = body;
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        id, client_name, client_email, start_datetime, end_datetime, amount_paid, status,
        spaces ( name,studios ( name,producers ( name, email ) ) )
      `)
      .eq("id", booking_id)
      .single();

    if (error || !booking) return Response.json({ error: "Booking no encontrado" }, { status: 404, headers: CORS });

    const space = booking.spaces as any;
    const studio = space?.studios as any;
    const producer = studio?.producers as any;
    const amount = booking.amount_paid?.toFixed(2) ?? "—";

    const clientHtml = `
      <div style="background:#050505;color:#fff;padding:30px;font-family:sans-serif;">
        <h1 style="color:#8A2BE2;">Reserva Confirmada</h1>
        <p><strong>Estudio:</strong> ${studio?.name}</p>
        <p><strong>Importe:</strong> ${amount}€</p>
        <p>ID: ${booking.id}</p>
      </div>
    `;

    await sendEmail(booking.client_email, `Reserva confirmada — ${studio?.name}`, clientHtml);

    if (producer?.email) {
      const prodHtml = `<div style="background:#050505;color:#fff;padding:30px;font-family:sans-serif;"><h1 style="color:#8A2BE2;">Nueva Reserva</h1><p>Cliente: ${booking.client_name}</p></div>`;
      await sendEmail(producer.email, `Nueva reserva — ${booking.client_name}`, prodHtml);
    }

    return Response.json({ sent: true }, { headers: CORS });
  } catch (err) {
    console.error("send-booking-emails error:", err);
    return Response.json({ error: "Error interno" }, { status: 500, headers: CORS });
  }
});
