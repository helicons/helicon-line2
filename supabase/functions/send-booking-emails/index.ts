// Edge Function: send-booking-emails
// Envía emails de confirmación para bookings y entregas de beats vía Resend

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
// @ts-ignore — pdf-lib works at runtime in Deno; no local type declarations needed
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIMEZONE = "Europe/Madrid";

// ---------------------------------------------------------------------------
// LICENSE TEMPLATE
// ---------------------------------------------------------------------------

interface LicenseVars {
  effectiveDate: string;
  producerFullName: string;
  producerAlias: string;
  buyerName: string;
  beatTitle: string;
  licenseFee: string;
  licenseType: string;
  downloads: string;
  monetizedAudioStreams: string;
  monetizedVideoStreams: string;
  nonMonetizedVideoStreams: string;
  freeDownloads: string;
  radioStations: string;
  videoSyncCount: string;
  taggingClause: string;
}

const LICENSE_LIMITS: Record<string, Partial<LicenseVars>> = {
  basic: {
    downloads: "3,000",
    monetizedAudioStreams: "500,000",
    monetizedVideoStreams: "1",
    nonMonetizedVideoStreams: "500,000",
    freeDownloads: "Unlimited",
    radioStations: "5",
    videoSyncCount: "1",
  },
  premium: {
    downloads: "10,000",
    monetizedAudioStreams: "1,000,000",
    monetizedVideoStreams: "1",
    nonMonetizedVideoStreams: "Unlimited",
    freeDownloads: "Unlimited",
    radioStations: "10",
    videoSyncCount: "1",
  },
  exclusive: {
    downloads: "Unlimited",
    monetizedAudioStreams: "Unlimited",
    monetizedVideoStreams: "Unlimited",
    nonMonetizedVideoStreams: "Unlimited",
    freeDownloads: "Unlimited",
    radioStations: "Unlimited",
    videoSyncCount: "Unlimited",
  },
  stems: {
    downloads: "Unlimited",
    monetizedAudioStreams: "Unlimited",
    monetizedVideoStreams: "Unlimited",
    nonMonetizedVideoStreams: "Unlimited",
    freeDownloads: "Unlimited",
    radioStations: "Unlimited",
    videoSyncCount: "Unlimited",
  },
};

function buildLicenseVars(base: Omit<LicenseVars, "downloads" | "monetizedAudioStreams" | "monetizedVideoStreams" | "nonMonetizedVideoStreams" | "freeDownloads" | "radioStations" | "videoSyncCount"> & { taggingClause: string }): LicenseVars {
  const key = base.licenseType.replace(" License", "").toLowerCase();
  const limits = LICENSE_LIMITS[key] ?? LICENSE_LIMITS["basic"];
  return { ...base, ...limits } as LicenseVars;
}

