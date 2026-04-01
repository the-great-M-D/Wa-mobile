import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const waMessagesTable = pgTable("wa_messages", {
  id: text("id").primaryKey(),
  remoteJid: text("remote_jid").notNull(),
  contactName: text("contact_name"),
  content: text("content").notNull(),
  direction: text("direction").notNull().default("inbound"),
  messageType: text("message_type").notNull().default("text"),
  status: text("status").notNull().default("sent"),
  isAutoReply: boolean("is_auto_reply").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWaMessageSchema = createInsertSchema(waMessagesTable).omit({ createdAt: true });
export type InsertWaMessage = z.infer<typeof insertWaMessageSchema>;
export type WaMessage = typeof waMessagesTable.$inferSelect;
