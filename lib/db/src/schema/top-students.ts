import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { schoolsTable } from "./schools";

export const topStudentsTable = pgTable("top_students", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  className: text("class_name").notNull(),
  percentage: text("percentage").notNull(),
  message: text("message"),
  photoUrl: text("photo_url"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type TopStudent = typeof topStudentsTable.$inferSelect;
