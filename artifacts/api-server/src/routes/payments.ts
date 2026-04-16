import { Router, type IRouter } from "express";
import { db, paymentsTable, eventsTable } from "@workspace/db";
import { eq, and, gte, lte, inArray, sum } from "drizzle-orm";
import { requireAuth } from "../middleware/authMiddleware";

const router: IRouter = Router();

function formatPayment(payment: typeof paymentsTable.$inferSelect, eventTitle: string | null) {
  return {
    ...payment,
    eventTitle,
    amount: parseFloat(payment.amount),
    createdAt: payment.createdAt.toISOString(),
  };
}

router.get("/payments", async (req, res) => {
  try {
    const { eventId, startDate, endDate, clientId, status } = req.query;

    if (clientId) {
      const clientEvents = await db
        .select({ id: eventsTable.id, title: eventsTable.title })
        .from(eventsTable)
        .where(eq(eventsTable.clientId, parseInt(clientId as string)));
      if (clientEvents.length === 0) {
        res.json([]);
        return;
      }
      const eventIds = clientEvents.map((e) => e.id);
      const eventMap = new Map(clientEvents.map((e) => [e.id, e.title]));
      const payments = await db
        .select()
        .from(paymentsTable)
        .where(inArray(paymentsTable.eventId, eventIds));
      res.json(payments.map((p) => formatPayment(p, eventMap.get(p.eventId) ?? null)));
      return;
    }

    let query = db.select().from(paymentsTable).$dynamic();
    const conditions = [];
    if (eventId) conditions.push(eq(paymentsTable.eventId, parseInt(eventId as string)));
    if (startDate) conditions.push(gte(paymentsTable.date, startDate as string));
    if (endDate) conditions.push(lte(paymentsTable.date, endDate as string));
    if (status) conditions.push(eq(paymentsTable.status, status as string));
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    const payments = await query.orderBy(paymentsTable.date);
    const enriched = await Promise.all(payments.map(async (p) => {
      const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, p.eventId));
      return formatPayment(p, event?.title ?? null);
    }));
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Error fetching payments");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET remaining balance for an event (based on approved payments)
router.get("/payments/remaining/:eventId", async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, eventId));
    if (!event) return res.status(404).json({ error: "Evento no encontrado" });

    const approvedPayments = await db
      .select()
      .from(paymentsTable)
      .where(and(eq(paymentsTable.eventId, eventId), eq(paymentsTable.status, "approved")));

    const totalPaid = approvedPayments.reduce((acc, p) => acc + parseFloat(p.amount), 0);
    const total = parseFloat(event.totalAmount);
    const remaining = Math.max(0, total - totalPaid);

    res.json({ total, totalPaid, remaining });
  } catch (err) {
    req.log.error({ err }, "Error fetching remaining balance");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/payments", requireAuth, async (req, res) => {
  try {
    const { eventId, amount, type, method, date, notes } = req.body;
    if (!eventId || !amount || !type || !method || !date) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    // Cash payments from clients require admin approval; everything else is auto-approved
    const userRole = req.user?.role ?? "admin";
    const isPendingApproval = method === "efectivo" && userRole === "client";
    const status = isPendingApproval ? "pending_approval" : "approved";

    const [payment] = await db.insert(paymentsTable).values({
      eventId,
      amount: String(amount),
      type,
      method,
      date,
      notes,
      status,
    }).returning();
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, eventId));
    res.status(201).json(formatPayment(payment, event?.title ?? null));
  } catch (err) {
    req.log.error({ err }, "Error creating payment");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: approve a pending cash payment
router.patch("/payments/:id/approve", requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Solo el admin puede aprobar pagos" });
    }
    const id = parseInt(req.params.id);
    const [payment] = await db
      .update(paymentsTable)
      .set({ status: "approved" })
      .where(eq(paymentsTable.id, id))
      .returning();
    if (!payment) return res.status(404).json({ error: "Pago no encontrado" });
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, payment.eventId));
    res.json(formatPayment(payment, event?.title ?? null));
  } catch (err) {
    req.log.error({ err }, "Error approving payment");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: reject a pending cash payment
router.patch("/payments/:id/reject", requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Solo el admin puede rechazar pagos" });
    }
    const id = parseInt(req.params.id);
    const [payment] = await db
      .update(paymentsTable)
      .set({ status: "rejected" })
      .where(eq(paymentsTable.id, id))
      .returning();
    if (!payment) return res.status(404).json({ error: "Pago no encontrado" });
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, payment.eventId));
    res.json(formatPayment(payment, event?.title ?? null));
  } catch (err) {
    req.log.error({ err }, "Error rejecting payment");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/payments/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { eventId, amount, type, method, date, notes } = req.body;
    const [payment] = await db.update(paymentsTable).set({
      eventId,
      amount: String(amount),
      type,
      method,
      date,
      notes,
    }).where(eq(paymentsTable.id, id)).returning();
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, payment.eventId));
    res.json(formatPayment(payment, event?.title ?? null));
  } catch (err) {
    req.log.error({ err }, "Error updating payment");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/payments/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(paymentsTable).where(eq(paymentsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting payment");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
