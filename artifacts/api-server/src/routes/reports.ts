import { Router, type IRouter } from "express";
import { db, paymentsTable, eventsTable, clientsTable, musiciansTable, expensesTable } from "@workspace/db";
import { gte, lte, and } from "drizzle-orm";

const router: IRouter = Router();

function groupByPeriod(records: { date: string; amount: string }[], groupBy: string) {
  const groups: Record<string, number> = {};
  for (const r of records) {
    let label: string;
    if (groupBy === "day") {
      label = r.date;
    } else if (groupBy === "week") {
      const d = new Date(r.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      label = weekStart.toISOString().slice(0, 10);
    } else {
      label = r.date.slice(0, 7);
    }
    groups[label] = (groups[label] ?? 0) + parseFloat(r.amount);
  }
  return Object.entries(groups)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, amount]) => ({ label, amount }));
}

router.get("/reports/income", async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "month" } = req.query;
    let query = db.select().from(paymentsTable).$dynamic();
    const conds = [];
    if (startDate) conds.push(gte(paymentsTable.date, startDate as string));
    if (endDate) conds.push(lte(paymentsTable.date, endDate as string));
    if (conds.length) query = query.where(and(...conds));
    const payments = await query;
    const total = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
    const data = groupByPeriod(payments, groupBy as string);
    res.json({ total, data, startDate: startDate ?? null, endDate: endDate ?? null });
  } catch (err) {
    req.log.error({ err }, "Error generating income report");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reports/expenses", async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "month" } = req.query;
    let query = db.select().from(expensesTable).$dynamic();
    const conds = [];
    if (startDate) conds.push(gte(expensesTable.date, startDate as string));
    if (endDate) conds.push(lte(expensesTable.date, endDate as string));
    if (conds.length) query = query.where(and(...conds));
    const expenses = await query;
    const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    const data = groupByPeriod(expenses, groupBy as string);
    res.json({ total, data, startDate: startDate ?? null, endDate: endDate ?? null });
  } catch (err) {
    req.log.error({ err }, "Error generating expenses report");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reports/profit", async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "month" } = req.query;
    const buildCond = (dateCol: any) => {
      const c = [];
      if (startDate) c.push(gte(dateCol, startDate as string));
      if (endDate) c.push(lte(dateCol, endDate as string));
      return c;
    };

    let incomeQ = db.select().from(paymentsTable).$dynamic();
    const ic = buildCond(paymentsTable.date);
    if (ic.length) incomeQ = incomeQ.where(and(...ic));

    let expenseQ = db.select().from(expensesTable).$dynamic();
    const ec = buildCond(expensesTable.date);
    if (ec.length) expenseQ = expenseQ.where(and(...ec));

    const [payments, expenses] = await Promise.all([incomeQ, expenseQ]);
    const totalIncome = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
    const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);

    const incomeByPeriod = groupByPeriod(payments, groupBy as string);
    const expenseByPeriod = groupByPeriod(expenses, groupBy as string);

    // Merge periods
    const allLabels = [...new Set([...incomeByPeriod.map(d => d.label), ...expenseByPeriod.map(d => d.label)])].sort();
    const incomeMap = new Map(incomeByPeriod.map(d => [d.label, d.amount]));
    const expenseMap = new Map(expenseByPeriod.map(d => [d.label, d.amount]));
    const data = allLabels.map(label => ({
      label,
      income: incomeMap.get(label) ?? 0,
      expenses: expenseMap.get(label) ?? 0,
      profit: (incomeMap.get(label) ?? 0) - (expenseMap.get(label) ?? 0),
    }));

    res.json({
      totalIncome,
      totalExpenses,
      totalProfit: totalIncome - totalExpenses,
      data,
    });
  } catch (err) {
    req.log.error({ err }, "Error generating profit report");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reports/summary", async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    const [events, clients, musicians, payments, expenses] = await Promise.all([
      db.select().from(eventsTable),
      db.select().from(clientsTable),
      db.select().from(musiciansTable),
      db.select().from(paymentsTable),
      db.select().from(expensesTable),
    ]);

    const totalIncome = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
    const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    const upcomingEvents = events.filter(e => e.date >= today && e.status !== "cancelado").length;
    const eventsThisMonth = events.filter(e => e.date >= thisMonthStart).length;
    const incomeThisMonth = payments.filter(p => p.date >= thisMonthStart).reduce((s, p) => s + parseFloat(p.amount), 0);
    const expensesThisMonth = expenses.filter(e => e.date >= thisMonthStart).reduce((s, e) => s + parseFloat(e.amount), 0);
    const totalContracted = events.reduce((s, e) => s + parseFloat(e.totalAmount), 0);
    const pendingPayments = Math.max(0, totalContracted - totalIncome);

    res.json({
      totalEvents: events.length,
      upcomingEvents,
      totalClients: clients.length,
      totalMusicians: musicians.length,
      totalIncome,
      totalExpenses,
      totalProfit: totalIncome - totalExpenses,
      pendingPayments,
      eventsThisMonth,
      incomeThisMonth,
      expensesThisMonth,
    });
  } catch (err) {
    req.log.error({ err }, "Error generating summary report");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
