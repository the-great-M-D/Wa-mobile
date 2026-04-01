import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, messagesTable, groupsTable, usersTable } from "@workspace/db";
import {
  ListMessagesQueryParams,
  ListMessagesResponse,
  SendMessageBody,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/messages", async (req, res): Promise<void> => {
  const query = ListMessagesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const limit = query.data.limit ?? 20;
  let baseQuery = db.select({
    id: messagesTable.id,
    content: messagesTable.content,
    groupId: messagesTable.groupId,
    groupName: groupsTable.name,
    priority: messagesTable.priority,
    status: messagesTable.status,
    sentBy: messagesTable.sentBy,
    recipientCount: messagesTable.recipientCount,
    createdAt: messagesTable.createdAt,
  })
    .from(messagesTable)
    .leftJoin(groupsTable, eq(messagesTable.groupId, groupsTable.id));

  const messages = query.data.groupId
    ? await baseQuery.where(eq(messagesTable.groupId, query.data.groupId)).orderBy(desc(messagesTable.createdAt)).limit(limit)
    : await baseQuery.orderBy(desc(messagesTable.createdAt)).limit(limit);

  res.json(ListMessagesResponse.parse(messages));
});

router.post("/messages", async (req, res): Promise<void> => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let recipientCount = 0;
  if (parsed.data.groupId) {
    const [group] = await db.select().from(groupsTable).where(eq(groupsTable.id, parsed.data.groupId));
    recipientCount = group?.memberCount ?? 0;
  } else {
    const [allUsers] = await db.select({ c: db.$count(usersTable) }).from(usersTable);
    recipientCount = Number(allUsers?.c ?? 0);
  }

  const [message] = await db
    .insert(messagesTable)
    .values({
      id: randomUUID(),
      content: parsed.data.content,
      groupId: parsed.data.groupId ?? null,
      priority: parsed.data.priority ?? "normal",
      status: "sent",
      sentBy: "Admin",
      recipientCount,
    })
    .returning();

  const [enriched] = await db.select({
    id: messagesTable.id,
    content: messagesTable.content,
    groupId: messagesTable.groupId,
    groupName: groupsTable.name,
    priority: messagesTable.priority,
    status: messagesTable.status,
    sentBy: messagesTable.sentBy,
    recipientCount: messagesTable.recipientCount,
    createdAt: messagesTable.createdAt,
  })
    .from(messagesTable)
    .leftJoin(groupsTable, eq(messagesTable.groupId, groupsTable.id))
    .where(eq(messagesTable.id, message.id));

  res.status(201).json(enriched);
});

export default router;
