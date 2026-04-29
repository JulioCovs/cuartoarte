import { Router } from "express";
import { db, bookingRequestsTable, clientsTable, musiciansTable, eventsTable, eventMusiciansTable } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";

const router = Router();

async function enrichBooking(b: typeof bookingRequestsTable.$inferSelect) {
  const [client] = await db.select({ name: clientsTable.name, phone: clientsTable.phone })
    .from(clientsTable).where(eq(clientsTable.id, b.clientId));
  const [musician] = await db.select({ name: musiciansTable.name, instruments: musiciansTable.instruments, specialty: musiciansTable.specialty })
    .from(musiciansTable).where(eq(musiciansTable.id, b.musicianId));
  return {
    ...b,
    clientName: client?.name ?? null,
    clientPhone: client?.phone ?? null,
    musicianName: musician?.name ?? null,
    musicianInstruments: musician?.instruments ?? null,
    musicianSpecialty: musician?.specialty ?? null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

// GET /bookings — filter by clientId, musicianId, status, or all
router.get("/bookings", async (req, res) => {
  try {
    const { clientId, musicianId, status } = req.query;
    let query = db.select().from(bookingRequestsTable).$dynamic();
    const conditions = [];
    if (clientId) conditions.push(eq(bookingRequestsTable.clientId, parseInt(clientId as string)));
    if (musicianId) conditions.push(eq(bookingRequestsTable.musicianId, parseInt(musicianId as string)));
    if (status) {
      const statuses = (status as string).split(",");
      if (statuses.length === 1) {
        conditions.push(eq(bookingRequestsTable.status, statuses[0]!));
      } else {
        conditions.push(or(...statuses.map((s) => eq(bookingRequestsTable.status, s)))!);
      }
    }
    if (conditions.length > 0) query = query.where(and(...conditions));
    const bookings = await query.orderBy(bookingRequestsTable.createdAt);
    const enriched = await Promise.all(bookings.map(enrichBooking));
    res.json(enriched.reverse());
  } catch (err) {
    req.log.error({ err }, "Error fetching bookings");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /bookings/:id
router.get("/bookings/:id", async (req, res) => {
  try {
    const [booking] = await db.select().from(bookingRequestsTable)
      .where(eq(bookingRequestsTable.id, parseInt(req.params.id)));
    if (!booking) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await enrichBooking(booking));
  } catch (err) {
    req.log.error({ err }, "Error fetching booking");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /bookings — client creates a booking request
router.post("/bookings", async (req, res) => {
  try {
    const { clientId, musicianId, requestedDate, requestedTime, venue, eventType, notes } = req.body;
    if (!clientId || !musicianId || !requestedDate || !requestedTime || !venue || !eventType) {
      res.status(400).json({ error: "Campos requeridos faltantes" }); return;
    }
    const [booking] = await db.insert(bookingRequestsTable).values({
      clientId, musicianId, requestedDate, requestedTime, venue, eventType, notes,
      status: "pending",
    }).returning();
    res.status(201).json(await enrichBooking(booking!));
  } catch (err) {
    req.log.error({ err }, "Error creating booking");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /bookings/:id/respond — musician accepts or rejects
router.patch("/bookings/:id/respond", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { action, musicianResponse } = req.body as { action: "accept" | "reject"; musicianResponse?: string };
    if (!["accept", "reject"].includes(action)) {
      res.status(400).json({ error: "Acción inválida (accept|reject)" }); return;
    }
    const [booking] = await db.update(bookingRequestsTable).set({
      status: action === "accept" ? "accepted" : "rejected",
      musicianResponse: musicianResponse ?? null,
      updatedAt: new Date(),
    }).where(eq(bookingRequestsTable.id, id)).returning();
    if (!booking) { res.status(404).json({ error: "Solicitud no encontrada" }); return; }
    res.json(await enrichBooking(booking));
  } catch (err) {
    req.log.error({ err }, "Error responding to booking");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /bookings/:id/confirm — admin confirms, creates the event
router.patch("/bookings/:id/confirm", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, totalAmount, adminNotes, musicianFee } = req.body as {
      title: string; totalAmount: number; adminNotes?: string; musicianFee?: number;
    };
    if (!title || totalAmount == null) {
      res.status(400).json({ error: "Título y precio requeridos" }); return;
    }
    const [booking] = await db.select().from(bookingRequestsTable)
      .where(eq(bookingRequestsTable.id, id));
    if (!booking) { res.status(404).json({ error: "Solicitud no encontrada" }); return; }
    if (booking.status !== "accepted") {
      res.status(400).json({ error: "La solicitud debe estar aceptada por el músico" }); return;
    }

    // Create the event
    const [event] = await db.insert(eventsTable).values({
      title,
      clientId: booking.clientId,
      date: booking.requestedDate,
      time: booking.requestedTime,
      venue: booking.venue,
      eventType: booking.eventType,
      status: "confirmado",
      totalAmount: String(totalAmount),
      notes: adminNotes ?? booking.notes,
    }).returning();

    // Assign musician
    await db.insert(eventMusiciansTable).values({
      eventId: event!.id,
      musicianId: booking.musicianId,
      fee: musicianFee != null ? String(musicianFee) : null,
    });

    // Update booking
    const [updated] = await db.update(bookingRequestsTable).set({
      status: "confirmed",
      adminNotes: adminNotes ?? null,
      eventId: event!.id,
      updatedAt: new Date(),
    }).where(eq(bookingRequestsTable.id, id)).returning();

    res.json({ booking: await enrichBooking(updated!), event });
  } catch (err) {
    req.log.error({ err }, "Error confirming booking");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /bookings/:id/cancel
router.patch("/bookings/:id/cancel", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [booking] = await db.update(bookingRequestsTable).set({
      status: "cancelled",
      updatedAt: new Date(),
    }).where(eq(bookingRequestsTable.id, id)).returning();
    if (!booking) { res.status(404).json({ error: "Not found" }); return; }
    res.json(await enrichBooking(booking));
  } catch (err) {
    req.log.error({ err }, "Error cancelling booking");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
