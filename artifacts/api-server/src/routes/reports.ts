import { Router, type IRouter } from "express";
import { db, paymentsTable, eventsTable, clientsTable, musiciansTable } from "@workspace/db";
import { gte, lte, and, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/reports/income", async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "month" } = req.query;

    let query = db.select().from(paymentsTable).$dynamic();
    const conditions = [];
    if (startDate) conditions.push(gte(paymentsTable.date, startDate as string));
    if (endDate) conditions.push(lte(paymentsTable.date, endDate as string));
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const payments = await query;
    const total = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Group the data
    const groups: Record<string, { amount: number; count: number }> = {};
    for (const p of payments) {
      let label: string;
      if (groupBy === "day") {
        label = p.date;
      } else if (groupBy === "week") {
        const d = new Date(p.date);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        label = weekStart.toISOString().slice(0, 10);
      } else {
        label = p.date.slice(0, 7);
      }
      if (!groups[label]) groups[label] = { amount: 0, count: 0 };
      groups[label].amount += parseFloat(p.amount);
      groups[label].count += 1;
    }

    const data = Object.entries(groups)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, { amount, count }]) => ({ label, amount, count }));

    res.json({
      total,
      data,
      startDate: startDate ?? null,
      endDate: endDate ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Error generating income report");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reports/summary", async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    const [events, clients, musicians, payments] = await Promise.all([
      db.select().from(eventsTable),
      db.select().from(clientsTable),
      db.select().from(musiciansTable),
      db.select().from(paymentsTable),
    ]);

    const totalIncome = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const upcomingEvents = events.filter(e => e.date >= today && e.status !== "cancelado").length;
    const eventsThisMonth = events.filter(e => e.date >= thisMonthStart).length;
    const incomeThisMonth = payments
      .filter(p => p.date >= thisMonthStart)
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const totalContracted = events.reduce((sum, e) => sum + parseFloat(e.totalAmount), 0);
    const pendingPayments = Math.max(0, totalContracted - totalIncome);

    res.json({
      totalEvents: events.length,
      upcomingEvents,
      totalClients: clients.length,
      totalMusicians: musicians.length,
      totalIncome,
      pendingPayments,
      eventsThisMonth,
      incomeThisMonth,
    });
  } catch (err) {
    req.log.error({ err }, "Error generating summary report");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
