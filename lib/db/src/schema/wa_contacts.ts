import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const waContactsTable = pgTable("wa_contacts", {
  id: text("id").primaryKey(),
  jid: text("jid").notNull().unique(),
  name: text("name"),
  phoneNumber: text("phone_number").notNull(),
  messageCount: integer("message_count").notNull().default(0),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
});

export const insertWaContactSchema = createInsertSchema(waContactsTable);
export type InsertWaContact = z.infer<typeof insertWaContactSchema>;
export type WaContact = typeof waContactsTable.$inferSelect;
