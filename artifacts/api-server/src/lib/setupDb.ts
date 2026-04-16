import { db, pool, usersTable, clientsTable, musiciansTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function setupDb() {
  // Users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      client_id INTEGER REFERENCES clients(id),
      musician_id INTEGER REFERENCES musicians(id),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  // Booking requests table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS booking_requests (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL REFERENCES clients(id),
      musician_id INTEGER NOT NULL REFERENCES musicians(id),
      requested_date TEXT NOT NULL,
      requested_time TEXT NOT NULL,
      venue TEXT NOT NULL,
      event_type TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      musician_response TEXT,
      admin_notes TEXT,
      event_id INTEGER REFERENCES events(id),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  // Expenses table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
      description TEXT NOT NULL,
      amount NUMERIC(10,2) NOT NULL,
      category TEXT NOT NULL DEFAULT 'otro',
      date TEXT NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  // Seed admin user
  const [admin] = await db.select().from(usersTable).where(eq(usersTable.email, "admin@cuartoarte.com"));
  if (!admin) {
    const hash = await bcrypt.hash("admin123", 10);
    await db.insert(usersTable).values({ email: "admin@cuartoarte.com", passwordHash: hash, name: "Administrador", role: "admin", clientId: null, musicianId: null });
  }

  // Seed demo client
  const [existingClient] = await db.select().from(clientsTable).where(eq(clientsTable.email, "cliente@ejemplo.com"));
  let clientId = existingClient?.id;
  if (!clientId) {
    const [c] = await db.insert(clientsTable).values({ name: "María García", phone: "555-0100", email: "cliente@ejemplo.com", address: "Calle Principal 123", notes: "Cliente demo" }).returning();
    clientId = c!.id;
  }
  const [clientUser] = await db.select().from(usersTable).where(eq(usersTable.email, "cliente@ejemplo.com"));
  if (!clientUser) {
    const hash = await bcrypt.hash("cliente123", 10);
    await db.insert(usersTable).values({ email: "cliente@ejemplo.com", passwordHash: hash, name: "María García", role: "client", clientId, musicianId: null });
  }

  // Seed demo musician
  const [existingMusician] = await db.select().from(musiciansTable).where(eq(musiciansTable.email, "musico@ejemplo.com"));
  let musicianId = existingMusician?.id;
  if (!musicianId) {
    const [m] = await db.insert(musiciansTable).values({ name: "Carlos Martínez", phone: "555-0200", email: "musico@ejemplo.com", instruments: "Guitarra", specialty: "Jazz y Bossa Nova", rate: "1500", notes: "Músico demo" }).returning();
    musicianId = m!.id;
  }
  const [musicianUser] = await db.select().from(usersTable).where(eq(usersTable.email, "musico@ejemplo.com"));
  if (!musicianUser) {
    const hash = await bcrypt.hash("musico123", 10);
    await db.insert(usersTable).values({ email: "musico@ejemplo.com", passwordHash: hash, name: "Carlos Martínez", role: "musician", clientId: null, musicianId });
  }
}
