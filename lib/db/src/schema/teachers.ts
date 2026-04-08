import { pgTable, serial, text, integer, timestamp, boolean, date, index, uniqueIndex, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { schoolsTable } from "./schools";

export const teachersTable = pgTable("teachers", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  aadhaarNumber: text("aadhaar_number").notNull(),
  email: text("email"),
  phone: text("phone"),
  dailyPassword: text("daily_password").notNull(), // stores bcrypt hash of a 9-digit teacher password
  passwordRefreshDate: timestamp("password_refresh_date").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  schoolActiveIdx: index("teachers_school_active_idx").on(table.schoolId, table.isActive),
  schoolAadhaarUnique: uniqueIndex("teachers_school_aadhaar_uniq").on(table.schoolId, table.aadhaarNumber),
  aadhaarIdx: index("teachers_aadhaar_idx").on(table.aadhaarNumber),
}));

export const studentAttendanceTable = pgTable("student_attendance", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id, { onDelete: "cascade" }),
  studentId: integer("student_id"),
  aadhaarNumber: text("aadhaar_number"),
  firstName: text("first_name"),
  className: text("class_name"),
  teacherId: integer("teacher_id").references(() => teachersTable.id, { onDelete: "set null" }),
  subject: text("subject").notNull(),
  attendanceDate: date("attendance_date").notNull(),
  status: text("status").notNull(), // "present" | "absent" | "leave"
  remarks: text("remarks"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  attendanceUniq: unique("attendance_school_class_subject_date_aadhaar_uniq").on(
    table.schoolId,
    table.className,
    table.subject,
    table.attendanceDate,
    table.aadhaarNumber,
  ),
}));

export const subjectScheduleTable = pgTable("subject_schedule", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schoolsTable.id, { onDelete: "cascade" }),
  className: text("class_name").notNull(),
  subject: text("subject").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, ..., 6=Saturday
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const teacherSubjectsTable = pgTable("teacher_subjects", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => teachersTable.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  schoolId: integer("school_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTeacherSchema = createInsertSchema(teachersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Teacher = typeof teachersTable.$inferSelect;

export const insertAttendanceSchema = createInsertSchema(studentAttendanceTable).omit({ id: true, createdAt: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type StudentAttendance = typeof studentAttendanceTable.$inferSelect;

export const insertScheduleSchema = createInsertSchema(subjectScheduleTable).omit({ id: true, createdAt: true });
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type SubjectSchedule = typeof subjectScheduleTable.$inferSelect;
