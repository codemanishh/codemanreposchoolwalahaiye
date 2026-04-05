import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { curriculumClassesTable } from "./curriculum-classes";

export const curriculumSubjectsTable = pgTable("curriculum_subjects", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => curriculumClassesTable.id, { onDelete: "cascade" }),
  subjectName: text("subject_name").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CurriculumSubject = typeof curriculumSubjectsTable.$inferSelect;
