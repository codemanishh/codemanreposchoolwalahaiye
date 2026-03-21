import { pgTable, serial, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { schoolsTable } from "./schools";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  rollNumber: text("roll_number").notNull(),
  passwordHash: text("password_hash").notNull().default("$2b$10$8Q9z6lRKb0sMqUw7gCZ5w.c/4AEaFPB1IYkXsMnfNekjE/7y5B/A6"), // bcrypt of "111111"
  className: text("class_name"),
  section: text("section"),
  fatherName: text("father_name"),
  motherName: text("mother_name"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  enrollmentDate: text("enrollment_date"),
  hasChangedPassword: boolean("has_changed_password").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
