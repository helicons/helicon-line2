// Edge Function: create-pending-booking
// Crea una reserva en estado 'pending' de forma atómica (sin race conditions)
// Input:  { space_id, client_name, client_email, date, slot_hour, duration_hours? }
// Output: { booking_id: string }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIMEZONE = "Europe/Madrid";

// Calcula el offset UTC en minutos para Europe/Madrid en una fecha concreta
// (maneja automáticamente CET +01:00 y CEST +02:00)
function getMadridOffsetMs(date: Date): number {
  const utcStr = date.toLocaleString("en-US", { timeZone: "UTC" });
  const madridStr = date.toLocaleString("en-US", { timeZone: TIMEZONE });
  const utcDate = new Date(utcStr);
  const madridDate = new Date(madridStr);
  return madridDate.getTime() - utcDate.getTime();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const {
      space_id,
      client_name,
      client_email,
      date,        // "YYYY-MM-DD"
      slot_hour,   // número entero: 14 = 14:00
      duration_hours = 1,
    } = await req.json();

    // Validación básica
    if (!space_id || !client_name || !client_email || !date || slot_hour == null) {
      return Response.json(
        { error: "Faltan campos requeridos: space_id, client_name, client_email, date, slot_hour" },
        { status: 400, headers: CORS }
      );
    }

    if (!client_email.includes("@")) {
      return Response.json({ error: "Email inválido" }, { status: 400, headers: CORS });
    }

    // Construir start/end datetime en Europe/Madrid, convertir a UTC para Postgres
    // Ejemplo: date="2026-04-15", slot_hour=14
    // En CET (+01:00): start = 2026-04-15T14:00:00+01:00 = 2026-04-15T13:00:00Z
    // En CEST (+02:00): start = 2026-04-15T14:00:00+02:00 = 2026-04-15T12:00:00Z
    const localStartStr = `${date}T${String(slot_hour).padStart(2, "0")}:00:00`;
    const localEndStr = `${date}T${String(slot_hour + duration_hours).padStart(2, "0")}:00:00`;

    // Crear Date objects asumiendo Europe/Madrid (aproximación via offset dinámico)
    const tempStart = new Date(localStartStr); // se interpreta como local del servidor (UTC en Deno)
    const offsetMs = getMadridOffsetMs(tempStart);

    // Ajustar: la hora local de Madrid → UTC
    const startUTC = new Date(tempStart.getTime() - offsetMs);
    const endUTC = new Date(startUTC.getTime() + duration_hours * 3600000);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Llamar a la función atómica en Postgres
    const { data: bookingId, error } = await supabase.rpc("create_booking_atomic", {
      p_space_id: space_id,
      p_client_name: client_name,
      p_client_email: client_email,
      p_start_datetime: startUTC.toISOString(),
      p_end_datetime: endUTC.toISOString(),
    });

    if (error) {
      if (error.message.includes("SLOT_TAKEN")) {
        return Response.json(
          { error: "SLOT_TAKEN", message: "Este horario ya está reservado. Por favor elige otro." },
          { status: 409, headers: CORS }
        );
      }
      console.error("create-pending-booking RPC error:", error);
      return Response.json({ error: "Error al crear la reserva" }, { status: 500, headers: CORS });
    }

    return Response.json({ booking_id: bookingId }, { headers: CORS });
  } catch (err) {
    console.error("create-pending-booking error:", err);
    return Response.json({ error: "Error interno" }, { status: 500, headers: CORS });
  }
});
