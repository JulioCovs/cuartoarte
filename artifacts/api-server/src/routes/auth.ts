import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { JWT_SECRET, requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: "Email y contraseña requeridos" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (!user) {
    res.status(401).json({ error: "Credenciales incorrectas" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Credenciales incorrectas" });
    return;
  }
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    clientId: user.clientId,
    musicianId: user.musicianId,
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token, user: payload });
});

router.get("/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
