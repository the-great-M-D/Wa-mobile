import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, usersTable, groupsTable } from "@workspace/db";
import {
  ListUsersQueryParams,
  ListUsersResponse,
  CreateUserBody,
  UpdateUserParams,
  UpdateUserBody,
  UpdateUserResponse,
  DeleteUserParams,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/users", async (req, res): Promise<void> => {
  const query = ListUsersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.groupId) {
    conditions.push(eq(usersTable.groupId, query.data.groupId));
  }
  if (query.data.role) {
    conditions.push(eq(usersTable.role, query.data.role));
  }

  const users = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    role: usersTable.role,
    status: usersTable.status,
    groupId: usersTable.groupId,
    groupName: groupsTable.name,
    lastSeen: usersTable.lastSeen,
    createdAt: usersTable.createdAt,
  })
    .from(usersTable)
    .leftJoin(groupsTable, eq(usersTable.groupId, groupsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(usersTable.createdAt);

  res.json(ListUsersResponse.parse(users));
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({ id: randomUUID(), ...parsed.data, status: "active" })
    .returning();

  const [enriched] = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    role: usersTable.role,
    status: usersTable.status,
    groupId: usersTable.groupId,
    groupName: groupsTable.name,
    lastSeen: usersTable.lastSeen,
    createdAt: usersTable.createdAt,
  })
    .from(usersTable)
    .leftJoin(groupsTable, eq(usersTable.groupId, groupsTable.id))
    .where(eq(usersTable.id, user.id));

  res.status(201).json(enriched);
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [enriched] = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    role: usersTable.role,
    status: usersTable.status,
    groupId: usersTable.groupId,
    groupName: groupsTable.name,
    lastSeen: usersTable.lastSeen,
    createdAt: usersTable.createdAt,
  })
    .from(usersTable)
    .leftJoin(groupsTable, eq(usersTable.groupId, groupsTable.id))
    .where(eq(usersTable.id, user.id));

  res.json(UpdateUserResponse.parse(enriched));
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const params = DeleteUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.delete(usersTable).where(eq(usersTable.id, params.data.id)).returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
