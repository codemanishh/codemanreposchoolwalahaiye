import { pgTable, serial, text, real, timestamp, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { schoolsTable } from "./schools";

export const resultsTable = pgTable("results", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id, { onDelete: "cascade" }),
  studentId: integer("student_id"),
  aadhaarNumber: text("aadhaar_number"),
  firstName: text("first_name"),
  className: text("class_name"),
  subject: text("subject").notNull(),
  marks: real("marks").notNull(),
  maxMarks: real("max_marks").notNull(),
  grade: text("grade"),
  examType: text("exam_type"),
  examDate: text("exam_date"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  schoolAadhaarFirstClassIdx: index("results_school_aadhaar_first_name_class_idx").on(table.schoolId, table.aadhaarNumber, table.firstName, table.className),
  schoolCreatedIdx: index("results_school_created_idx").on(table.schoolId, table.createdAt),
  dedupeLookupIdx: index("results_dedupe_lookup_idx").on(table.schoolId, table.aadhaarNumber, table.firstName, table.className, table.subject, table.examType, table.examDate),
}));

export const insertResultSchema = createInsertSchema(resultsTable).omit({ id: true, createdAt: true });
export type InsertResult = z.infer<typeof insertResultSchema>;
export type Result = typeof resultsTable.$inferSelect;
