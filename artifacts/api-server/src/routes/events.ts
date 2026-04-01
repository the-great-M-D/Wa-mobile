import { Router, type IRouter } from "express";
import { eq, and, desc, gte, count, sql } from "drizzle-orm";
import { db, eventsTable, groupsTable } from "@workspace/db";
import {
  ListEventsQueryParams,
  ListEventsResponse,
  GetEventStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/events", async (req, res): Promise<void> => {
  const query = ListEventsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const limit = query.data.limit ?? 50;
  const conditions = [];

  if (query.data.groupId) {
    conditions.push(eq(eventsTable.groupId, query.data.groupId));
  }
  if (query.data.level) {
    conditions.push(eq(eventsTable.level, query.data.level));
  }

  const events = await db.select({
    id: eventsTable.id,
    level: eventsTable.level,
    message: eventsTable.message,
    source: eventsTable.source,
    groupId: eventsTable.groupId,
    groupName: groupsTable.name,
    metadata: eventsTable.metadata,
    createdAt: eventsTable.createdAt,
  })
    .from(eventsTable)
    .leftJoin(groupsTable, eq(eventsTable.groupId, groupsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(eventsTable.createdAt))
    .limit(limit);

  res.json(ListEventsResponse.parse(events));
});

router.get("/events/stats", async (_req, res): Promise<void> => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const [totalRow] = await db.select({ total: count() }).from(eventsTable);
  const [infoRow] = await db.select({ total: count() }).from(eventsTable).where(eq(eventsTable.level, "info"));
  const [warnRow] = await db.select({ total: count() }).from(eventsTable).where(eq(eventsTable.level, "warn"));
  const [errorRow] = await db.select({ total: count() }).from(eventsTable).where(eq(eventsTable.level, "error"));
  const [successRow] = await db.select({ total: count() }).from(eventsTable).where(eq(eventsTable.level, "success"));
  const [lastHourRow] = await db.select({ total: count() }).from(eventsTable).where(gte(eventsTable.createdAt, oneHourAgo));

  const stats = {
    total: totalRow?.total ?? 0,
    info: infoRow?.total ?? 0,
    warn: warnRow?.total ?? 0,
    error: errorRow?.total ?? 0,
    success: successRow?.total ?? 0,
    lastHour: lastHourRow?.total ?? 0,
  };

  res.json(GetEventStatsResponse.parse(stats));
});

export default router;