const LICENSE_TEMPLATE = `
This Non-Exclusive {{LICENSE_TYPE}} Agreement (the "Agreement"), having been made on and effective as of {{EFFECTIVE_DATE}} (the "Effective Date") by and between {{PRODUCER_FULL_NAME}} (the "Producer" or "Licensor"); and {{BUYER_NAME}} ("You" or "Licensee"), sets forth the terms and conditions of the Licensee's use, and the rights granted in, the Producer's instrumental music file entitled {{BEAT_TITLE}} (the "Beat") in consideration for Licensee's payment of {{LICENSE_FEE}} (the "License Fee"), on a so-called "{{LICENSE_TYPE}}" basis. This Agreement is issued solely in connection with and for Licensee's use of the Beat pursuant and subject to all terms and conditions set forth herein.

1. License Fee: The Licensee shall make payment of the License Fee to Licensor on the date of this Agreement. All rights granted to Licensee by Producer in the Beat are conditional upon Licensee's timely payment of the License Fee. The License Fee is a one-time payment for the rights granted to Licensee and this Agreement is not valid until the License Fee has been paid.

2. Delivery of the Beat: Licensor agrees to deliver the Beat as a high-quality MP3 & WAV. Licensee will receive the Beat via email immediately after payment of the License Fee is made.

3. Term: The Term of this Agreement shall be ten (10) years from the Effective Date.

4. Use of the Beat: In consideration for Licensee's payment of the License Fee, the Producer hereby grants Licensee a limited non-exclusive, nontransferable license to incorporate the Beat in the preparation of one (1) new song (the "New Song"). Licensee may record lyrics over the Beat and/or incorporate portions of the Beat into pre-existing instrumental music owned by Licensee.

This License grants Licensee a worldwide, non-exclusive license to use the Beat as incorporated in the New Song. Licensee acknowledges that rights granted are on a NON-EXCLUSIVE basis and Producer shall continue to license the Beat to other third-party licensees.

The New Song may be used for any promotional purposes, including release as a single, inclusion in a mixtape or free compilation (EP or album), and/or promotional, non-monetized digital streaming.

Licensee may perform the New Song publicly for-profit and non-profit performances, including at live performances (concerts, festivals, nightclubs), on terrestrial or satellite radio, and on the internet via third-party streaming services (Spotify, YouTube, iTunes Radio etc.). The New Song may be played on {{RADIO_STATIONS}} terrestrial or satellite radio stations.

The Licensee may use the New Song in synchronization with {{VIDEO_SYNC_COUNT}} audiovisual work(s) no longer than five (5) minutes in length (a "Video"). The Video may be broadcast on any television network and/or uploaded to the internet for digital streaming and/or free download.

The Licensee may make the New Song available for sale and sell {{DOWNLOADS}} downloads/physical music products and are allowed {{MONETIZED_AUDIO_STREAMS}} monetized audio streams, {{MONETIZED_VIDEO_STREAMS}} monetized video streams, {{NON_MONETIZED_VIDEO_STREAMS}} non-monetized video streams and {{FREE_DOWNLOADS}} free downloads.

5. Restrictions: The rights granted to Licensee are NON-TRANSFERABLE. Licensee may not transfer or assign any of its rights to any third-party. Licensee shall not license or sublicense any use of the Beat or New Song for any "samples". Licensee shall not engage in any unlawful copying, streaming, duplicating, selling, or distribution of the Beat in the form as delivered to Licensee.

THE LICENSEE IS EXPRESSLY PROHIBITED FROM REGISTERING THE BEAT AND/OR NEW SONG WITH ANY CONTENT IDENTIFICATION SYSTEM, SERVICE PROVIDER, MUSIC DISTRIBUTOR, RECORD LABEL OR DIGITAL AGGREGATOR. The Beat has already been tagged for Content Identification by Producer as a pre-emptive measure to protect all interested parties.

6. Ownership: The Producer is and shall remain the sole owner and holder of all rights, title, and interest in the Beat, including all copyrights to and in the sound recording and the underlying musical compositions. Nothing contained herein shall constitute an assignment by Producer to Licensee of any of the foregoing rights.

With respect to the publishing rights, the underlying composition shall be owned/split as follows:
- {{BUYER_NAME}} owns 50% of the writer's share.
- {{PRODUCER_FULL_NAME}} owns 50% of the writer's share.

Producer shall own, control, and administer Fifty Percent (50%) of the Publisher's Share of the underlying composition.

7. Credit: Licensee shall give Producer appropriate production and songwriting credit on all records, music videos, digital labels, and cover liner notes containing the New Song. Such credit shall be in the substantial form: "Produced by {{PRODUCER_ALIAS}}".

8. Tagging and Mentions on Streaming Platforms: {{TAGGING_CLAUSE}}

9. Breach by Licensee: The Licensee shall have five (5) business days from receipt of written notice to cure any alleged breach of this Agreement. Failure to cure within five (5) business days shall result in Licensee's default and, at Producer's sole discretion, termination of Licensee's rights hereunder. If Licensee engages in commercial exploitation of the Beat or New Song outside the manner expressly provided for in this Agreement, Licensee shall be liable to Producer for monetary damages equal to all monies received in connection with such unauthorized use.

10. Warranties and Indemnification: Producer warrants that he has the full right and ability to enter into this agreement. Producer warrants that the Beat does not infringe upon any copyright or right of any person, firm, or corporation. Licensee warrants that the manufacture, sale, distribution, or other exploitation of the New Song will not infringe upon or violate any common law or statutory right of any person, firm, or corporation.

11. Miscellaneous: This Agreement constitutes the entire understanding of the parties and cannot be altered or amended except by written instrument signed by both parties. This agreement shall be governed by and interpreted in accordance with the laws of Spain. All disputes arising hereunder shall be resolved in the courts of Spain.

BY COMPLETING PAYMENT OF THE LICENSE FEE, LICENSEE ACKNOWLEDGES HAVING READ THIS AGREEMENT AND AGREES TO BE BOUND BY ITS TERMS AND CONDITIONS.

Effective Date: {{EFFECTIVE_DATE}}
Licensor (Producer): {{PRODUCER_FULL_NAME}}
Licensee (Buyer): {{BUYER_NAME}}
Beat Title: {{BEAT_TITLE}}
License Type: {{LICENSE_TYPE}}
License Fee: {{LICENSE_FEE}}
`.trim();

