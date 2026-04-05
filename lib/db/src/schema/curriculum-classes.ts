import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { schoolsTable } from "./schools";

export const curriculumClassesTable = pgTable("curriculum_classes", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id, { onDelete: "cascade" }),
  className: text("class_name").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type CurriculumClass = typeof curriculumClassesTable.$inferSelect;
