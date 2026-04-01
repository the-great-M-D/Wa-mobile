import { Router, type IRouter } from "express";
import healthRouter from "./health";
import botRouter from "./bot";
import messagesRouter from "./wa_messages";
import contactsRouter from "./wa_contacts";
import configRouter from "./wa_config";

const router: IRouter = Router();

router.use(healthRouter);
router.use(botRouter);
router.use(messagesRouter);
router.use(contactsRouter);
router.use(configRouter);

export default router;