function fillTemplate(vars: LicenseVars): string {
  return LICENSE_TEMPLATE
    .replace(/\{\{EFFECTIVE_DATE\}\}/g, vars.effectiveDate)
    .replace(/\{\{PRODUCER_FULL_NAME\}\}/g, vars.producerFullName)
    .replace(/\{\{PRODUCER_ALIAS\}\}/g, vars.producerAlias)
    .replace(/\{\{BUYER_NAME\}\}/g, vars.buyerName)
    .replace(/\{\{BEAT_TITLE\}\}/g, vars.beatTitle)
    .replace(/\{\{LICENSE_FEE\}\}/g, vars.licenseFee)
    .replace(/\{\{LICENSE_TYPE\}\}/g, vars.licenseType)
    .replace(/\{\{DOWNLOADS\}\}/g, vars.downloads)
    .replace(/\{\{MONETIZED_AUDIO_STREAMS\}\}/g, vars.monetizedAudioStreams)
    .replace(/\{\{MONETIZED_VIDEO_STREAMS\}\}/g, vars.monetizedVideoStreams)
    .replace(/\{\{NON_MONETIZED_VIDEO_STREAMS\}\}/g, vars.nonMonetizedVideoStreams)
    .replace(/\{\{FREE_DOWNLOADS\}\}/g, vars.freeDownloads)
    .replace(/\{\{RADIO_STATIONS\}\}/g, vars.radioStations)
    .replace(/\{\{VIDEO_SYNC_COUNT\}\}/g, vars.videoSyncCount)
    .replace(/\{\{TAGGING_CLAUSE\}\}/g, vars.taggingClause);
}

// ---------------------------------------------------------------------------
// PDF GENERATOR
// ---------------------------------------------------------------------------

async function generateLicensePdf(opts: {
  licenseType: string;
  beatTitle: string;
  producerName: string;
  producerAlias: string;
  buyerName: string;
  licenseFee: string;
  date: string;
  allowsTagging: boolean;
}): Promise<string> {
  const { licenseType, beatTitle, producerName, producerAlias, buyerName, licenseFee, date, allowsTagging } = opts;

  const taggingClause = allowsTagging
    ? `The Producer expressly consents to being credited, mentioned, or tagged as a collaborator by the Licensee on streaming platforms including but not limited to Spotify, Apple Music, YouTube Music, and similar services. Licensee is encouraged to tag the Producer ("${producerAlias}") as a collaborator or featured artist on all releases containing the Beat.`
    : `The Producer has not consented to being tagged or mentioned as a collaborator on streaming platforms. All production credits shall be limited to text-based credits in the format "Produced by ${producerAlias}" as specified in Section 7. Licensee shall not list the Producer as a featured artist or collaborator on any streaming platform without prior written consent.`;

  const vars = buildLicenseVars({
    effectiveDate: date,
    producerFullName: producerName,
    producerAlias,
    buyerName,
    beatTitle,
    licenseFee,
    licenseType: `${licenseType.charAt(0).toUpperCase() + licenseType.slice(1).toLowerCase()} License`,
    taggingClause,
  });
  const contractText = fillTemplate(vars);

  const doc = await PDFDocument.create();
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const regular = await doc.embedFont(StandardFonts.TimesRoman);
  const italic = await doc.embedFont(StandardFonts.TimesRomanItalic);

  const black = rgb(0, 0, 0);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.6, 0.6, 0.6);

  const PAGE_W = 595;
  const PAGE_H = 842;
  const MARGIN = 60;
  const TEXT_W = PAGE_W - MARGIN * 2;
  const FONT_SIZE = 9;
  const LINE_H = 14;

  const newPage = () => {
    const p = doc.addPage([PAGE_W, PAGE_H]);
    return { page: p, y: PAGE_H - MARGIN };
  };

  let { page, y } = newPage();

  // Cabecera formal: nombre centrado + línea separadora
  page.drawText("HELICON", {
    x: PAGE_W / 2 - 30, y: PAGE_H - 55, size: 18, font: bold, color: black,
  });
  page.drawText("MUSIC LICENSE AGREEMENT", {
    x: PAGE_W / 2 - 72, y: PAGE_H - 72, size: 9, font: regular, color: darkGray,
  });
  page.drawLine({
    start: { x: MARGIN, y: PAGE_H - 80 },
    end: { x: PAGE_W - MARGIN, y: PAGE_H - 80 },
    thickness: 0.8, color: black,
  });
  y = PAGE_H - 100;

  const writeLine = (text: string, font = regular, size = FONT_SIZE, color = darkGray) => {
    if (y < MARGIN + 30) {
      ({ page, y } = newPage());
      // Número de página en footer
      page.drawLine({
        start: { x: MARGIN, y: MARGIN + 15 },
        end: { x: PAGE_W - MARGIN, y: MARGIN + 15 },
        thickness: 0.4, color: lightGray,
      });
      page.drawText("heliconradar.com — Music License Agreement", {
        x: MARGIN, y: MARGIN + 5, size: 7, font: italic, color: lightGray,
      });
      y = PAGE_H - MARGIN;
    }
    page.drawText(text, { x: MARGIN, y, size, font, color });
    y -= LINE_H;
  };

  const writeParagraph = (text: string, indent = 0) => {
    const words = text.split(" ");
    let line = "";
    const maxChars = Math.floor((TEXT_W - indent) / (FONT_SIZE * 0.5));
    for (const word of words) {
      if (line.length + word.length + 1 > maxChars) {
        writeLine(" ".repeat(indent) + line.trim());
        line = "";
      }
      line += word + " ";
    }
    if (line.trim()) writeLine(" ".repeat(indent) + line.trim());
    y -= 5;
  };

  const paragraphs = contractText.split("\n").filter(l => l.trim() !== "");
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (/^\d+\./.test(trimmed)) {
      // Títulos de sección numerados — negrita, separados
      y -= 6;
      writeLine(trimmed, bold, FONT_SIZE, black);
    } else if (trimmed.startsWith("-")) {
      writeParagraph(trimmed, 6);
    } else if (/^(Effective Date|Licensor|Licensee|Beat Title|License Type|License Fee):/.test(trimmed)) {
      // Bloque de firma — negrita
      writeLine(trimmed, bold, FONT_SIZE, black);
    } else {
      writeParagraph(trimmed);
    }
  }

  // Footer en última página
  y -= 10;
  page.drawLine({
    start: { x: MARGIN, y: y + 4 },
    end: { x: PAGE_W - MARGIN, y: y + 4 },
    thickness: 0.4, color: lightGray,
  });
  y -= 4;
  writeLine(`Document generated automatically by Helicon on ${date} · heliconradar.com`, italic, 7, lightGray);

  const pdfBytes = await doc.save();
  return encode(pdfBytes);
}

