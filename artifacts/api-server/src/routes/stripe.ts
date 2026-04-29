import { Router, type IRouter, raw } from "express";
import { db, paymentsTable, eventsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/authMiddleware";
import { getUncachableStripeClient } from "../lib/stripeClient";

const router: IRouter = Router();

// Create a Stripe Checkout session for a card payment.
// The mobile app opens the returned URL in the browser.
router.post("/stripe/checkout", requireAuth, async (req, res) => {
  try {
    const { eventId, amount, type, date, notes } = req.body;
    if (!eventId || !amount || !type || !date) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    const [event] = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.id, eventId));
    if (!event) return res.status(404).json({ error: "Evento no encontrado" });

    const stripe = await getUncachableStripeClient();
    const amountCents = Math.round(parseFloat(String(amount)) * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "mxn",
            unit_amount: amountCents,
            product_data: {
              name: `${type === "anticipo" ? "Anticipo" : "Pago Total"} - ${event.title}`,
            },
          },
        },
      ],
      success_url: "https://cuartoarte.app/pago-exitoso",
      cancel_url: "https://cuartoarte.app/pago-cancelado",
      metadata: {
        eventId: String(eventId),
        amount: String(amount),
        type,
        date,
        notes: notes ?? "",
        userId: String(req.user?.id ?? ""),
      },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    req.log.error({ err: err.message }, "Error creating Stripe checkout");
    res.status(500).json({ error: "No se pudo crear la sesión de pago" });
  }
});

// Verify a checkout session (mobile app calls this when returning from browser)
router.get("/stripe/session/:sessionId", requireAuth, async (req, res) => {
  try {
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

    if (session.payment_status === "paid") {
      // Idempotent: only insert if no payment exists with this stripeSessionId
      const existing = await db
        .select()
        .from(paymentsTable)
        .where(eq(paymentsTable.stripeSessionId, session.id));

      if (existing.length === 0 && session.metadata) {
        await db.insert(paymentsTable).values({
          eventId: parseInt(session.metadata.eventId),
          amount: String(session.metadata.amount),
          type: session.metadata.type,
          method: "tarjeta",
          date: session.metadata.date,
          notes: session.metadata.notes || null,
          status: "approved",
          stripeSessionId: session.id,
        });
      }
    }

    res.json({ status: session.payment_status });
  } catch (err: any) {
    req.log.error({ err: err.message }, "Error verifying Stripe session");
    res.status(500).json({ error: "No se pudo verificar el pago" });
  }
});

// Stripe webhook — uses raw body (registered BEFORE express.json in app.ts)
export const stripeWebhookHandler = [
  raw({ type: "application/json" }),
  async (req: any, res: any) => {
    try {
      const stripe = await getUncachableStripeClient();
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event: any;
      if (webhookSecret && sig) {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        // Dev fallback: parse without verification (NOT for production)
        event = JSON.parse(req.body.toString());
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        if (session.payment_status === "paid" && session.metadata) {
          const existing = await db
            .select()
            .from(paymentsTable)
            .where(eq(paymentsTable.stripeSessionId, session.id));

          if (existing.length === 0) {
            await db.insert(paymentsTable).values({
              eventId: parseInt(session.metadata.eventId),
              amount: String(session.metadata.amount),
              type: session.metadata.type,
              method: "tarjeta",
              date: session.metadata.date,
              notes: session.metadata.notes || null,
              status: "approved",
              stripeSessionId: session.id,
            });
          }
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      req.log?.error?.({ err: err.message }, "Stripe webhook error");
      res.status(400).json({ error: err.message });
    }
  },
];

export default router;
