import { pgTable, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adminSettingsTable = pgTable("admin_settings", {
  id: text("id").primaryKey().default("singleton"),
  systemName: text("system_name").notNull().default("ControlPlane"),
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  allowRegistration: boolean("allow_registration").notNull().default(true),
  maxGroupSize: integer("max_group_size").notNull().default(100),
  defaultRole: text("default_role").notNull().default("member"),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAdminSettingsSchema = createInsertSchema(adminSettingsTable);
export type InsertAdminSettings = z.infer<typeof insertAdminSettingsSchema>;
export type AdminSettings = typeof adminSettingsTable.$inferSelect;
