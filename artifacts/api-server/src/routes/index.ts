import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientsRouter from "./clients";
import musiciansRouter from "./musicians";
import eventsRouter from "./events";
import paymentsRouter from "./payments";
import reportsRouter from "./reports";
import authRouter from "./auth";
import bookingsRouter from "./bookings";
import expensesRouter from "./expenses";
import stripeRouter from "./stripe";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(clientsRouter);
router.use(musiciansRouter);
router.use(eventsRouter);
router.use(paymentsRouter);
router.use(reportsRouter);
router.use(bookingsRouter);
router.use(expensesRouter);
router.use(stripeRouter);

export default router;
