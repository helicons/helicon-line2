// Edge Function: get-available-slots
// Calcula los slots horarios libres para un espacio en una fecha concreta
// Input:  { space_id: string, date: string } (date: "YYYY-MM-DD")
// Output: { slots: string[] }  ej: ["09:00", "10:00", "14:00"]

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIMEZONE = "Europe/Madrid";
const SLOT_DURATION_HOURS = 1;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { space_id, date } = await req.json();

    if (!space_id || !date) {
      return Response.json({ error: "space_id y date son requeridos" }, { status: 400, headers: CORS });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Obtener day_of_week para la fecha en Europe/Madrid
    // Usamos mediodía para evitar problemas de cambio de día por zona horaria
    const localDate = new Date(`${date}T12:00:00`);
    const dayOfWeek = new Intl.DateTimeFormat("es-ES", {
      timeZone: TIMEZONE,
      weekday: "short",
    })
      .formatToParts(localDate)
      .find((p) => p.type === "weekday")?.value;

    // Convertir nombre de día a número (0=domingo para compatibilidad con JS Date.getDay())
    const dayNames: Record<string, number> = {
      dom: 0, lun: 1, mar: 2, mié: 3, jue: 4, vie: 5, sáb: 6,
      // fallback para distintos locales
      "do.": 0, "lu.": 1, "ma.": 2, "mi.": 3, "ju.": 4, "vi.": 5, "sá.": 6,
    };
    const dayNum = dayNames[dayOfWeek?.toLowerCase() ?? ""] ?? localDate.getDay();

    // 2. Verificar si la fecha está bloqueada
    const { data: blocked } = await supabase
      .from("blocked_dates")
      .select("id")
      .eq("space_id", space_id)
      .eq("date", date)
      .maybeSingle();

    if (blocked) {
      return Response.json({ slots: [] }, { headers: CORS });
    }

    // 3. Obtener disponibilidad para ese día de la semana
    const { data: avail } = await supabase
      .from("availability")
      .select("start_time, end_time")
      .eq("space_id", space_id)
      .eq("day_of_week", dayNum)
      .maybeSingle();

    if (!avail) {
      return Response.json({ slots: [] }, { headers: CORS });
    }

    // 4. Generar todos los slots posibles en el rango de disponibilidad
    const startH = parseInt(avail.start_time.split(":")[0]);
    const endH = parseInt(avail.end_time.split(":")[0]);
    const allSlots: string[] = [];

    for (let h = startH; h < endH; h += SLOT_DURATION_HOURS) {
      allSlots.push(`${String(h).padStart(2, "0")}:00`);
    }

    // 5. Obtener reservas existentes (pending y confirmed) para ese espacio y fecha
    // Construimos rango del día en UTC — Supabase guarda timestamptz en UTC
    const startOfDay = new Date(`${date}T00:00:00+01:00`).toISOString();
    const endOfDay = new Date(`${date}T23:59:59+01:00`).toISOString();

    const { data: existingBookings } = await supabase
      .from("bookings")
      .select("start_datetime, end_datetime")
      .eq("space_id", space_id)
      .in("status", ["pending", "confirmed"])
      .gte("start_datetime", startOfDay)
      .lte("start_datetime", endOfDay);

    // 6. Calcular horas ocupadas
    const occupiedHours = new Set<number>();
    for (const booking of existingBookings ?? []) {
      const bStart = new Date(booking.start_datetime);
      const bEnd = new Date(booking.end_datetime);
      // Convertir a hora local Europe/Madrid
      const localStartH = parseInt(
        new Intl.DateTimeFormat("es-ES", {
          timeZone: TIMEZONE,
          hour: "2-digit",
          hour12: false,
        }).format(bStart)
      );
      const localEndH = parseInt(
        new Intl.DateTimeFormat("es-ES", {
          timeZone: TIMEZONE,
          hour: "2-digit",
          hour12: false,
        }).format(bEnd)
      );
      for (let h = localStartH; h < localEndH; h++) {
        occupiedHours.add(h);
      }
    }

    // 7. Filtrar slots libres (excluir también slots pasados si es hoy)
    const now = new Date();
    const isToday = date === now.toLocaleDateString("sv-SE", { timeZone: TIMEZONE });
    const currentHour = isToday
      ? parseInt(new Intl.DateTimeFormat("es-ES", { timeZone: TIMEZONE, hour: "2-digit", hour12: false }).format(now))
      : -1;

    const freeSlots = allSlots.filter((slot) => {
      const h = parseInt(slot.split(":")[0]);
      return !occupiedHours.has(h) && h > currentHour;
    });

    return Response.json({ slots: freeSlots }, { headers: CORS });
  } catch (err) {
    console.error("get-available-slots error:", err);
    return Response.json({ error: "Error interno" }, { status: 500, headers: CORS });
  }
});
