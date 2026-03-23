import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientsRouter from "./clients";
import musiciansRouter from "./musicians";
import eventsRouter from "./events";
import paymentsRouter from "./payments";
import reportsRouter from "./reports";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(clientsRouter);
router.use(musiciansRouter);
router.use(eventsRouter);
router.use(paymentsRouter);
router.use(reportsRouter);

export default router;
