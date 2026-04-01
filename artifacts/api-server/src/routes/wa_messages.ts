import { Router, type IRouter } from "express";
import { eq, desc, and, count, gte, countDistinct } from "drizzle-orm";
import { db, waMessagesTable, waContactsTable } from "@workspace/db";
import {
  ListMessagesQueryParams,
  ListMessagesResponse,
  SendMessageBody,
} from "@workspace/api-zod";
import { sendMessage, getBotInfo } from "../lib/whatsapp";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/messages", async (req, res): Promise<void> => {
  const query = ListMessagesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const limit = query.data.limit ?? 50;
  const conditions = [];

  if (query.data.contactId) {
    conditions.push(eq(waMessagesTable.remoteJid, query.data.contactId));
  }
  if (query.data.direction && query.data.direction !== "all") {
    conditions.push(eq(waMessagesTable.direction, query.data.direction));
  }

  const messages = await db.select()
    .from(waMessagesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(waMessagesTable.createdAt))
    .limit(limit);

  res.json(ListMessagesResponse.parse(messages));
});

router.get("/messages/stats", async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [total] = await db.select({ c: count() }).from(waMessagesTable);
  const [inbound] = await db.select({ c: count() }).from(waMessagesTable).where(eq(waMessagesTable.direction, "inbound"));
  const [outbound] = await db.select({ c: count() }).from(waMessagesTable).where(eq(waMessagesTable.direction, "outbound"));
  const [autoReplies] = await db.select({ c: count() }).from(waMessagesTable).where(eq(waMessagesTable.isAutoReply, true));
  const [todayCount] = await db.select({ c: count() }).from(waMessagesTable).where(gte(waMessagesTable.createdAt, today));
  const [contacts] = await db.select({ c: countDistinct(waMessagesTable.remoteJid) }).from(waMessagesTable);

  res.json({
    total: total?.c ?? 0,
    inbound: inbound?.c ?? 0,
    outbound: outbound?.c ?? 0,
    autoReplies: autoReplies?.c ?? 0,
    today: todayCount?.c ?? 0,
    uniqueContacts: contacts?.c ?? 0,
  });
});

router.post("/messages/send", async (req, res): Promise<void> => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const info = getBotInfo();
  if (info.state !== "connected") {
    res.status(400).json({ error: "Bot is not connected" });
    return;
  }

  await sendMessage(parsed.data.to, parsed.data.content);

  const jid = parsed.data.to.includes("@")
    ? parsed.data.to
    : `${parsed.data.to.replace(/\D/g, "")}@s.whatsapp.net`;

  const id = randomUUID();
  const [msg] = await db.insert(waMessagesTable).values({
    id,
    remoteJid: jid,
    content: parsed.data.content,
    direction: "outbound",
    messageType: "text",
    status: "sent",
    isAutoReply: false,
  }).returning();

  res.status(201).json(msg);
});

export default router;
