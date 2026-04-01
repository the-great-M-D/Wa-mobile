import { pgTable, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const waAutoRepliesTable = pgTable("wa_auto_replies", {
  id: text("id").primaryKey(),
  trigger: text("trigger").notNull(),
  response: text("response").notNull(),
  matchType: text("match_type").notNull().default("contains"),
  caseSensitive: boolean("case_sensitive").notNull().default(false),
  enabled: boolean("enabled").notNull().default(true),
  hitCount: integer("hit_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWaAutoReplySchema = createInsertSchema(waAutoRepliesTable).omit({ createdAt: true });
export type InsertWaAutoReply = z.infer<typeof insertWaAutoReplySchema>;
export type WaAutoReply = typeof waAutoRepliesTable.$inferSelect;
