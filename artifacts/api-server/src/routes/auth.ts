import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, usersTable, clientsTable, musiciansTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { JWT_SECRET, requireAuth, requireRole } from "../middleware/authMiddleware";

const router = Router();

// POST /auth/login
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: "Email y contraseña requeridos" }); return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (!user) { res.status(401).json({ error: "Credenciales incorrectas" }); return; }

  if (user.approvalStatus === "pending") {
    res.status(403).json({ error: "Tu cuenta está pendiente de aprobación por el administrador. Te avisarán cuando esté lista." }); return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) { res.status(401).json({ error: "Credenciales incorrectas" }); return; }

  const payload = { id: user.id, email: user.email, name: user.name, role: user.role, clientId: user.clientId, musicianId: user.musicianId };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token, user: payload });
});

// POST /auth/register — clients auto-approved; musicians need admin approval
router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name, role, phone, instruments, specialty } = req.body as {
      email: string; password: string; name: string; role: "client" | "musician";
      phone?: string; instruments?: string; specialty?: string;
    };
    if (!email || !password || !name || !role) {
      res.status(400).json({ error: "Email, contraseña, nombre y rol son requeridos" }); return;
    }
    if (!["client", "musician"].includes(role)) {
      res.status(400).json({ error: "Rol inválido (client o musician)" }); return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" }); return;
    }
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    if (existing) { res.status(409).json({ error: "Ya existe una cuenta con ese email" }); return; }

    const hash = await bcrypt.hash(password, 10);
    const approvalStatus = role === "client" ? "active" : "pending";
    let clientId: number | null = null;
    let musicianId: number | null = null;

    if (role === "client") {
      if (!phone) { res.status(400).json({ error: "El teléfono es requerido para clientes" }); return; }
      const [client] = await db.insert(clientsTable).values({ name, phone, email: email.toLowerCase() }).returning();
      clientId = client!.id;
    } else {
      if (!phone || !instruments) { res.status(400).json({ error: "Teléfono e instrumentos requeridos para músicos" }); return; }
      const [musician] = await db.insert(musiciansTable).values({ name, phone, email: email.toLowerCase(), instruments, specialty: specialty ?? null }).returning();
      musicianId = musician!.id;
    }

    const [newUser] = await db.insert(usersTable).values({
      email: email.toLowerCase(), passwordHash: hash, name, role, approvalStatus, clientId, musicianId,
    }).returning();

    if (role === "client") {
      const payload = { id: newUser!.id, email: newUser!.email, name: newUser!.name, role: newUser!.role, clientId, musicianId };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
      res.status(201).json({ token, user: payload, message: "Cuenta creada exitosamente" });
    } else {
      res.status(201).json({ message: "Solicitud enviada. El administrador revisará tu cuenta y te contactará cuando esté aprobada." });
    }
  } catch (err) {
    req.log.error({ err }, "Error en registro");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /auth/pending-users — admin: list users pending approval
router.get("/auth/pending-users", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const pending = await db.select().from(usersTable).where(eq(usersTable.approvalStatus, "pending"));
    res.json(pending.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role, musicianId: u.musicianId, createdAt: u.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Error fetching pending users");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /auth/approve/:id — admin: approve or reject a pending user
router.patch("/auth/approve/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { action } = req.body as { action: "approve" | "reject" };
    if (!["approve", "reject"].includes(action)) {
      res.status(400).json({ error: "Acción inválida (approve|reject)" }); return;
    }
    const newStatus = action === "approve" ? "active" : "rejected";
    const [user] = await db.update(usersTable).set({ approvalStatus: newStatus }).where(eq(usersTable.id, parseInt(req.params.id))).returning();
    if (!user) { res.status(404).json({ error: "Usuario no encontrado" }); return; }
    res.json({ id: user.id, email: user.email, name: user.name, approvalStatus: user.approvalStatus });
  } catch (err) {
    req.log.error({ err }, "Error approving user");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/reset-password — reset password by email (no email verification for simplicity)
router.post("/auth/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body as { email?: string; newPassword?: string };
    if (!email || !newPassword) {
      res.status(400).json({ error: "Email y nueva contraseña requeridos" }); return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" }); return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    if (!user) { res.status(404).json({ error: "No existe una cuenta con ese email" }); return; }
    if (user.role === "admin") {
      res.status(403).json({ error: "No puedes restablecer la contraseña de este tipo de cuenta desde aquí. Contacta al administrador." }); return;
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await db.update(usersTable).set({ passwordHash: hash }).where(eq(usersTable.id, user.id));
    res.json({ message: "Contraseña actualizada exitosamente. Ya puedes iniciar sesión." });
  } catch (err) {
    req.log.error({ err }, "Error resetting password");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /auth/me
router.get("/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
