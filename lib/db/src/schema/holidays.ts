import { pgTable, serial, text, boolean, timestamp, integer, date, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { schoolsTable } from "./schools";

export const schoolHolidaysTable = pgTable("school_holidays", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  holidayDate: date("holiday_date").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  schoolDateIdx: index("school_holidays_school_date_idx").on(table.schoolId, table.holidayDate),
}));

export const insertSchoolHolidaySchema = createInsertSchema(schoolHolidaysTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSchoolHoliday = z.infer<typeof insertSchoolHolidaySchema>;
export type SchoolHoliday = typeof schoolHolidaysTable.$inferSelect;
