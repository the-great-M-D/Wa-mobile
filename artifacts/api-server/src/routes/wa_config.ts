import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, waConfigTable, waAutoRepliesTable } from "@workspace/db";
import {
  UpdateBotConfigBody,
  GetBotConfigResponse,
  ListAutoRepliesResponse,
  CreateAutoReplyBody,
  UpdateAutoReplyParams,
  UpdateAutoReplyBody,
  UpdateAutoReplyResponse,
  DeleteAutoReplyParams,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

async function getOrCreateConfig() {
  const existing = await db.select().from(waConfigTable).where(eq(waConfigTable.id, "singleton"));
  if (existing.length > 0) return existing[0];
  const [created] = await db.insert(waConfigTable).values({ id: "singleton" }).returning();
  return created;
}

router.get("/config", async (_req, res): Promise<void> => {
  const config = await getOrCreateConfig();
  res.json(GetBotConfigResponse.parse(config));
});

router.patch("/config", async (req, res): Promise<void> => {
  const parsed = UpdateBotConfigBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await getOrCreateConfig();

  const [config] = await db.update(waConfigTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(waConfigTable.id, "singleton"))
    .returning();

  res.json(GetBotConfigResponse.parse(config));
});

router.get("/config/auto-replies", async (_req, res): Promise<void> => {
  const rules = await db.select().from(waAutoRepliesTable).orderBy(waAutoRepliesTable.createdAt);
  res.json(ListAutoRepliesResponse.parse(rules));
});

router.post("/config/auto-replies", async (req, res): Promise<void> => {
  const parsed = CreateAutoReplyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [rule] = await db.insert(waAutoRepliesTable).values({
    id: randomUUID(),
    trigger: parsed.data.trigger,
    response: parsed.data.response,
    matchType: parsed.data.matchType ?? "contains",
    caseSensitive: parsed.data.caseSensitive ?? false,
    enabled: parsed.data.enabled ?? true,
    hitCount: 0,
  }).returning();

  res.status(201).json(rule);
});

router.patch("/config/auto-replies/:id", async (req, res): Promise<void> => {
  const params = UpdateAutoReplyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAutoReplyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [rule] = await db.update(waAutoRepliesTable)
    .set(parsed.data)
    .where(eq(waAutoRepliesTable.id, params.data.id))
    .returning();

  if (!rule) {
    res.status(404).json({ error: "Rule not found" });
    return;
  }

  res.json(UpdateAutoReplyResponse.parse(rule));
});

router.delete("/config/auto-replies/:id", async (req, res): Promise<void> => {
  const params = DeleteAutoReplyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [rule] = await db.delete(waAutoRepliesTable)
    .where(eq(waAutoRepliesTable.id, params.data.id))
    .returning();

  if (!rule) {
    res.status(404).json({ error: "Rule not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
