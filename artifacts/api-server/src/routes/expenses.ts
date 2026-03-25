import { Router } from "express";
import { db, expensesTable, eventsTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";

const router = Router();

function fmt(e: typeof expensesTable.$inferSelect, eventTitle: string | null) {
  return { ...e, amount: parseFloat(e.amount), eventTitle, createdAt: e.createdAt.toISOString() };
}

router.get("/expenses", async (req, res) => {
  try {
    const { eventId, startDate, endDate } = req.query;
    let query = db.select().from(expensesTable).$dynamic();
    const conds = [];
    if (eventId) conds.push(eq(expensesTable.eventId, parseInt(eventId as string)));
    if (startDate) conds.push(gte(expensesTable.date, startDate as string));
    if (endDate) conds.push(lte(expensesTable.date, endDate as string));
    if (conds.length) query = query.where(and(...conds));
    const expenses = await query.orderBy(expensesTable.date);
    const enriched = await Promise.all(expenses.map(async (e) => {
      let title: string | null = null;
      if (e.eventId) {
        const [ev] = await db.select({ title: eventsTable.title }).from(eventsTable).where(eq(eventsTable.id, e.eventId));
        title = ev?.title ?? null;
      }
      return fmt(e, title);
    }));
    res.json(enriched.reverse());
  } catch (err) {
    req.log.error({ err }, "Error fetching expenses");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/expenses", async (req, res) => {
  try {
    const { eventId, description, amount, category, date, notes } = req.body;
    if (!description || amount == null || !date) {
      res.status(400).json({ error: "Campos requeridos faltantes" }); return;
    }
    const [expense] = await db.insert(expensesTable).values({
      eventId: eventId ?? null,
      description,
      amount: String(amount),
      category: category ?? "otro",
      date,
      notes,
    }).returning();
    let title: string | null = null;
    if (expense!.eventId) {
      const [ev] = await db.select({ title: eventsTable.title }).from(eventsTable).where(eq(eventsTable.id, expense!.eventId));
      title = ev?.title ?? null;
    }
    res.status(201).json(fmt(expense!, title));
  } catch (err) {
    req.log.error({ err }, "Error creating expense");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/expenses/:id", async (req, res) => {
  try {
    await db.delete(expensesTable).where(eq(expensesTable.id, parseInt(req.params.id)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting expense");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
