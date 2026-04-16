import { Router, type IRouter } from "express";
import { db, musiciansTable, eventMusiciansTable, bookingRequestsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/musicians", async (req, res) => {
  try {
    const musicians = await db.select().from(musiciansTable).orderBy(musiciansTable.name);
    res.json(musicians.map(m => ({
      ...m, rate: m.rate ? parseFloat(m.rate) : null, createdAt: m.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Error fetching musicians");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/musicians", async (req, res) => {
  try {
    const { name, phone, email, instruments, specialty, rate, notes } = req.body;
    if (!name || !phone || !instruments) return res.status(400).json({ error: "Name, phone, and instruments are required" });
    const [musician] = await db.insert(musiciansTable).values({
      name, phone, email, instruments, specialty, rate: rate != null ? String(rate) : null, notes,
    }).returning();
    res.status(201).json({ ...musician!, rate: musician!.rate ? parseFloat(musician!.rate) : null, createdAt: musician!.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error creating musician");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/musicians/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [musician] = await db.select().from(musiciansTable).where(eq(musiciansTable.id, id));
    if (!musician) return res.status(404).json({ error: "Musician not found" });
    res.json({ ...musician, rate: musician.rate ? parseFloat(musician.rate) : null, createdAt: musician.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error fetching musician");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/musicians/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, phone, email, instruments, specialty, rate, notes } = req.body;
    const [musician] = await db.update(musiciansTable).set({
      name, phone, email, instruments, specialty, rate: rate != null ? String(rate) : null, notes,
    }).where(eq(musiciansTable.id, id)).returning();
    if (!musician) return res.status(404).json({ error: "Musician not found" });
    res.json({ ...musician, rate: musician.rate ? parseFloat(musician.rate) : null, createdAt: musician.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error updating musician");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/musicians/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    // 1. Remove from event assignments (also has ON DELETE CASCADE but explicit is safer)
    await db.delete(eventMusiciansTable).where(eq(eventMusiciansTable.musicianId, id));
    // 2. Delete booking requests linked to this musician
    await db.delete(bookingRequestsTable).where(eq(bookingRequestsTable.musicianId, id));
    // 3. Unlink user account
    await db.update(usersTable).set({ musicianId: null }).where(eq(usersTable.musicianId, id));
    // 4. Delete the musician
    await db.delete(musiciansTable).where(eq(musiciansTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting musician");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
