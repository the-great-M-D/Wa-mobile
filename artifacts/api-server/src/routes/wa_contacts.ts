import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, waContactsTable } from "@workspace/db";
import { ListContactsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/contacts", async (_req, res): Promise<void> => {
  const contacts = await db.select()
    .from(waContactsTable)
    .orderBy(desc(waContactsTable.lastMessageAt));

  res.json(ListContactsResponse.parse(contacts));
});

export default router;
