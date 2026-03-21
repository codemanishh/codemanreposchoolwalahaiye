import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const superadminTable = pgTable("superadmin", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default("Super Admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSuperadminSchema = createInsertSchema(superadminTable).omit({ id: true, createdAt: true });
export type InsertSuperadmin = z.infer<typeof insertSuperadminSchema>;
export type Superadmin = typeof superadminTable.$inferSelect;
