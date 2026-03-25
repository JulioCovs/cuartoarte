import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clientsTable = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertClientSchema = createInsertSchema(clientsTable).omit({ id: true, createdAt: true });
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clientsTable.$inferSelect;

export const musiciansTable = pgTable("musicians", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  instruments: text("instruments").notNull(),
  specialty: text("specialty"),
  rate: numeric("rate", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertMusicianSchema = createInsertSchema(musiciansTable).omit({ id: true, createdAt: true });
export type InsertMusician = z.infer<typeof insertMusicianSchema>;
export type Musician = typeof musiciansTable.$inferSelect;

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  clientId: integer("client_id").references(() => clientsTable.id),
  date: text("date").notNull(),
  time: text("time").notNull(),
  venue: text("venue").notNull(),
  eventType: text("event_type").notNull(),
  status: text("status").notNull().default("pendiente"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  advanceAmount: numeric("advance_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true, createdAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;

export const eventMusiciansTable = pgTable("event_musicians", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => eventsTable.id, { onDelete: "cascade" }).notNull(),
  musicianId: integer("musician_id").references(() => musiciansTable.id, { onDelete: "cascade" }).notNull(),
  fee: numeric("fee", { precision: 10, scale: 2 }),
});
export const insertEventMusicianSchema = createInsertSchema(eventMusiciansTable).omit({ id: true });
export type InsertEventMusician = z.infer<typeof insertEventMusicianSchema>;
export type EventMusician = typeof eventMusiciansTable.$inferSelect;

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => eventsTable.id, { onDelete: "cascade" }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(),
  method: text("method").notNull(),
  date: text("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  clientId: integer("client_id").references(() => clientsTable.id),
  musicianId: integer("musician_id").references(() => musiciansTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

// ─── Booking Requests ───────────────────────────────────────────────────────
// Estados: pending → (accepted | rejected) → confirmed | cancelled
export const bookingRequestsTable = pgTable("booking_requests", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clientsTable.id).notNull(),
  musicianId: integer("musician_id").references(() => musiciansTable.id).notNull(),
  requestedDate: text("requested_date").notNull(),
  requestedTime: text("requested_time").notNull(),
  venue: text("venue").notNull(),
  eventType: text("event_type").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  musicianResponse: text("musician_response"),
  adminNotes: text("admin_notes"),
  eventId: integer("event_id").references(() => eventsTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertBookingRequestSchema = createInsertSchema(bookingRequestsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBookingRequest = z.infer<typeof insertBookingRequestSchema>;
export type BookingRequest = typeof bookingRequestsTable.$inferSelect;

// ─── Expenses ────────────────────────────────────────────────────────────────
export const expensesTable = pgTable("expenses", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => eventsTable.id, { onDelete: "set null" }),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull().default("otro"),
  date: text("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertExpenseSchema = createInsertSchema(expensesTable).omit({ id: true, createdAt: true });
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expensesTable.$inferSelect;
