import { pgTable, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const waConfigTable = pgTable("wa_config", {
  id: text("id").primaryKey().default("singleton"),
  botName: text("bot_name").notNull().default("MyBot"),
  prefix: text("prefix").notNull().default("!"),
  autoReplyEnabled: boolean("auto_reply_enabled").notNull().default(true),
  readReceiptsEnabled: boolean("read_receipts_enabled").notNull().default(false),
  typingIndicatorEnabled: boolean("typing_indicator_enabled").notNull().default(true),
  welcomeMessage: text("welcome_message"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWaConfigSchema = createInsertSchema(waConfigTable);
export type InsertWaConfig = z.infer<typeof insertWaConfigSchema>;
export type WaConfig = typeof waConfigTable.$inferSelect;
