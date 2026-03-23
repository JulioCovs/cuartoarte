import { Router, type IRouter } from "express";
import { db, eventsTable, clientsTable, eventMusiciansTable, musiciansTable } from "@workspace/db";
import { eq, and, gte, lte, inArray } from "drizzle-orm";

const router: IRouter = Router();

function formatEvent(event: typeof eventsTable.$inferSelect, musicians: any[], clientName: string | null) {
  return {
    ...event,
    clientName,
    totalAmount: parseFloat(event.totalAmount),
    advanceAmount: parseFloat(event.advanceAmount),
    createdAt: event.createdAt.toISOString(),
    musicians,
  };
}

async function getEventWithDetails(eventId: number) {
  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, eventId));
  if (!event) return null;

  let clientName: string | null = null;
  if (event.clientId) {
    const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, event.clientId));
    clientName = client?.name ?? null;
  }

  const eventMusicianRows = await db
    .select({
      id: eventMusiciansTable.id,
      eventId: eventMusiciansTable.eventId,
      musicianId: eventMusiciansTable.musicianId,
      fee: eventMusiciansTable.fee,
      musicianName: musiciansTable.name,
      instruments: musiciansTable.instruments,
    })
    .from(eventMusiciansTable)
    .innerJoin(musiciansTable, eq(eventMusiciansTable.musicianId, musiciansTable.id))
    .where(eq(eventMusiciansTable.eventId, eventId));

  const musicians = eventMusicianRows.map(m => ({
    ...m,
    fee: m.fee ? parseFloat(m.fee) : null,
  }));

  return formatEvent(event, musicians, clientName);
}

router.get("/events", async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    let query = db.select().from(eventsTable).$dynamic();

    const conditions = [];
    if (startDate) conditions.push(gte(eventsTable.date, startDate as string));
    if (endDate) conditions.push(lte(eventsTable.date, endDate as string));
    if (status) conditions.push(eq(eventsTable.status, status as string));
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const events = await query.orderBy(eventsTable.date);

    const enriched = await Promise.all(events.map(async (event) => {
      let clientName: string | null = null;
      if (event.clientId) {
        const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, event.clientId));
        clientName = client?.name ?? null;
      }
      const musicians = await db
        .select({
          id: eventMusiciansTable.id,
          eventId: eventMusiciansTable.eventId,
          musicianId: eventMusiciansTable.musicianId,
          fee: eventMusiciansTable.fee,
          musicianName: musiciansTable.name,
          instruments: musiciansTable.instruments,
        })
        .from(eventMusiciansTable)
        .innerJoin(musiciansTable, eq(eventMusiciansTable.musicianId, musiciansTable.id))
        .where(eq(eventMusiciansTable.eventId, event.id));
      return formatEvent(event, musicians.map(m => ({ ...m, fee: m.fee ? parseFloat(m.fee) : null })), clientName);
    }));

    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Error fetching events");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/events", async (req, res) => {
  try {
    const { title, clientId, date, time, venue, eventType, status, totalAmount, advanceAmount, notes, musicianIds } = req.body;
    if (!title || !date || !time || !venue || !eventType || !status) {
      return res.status(400).json({ error: "Required fields missing" });
    }
    const [event] = await db.insert(eventsTable).values({
      title,
      clientId: clientId || null,
      date,
      time,
      venue,
      eventType,
      status,
      totalAmount: String(totalAmount ?? 0),
      advanceAmount: String(advanceAmount ?? 0),
      notes,
    }).returning();

    if (musicianIds && musicianIds.length > 0) {
      await db.insert(eventMusiciansTable).values(
        musicianIds.map((id: number) => ({ eventId: event.id, musicianId: id }))
      );
    }

    const result = await getEventWithDetails(event.id);
    res.status(201).json(result);
  } catch (err) {
    req.log.error({ err }, "Error creating event");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/events/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const event = await getEventWithDetails(id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (err) {
    req.log.error({ err }, "Error fetching event");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/events/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, clientId, date, time, venue, eventType, status, totalAmount, advanceAmount, notes, musicianIds } = req.body;

    const [event] = await db.update(eventsTable).set({
      title,
      clientId: clientId || null,
      date,
      time,
      venue,
      eventType,
      status,
      totalAmount: String(totalAmount ?? 0),
      advanceAmount: String(advanceAmount ?? 0),
      notes,
    }).where(eq(eventsTable.id, id)).returning();

    if (!event) return res.status(404).json({ error: "Event not found" });

    if (musicianIds !== undefined) {
      await db.delete(eventMusiciansTable).where(eq(eventMusiciansTable.eventId, id));
      if (musicianIds.length > 0) {
        await db.insert(eventMusiciansTable).values(
          musicianIds.map((mId: number) => ({ eventId: id, musicianId: mId }))
        );
      }
    }

    const result = await getEventWithDetails(id);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error updating event");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/events/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(eventsTable).where(eq(eventsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting event");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/events/:id/musicians", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const musicians = await db
      .select({
        id: eventMusiciansTable.id,
        eventId: eventMusiciansTable.eventId,
        musicianId: eventMusiciansTable.musicianId,
        fee: eventMusiciansTable.fee,
        musicianName: musiciansTable.name,
        instruments: musiciansTable.instruments,
      })
      .from(eventMusiciansTable)
      .innerJoin(musiciansTable, eq(eventMusiciansTable.musicianId, musiciansTable.id))
      .where(eq(eventMusiciansTable.eventId, id));
    res.json(musicians.map(m => ({ ...m, fee: m.fee ? parseFloat(m.fee) : null })));
  } catch (err) {
    req.log.error({ err }, "Error fetching event musicians");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/events/:id/musicians", async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const { musicianIds } = req.body;

    await db.delete(eventMusiciansTable).where(eq(eventMusiciansTable.eventId, eventId));
    if (musicianIds && musicianIds.length > 0) {
      await db.insert(eventMusiciansTable).values(
        musicianIds.map((mId: number) => ({ eventId, musicianId: mId }))
      );
    }

    const musicians = await db
      .select({
        id: eventMusiciansTable.id,
        eventId: eventMusiciansTable.eventId,
        musicianId: eventMusiciansTable.musicianId,
        fee: eventMusiciansTable.fee,
        musicianName: musiciansTable.name,
        instruments: musiciansTable.instruments,
      })
      .from(eventMusiciansTable)
      .innerJoin(musiciansTable, eq(eventMusiciansTable.musicianId, musiciansTable.id))
      .where(eq(eventMusiciansTable.eventId, eventId));
    res.json(musicians.map(m => ({ ...m, fee: m.fee ? parseFloat(m.fee) : null })));
  } catch (err) {
    req.log.error({ err }, "Error assigning musicians to event");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