// ---------------------------------------------------------------------------
// EMAIL SENDER
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// HANDLER
// ---------------------------------------------------------------------------

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

      const { data: beat, error: beatErr } = await supabase
        .from('beats')
        .select('audio_url, url_basic, url_premium, url_exclusive, url_stems, producer_id, producers(name, email, allows_tagging)')
        .eq('id', beat_id)
        .single();

      if (beatErr || !beat) {
        console.error("Error obteniendo beat para email:", beatErr);
        return Response.json({ error: "Beat no encontrado" }, { status: 404, headers: CORS });
      }

      const producer = beat.producers as any;

      // URL específica de la licencia comprada (fallback al audio_url de preview)
      const licenseUrlMap: Record<string, string | null> = {
        basic:     beat.url_basic     ?? null,
        premium:   beat.url_premium   ?? null,
        exclusive: beat.url_exclusive ?? null,
        stems:     beat.url_stems     ?? null,
      };
      const downloadUrl = licenseUrlMap[license_type?.toLowerCase()] ?? beat.audio_url ?? null;

      const date = new Date().toLocaleDateString("es-ES", { timeZone: TIMEZONE });
      const licenseBase64 = await generateLicensePdf({
        licenseType: license_type,
        beatTitle: beat_title,
        producerName: producer?.name || "Helicon Producer",
        producerAlias: producer?.name?.split(" ")[0] || "Helicon",
        buyerName: buyer_email,
        licenseFee: body.license_fee ? `$${Number(body.license_fee).toFixed(2)}` : "—",
        date,
        allowsTagging: producer?.allows_tagging ?? false,
      });

      const attachments = [{
        content: licenseBase64,
        filename: `Licencia_${license_type.toUpperCase()}_${beat_title.replace(/\s+/g, "_")}.pdf`,
      }];

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
            ${downloadUrl
              ? `<a href="${downloadUrl}" style="background:#8A2BE2;color:#fff;padding:15px 30px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">DESCARGAR ARCHIVOS</a>`
              : `<p style="color:#888;font-size:13px;">El productor te enviará los archivos en breve.</p>`
            }
          </div>
          <p style="font-size:12px;color:#666;">Este es un email de entrega automática. Si tienes problemas con la descarga, contacta con soporte.</p>
        </div>
      `;

      await sendEmail(buyer_email, `Tu Beat: ${beat_title} (Licencia ${license_type})`, buyerHtml, attachments);

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

    // --- BOOKING ---
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
