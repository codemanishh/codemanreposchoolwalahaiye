import { Router } from "express";
import { db } from "@workspace/db";
import {
  teachersTable,
  studentAttendanceTable,
  subjectScheduleTable,
  teacherSubjectsTable,
  studentsTable,
  schoolsTable,
  resultsTable,
  curriculumClassesTable,
  curriculumSubjectsTable,
  notificationsTable,
} from "@workspace/db";
import { eq, and, sql, desc, gte, lte } from "drizzle-orm";
import { authenticate, requireRole, hashPassword, comparePassword, signToken, AuthRequest } from "../lib/auth.js";

const router = Router();

function paramAsString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function teacherId(req: AuthRequest): number {
  return req.user!.id;
}

function schoolId(req: AuthRequest): number {
  return req.user!.schoolId!;
}

function parseClassNo(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = String(value).match(/\d+/);
  if (!match) return null;
  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeUpdaterName(value: unknown): string {
  const name = String(value ?? "").trim();
  return name.slice(0, 100);
}

function normalizeUpdaterPhone(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "").slice(0, 15);
}

function scheduleAuditTitle(className: string): string {
  return `TIMETABLE_AUDIT|${className}`;
}

function stringifyAuditContent(payload: {
  action: "add" | "remove";
  className: string;
  dayOfWeek: number;
  day: string;
  subject: string;
  updaterName: string;
  updaterPhone: string;
  note: string;
  teacherId: number;
}) {
  return JSON.stringify(payload);
}

function parseAuditContent(content: string | null) {
  if (!content) return null;
  try {
    return JSON.parse(content) as {
      action: "add" | "remove";
      className: string;
      dayOfWeek: number;
      day: string;
      subject: string;
      updaterName: string;
      updaterPhone: string;
      note: string;
      teacherId: number;
    };
  } catch {
    return null;
  }
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

async function findCurriculumClassIdByClassName(req: AuthRequest, className: string): Promise<number | null> {
  const targetClassNo = parseClassNo(className);
  if (targetClassNo === null) return null;

  const classes = await db
    .select({ id: curriculumClassesTable.id, className: curriculumClassesTable.className, displayOrder: curriculumClassesTable.displayOrder })
    .from(curriculumClassesTable)
    .where(eq(curriculumClassesTable.schoolId, schoolId(req)));

  const match = classes.find(
    (c) => parseClassNo(c.className) === targetClassNo,
  );

  return match?.id ?? null;
}

// Get all classes for teacher's school (for class selection page)
router.get("/classes", authenticate, requireRole("teacher"), async (req: AuthRequest, res) => {
  try {
    const studentClasses = await db
      .selectDistinct({ className: studentsTable.className })
      .from(studentsTable)
      .where(and(eq(studentsTable.schoolId, schoolId(req)), eq(studentsTable.isActive, true)));

    const curriculumClasses = await db
      .select({ className: curriculumClassesTable.className, displayOrder: curriculumClassesTable.displayOrder })
      .from(curriculumClassesTable)
      .where(eq(curriculumClassesTable.schoolId, schoolId(req)));

    const classSet = new Set<string>();

    if (curriculumClasses.length > 0) {
      // School has a configured curriculum — only show those classes (admin-defined)
      for (const row of curriculumClasses) {
        const fromName = parseClassNo(row.className);
        if (fromName !== null) classSet.add(String(fromName));
      }
    } else {
      // No curriculum yet — fall back to classes that have students enrolled
      for (const row of studentClasses) {
        const normalized = String(row.className ?? "").trim();
        if (normalized) classSet.add(normalized);
      }
    }

    const classes = Array.from(classSet).sort((a, b) => {
      const na = Number.parseInt(a, 10);
      const nb = Number.parseInt(b, 10);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });

    res.json(classes);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get ALL curriculum subjects for a class (for subject dropdown in attendance)
router.get("/subjects/:className", authenticate, requireRole("teacher"), async (req: AuthRequest, res) => {
  try {
    const className = paramAsString(req.params.className);
    const classId = await findCurriculumClassIdByClassName(req, className);

    if (classId === null) {
      // Fall back to subjects from schedule table if no curriculum
      const scheduleSubjects = await db
        .selectDistinct({ subject: subjectScheduleTable.subject })
        .from(subjectScheduleTable)
        .where(
          and(
            eq(subjectScheduleTable.schoolId, schoolId(req)),
            eq(subjectScheduleTable.className, className),
          ),
        );
      res.json(scheduleSubjects.map((s) => s.subject).sort());
      return;
    }

    const subjects = await db
      .select({ subjectName: curriculumSubjectsTable.subjectName, displayOrder: curriculumSubjectsTable.displayOrder })
      .from(curriculumSubjectsTable)
      .where(eq(curriculumSubjectsTable.classId, classId))
      .orderBy(curriculumSubjectsTable.displayOrder);

    res.json(subjects.map((s) => s.subjectName));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get existing attendance for a class+subject+date (to preload when teacher opens the form)
// Also returns the name of the last teacher who submitted
router.get("/attendance/class/:className/subject/:subject/date/:date", authenticate, requireRole("teacher"), async (req: AuthRequest, res) => {
  try {
    const className = paramAsString(req.params.className);
    const subject = decodeURIComponent(paramAsString(req.params.subject));
    const date = paramAsString(req.params.date); // yyyy-MM-dd

    const records = await db
      .select({
        aadhaarNumber: studentAttendanceTable.aadhaarNumber,
        status: studentAttendanceTable.status,
        remarks: studentAttendanceTable.remarks,
        teacherId: studentAttendanceTable.teacherId,
        updatedAt: studentAttendanceTable.updatedAt,
      })
      .from(studentAttendanceTable)
      .where(
        and(
          eq(studentAttendanceTable.schoolId, schoolId(req)),
          eq(studentAttendanceTable.className, className),
          eq(studentAttendanceTable.subject, subject),
          eq(studentAttendanceTable.attendanceDate, date),
        ),
      );

    // Find the last submitting teacher name
    let lastSubmittedBy: string | null = null;
    let lastSubmittedAt: string | null = null;
    if (records.length > 0) {
      const lastRecord = records.reduce((a, b) =>
        (a.updatedAt && b.updatedAt && a.updatedAt > b.updatedAt) ? a : b,
      );
      if (lastRecord.teacherId) {
        const [teacher] = await db
          .select({ name: teachersTable.name })
          .from(teachersTable)
          .where(eq(teachersTable.id, lastRecord.teacherId));
        lastSubmittedBy = teacher?.name ?? null;
        lastSubmittedAt = lastRecord.updatedAt ? lastRecord.updatedAt.toISOString() : null;
      }
    }

    res.json({
      alreadySubmitted: records.length > 0,
      lastSubmittedBy,
      lastSubmittedAt,
      records: records.map((r) => ({ aadhaarNumber: r.aadhaarNumber, status: r.status, remarks: r.remarks })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get subjects scheduled for today for a specific class (kept for backward compat)
router.get("/schedule/today/:className", authenticate, requireRole("teacher"), async (req: AuthRequest, res) => {
  try {
    const className = paramAsString(req.params.className);
    const today = new Date();
    const dayOfWeek = today.getDay();

    const schedule = await db
      .selectDistinct({ subject: subjectScheduleTable.subject })
      .from(subjectScheduleTable)
      .where(
        and(
          eq(subjectScheduleTable.schoolId, schoolId(req)),
          eq(subjectScheduleTable.className, className),
          eq(subjectScheduleTable.dayOfWeek, dayOfWeek),
        ),
      );

    if (schedule.length > 0) {
      res.json(schedule.map((s) => s.subject));
      return;
    }

    const classId = await findCurriculumClassIdByClassName(req, className);
    if (classId === null) {
      res.json([]);
      return;
    }

    const curriculumSubjects = await db
      .select({ subjectName: curriculumSubjectsTable.subjectName })
      .from(curriculumSubjectsTable)
      .where(eq(curriculumSubjectsTable.classId, classId));

    res.json(curriculumSubjects.map((s) => s.subjectName));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all subject schedules for a class
router.get("/schedule/:className", authenticate, requireRole("teacher"), async (req: AuthRequest, res) => {
  try {
    const className = paramAsString(req.params.className);
    const classId = await findCurriculumClassIdByClassName(req, className);
    const schedule = await db
      .select()
      .from(subjectScheduleTable)
      .where(
        and(
          eq(subjectScheduleTable.schoolId, schoolId(req)),
          eq(subjectScheduleTable.className, className),
        ),
      );

    let fallbackSubjects: string[] = [];

    if (schedule.length === 0) {
      const classId = await findCurriculumClassIdByClassName(req, className);
      if (classId !== null) {
        const subjects = await db
          .select({ subjectName: curriculumSubjectsTable.subjectName })
          .from(curriculumSubjectsTable)
          .where(eq(curriculumSubjectsTable.classId, classId));
        fallbackSubjects = subjects.map((s) => s.subjectName);
      }
    }

    const byDay = Array.from({ length: 7 }, (_, i) => ({
      day: DAY_NAMES[i],
      dayOfWeek: i,
      subjects: schedule.length > 0
        ? schedule.filter((s) => s.dayOfWeek === i).map((s) => ({ id: s.id, subject: s.subject }))
        : fallbackSubjects.map((subject) => ({ id: 0, subject })),
    }));

    const availableSubjects = classId === null
      ? []
      : (await db
          .select({ subjectName: curriculumSubjectsTable.subjectName })
          .from(curriculumSubjectsTable)
          .where(eq(curriculumSubjectsTable.classId, classId))
        ).map((s) => s.subjectName);

    res.json({
      className,
      days: byDay,
      availableSubjects,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Add one subject to a class/day schedule (teacher-managed)
router.post("/schedule", authenticate, requireRole("teacher"), async (req: AuthRequest, res) => {
  try {
    const className = String(req.body?.className ?? "").trim();
    const subject = String(req.body?.subject ?? "").trim();
    const dayOfWeek = Number(req.body?.dayOfWeek);
    const updaterName = normalizeUpdaterName(req.body?.updaterName);
    const updaterPhone = normalizeUpdaterPhone(req.body?.updaterPhone);
    const note = String(req.body?.note ?? "").trim().slice(0, 300);

    if (!className || !subject || !Number.isInteger(dayOfWeek)) {
      res.status(400).json({ error: "className, subject, dayOfWeek are required" });
      return;
    }
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      res.status(400).json({ error: "dayOfWeek must be between 0 and 6" });
      return;
    }
    if (!updaterName || !updaterPhone) {
      res.status(400).json({ error: "updaterName and updaterPhone are required" });
      return;
    }

    const classId = await findCurriculumClassIdByClassName(req, className);
    if (classId === null) {
      res.status(400).json({ error: "Class is not configured in curriculum" });
      return;
    }

    const allowedSubjects = await db
      .select({ subjectName: curriculumSubjectsTable.subjectName })
      .from(curriculumSubjectsTable)
      .where(eq(curriculumSubjectsTable.classId, classId));

    const subjectAllowed = allowedSubjects.some((s) => s.subjectName.toLowerCase() === subject.toLowerCase());
    if (!subjectAllowed) {
      res.status(400).json({ error: "Subject must be from school curriculum subjects for this class" });
      return;
    }

    const existing = await db
      .select({ id: subjectScheduleTable.id })
      .from(subjectScheduleTable)
      .where(and(
        eq(subjectScheduleTable.schoolId, schoolId(req)),
        eq(subjectScheduleTable.className, className),
        eq(subjectScheduleTable.dayOfWeek, dayOfWeek),
        eq(subjectScheduleTable.subject, subject),
      ));

    if (existing.length > 0) {
      res.status(400).json({ error: "Subject already exists for that day" });
      return;
    }

    const [created] = await db.insert(subjectScheduleTable).values({
      schoolId: schoolId(req),
      className,
      subject,
      dayOfWeek,
    }).returning();

    await db.insert(notificationsTable).values({
      schoolId: schoolId(req),
      title: scheduleAuditTitle(className),
      content: stringifyAuditContent({
        action: "add",
        className,
        dayOfWeek,
        day: DAY_NAMES[dayOfWeek],
        subject,
        updaterName,
        updaterPhone,
        note,
        teacherId: teacherId(req),
      }),
      isActive: false,
    });

    res.status(201).json(created);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create schedule" });
  }
});

// Remove one schedule entry (teacher-managed)
router.delete("/schedule/:scheduleId", authenticate, requireRole("teacher"), async (req: AuthRequest, res) => {
  try {
    const scheduleId = Number.parseInt(paramAsString(req.params.scheduleId), 10);
    const updaterName = normalizeUpdaterName(req.body?.updaterName);
    const updaterPhone = normalizeUpdaterPhone(req.body?.updaterPhone);
    const note = String(req.body?.note ?? "").trim().slice(0, 300);

    if (!Number.isFinite(scheduleId)) {
      res.status(400).json({ error: "Invalid scheduleId" });
      return;
    }
    if (!updaterName || !updaterPhone) {
      res.status(400).json({ error: "updaterName and updaterPhone are required" });
      return;
    }

    const [row] = await db
      .select()
      .from(subjectScheduleTable)
      .where(and(eq(subjectScheduleTable.id, scheduleId), eq(subjectScheduleTable.schoolId, schoolId(req))));

    if (!row) {
      res.status(404).json({ error: "Schedule row not found" });
      return;
    }

    await db.delete(subjectScheduleTable).where(eq(subjectScheduleTable.id, scheduleId));

    await db.insert(notificationsTable).values({
      schoolId: schoolId(req),
      title: scheduleAuditTitle(row.className),
      content: stringifyAuditContent({
        action: "remove",
        className: row.className,
        dayOfWeek: row.dayOfWeek,
        day: DAY_NAMES[row.dayOfWeek] ?? String(row.dayOfWeek),
        subject: row.subject,
        updaterName,
        updaterPhone,
        note,
        teacherId: teacherId(req),
      }),
      isActive: false,
    });

    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete schedule" });
  }
});

// Timetable change history for one class
router.get("/schedule-history/:className", authenticate, requireRole("teacher"), async (req: AuthRequest, res) => {
  try {
    const className = paramAsString(req.params.className);
    const audits = await db
      .select({
        id: notificationsTable.id,
        title: notificationsTable.title,
        content: notificationsTable.content,
        createdAt: notificationsTable.createdAt,
      })
      .from(notificationsTable)
      .where(and(
        eq(notificationsTable.schoolId, schoolId(req)),
        eq(notificationsTable.isActive, false),
        eq(notificationsTable.title, scheduleAuditTitle(className)),
      ))
      .orderBy(desc(notificationsTable.createdAt));

    const parsed = audits
      .map((a) => ({
        id: a.id,
        createdAt: a.createdAt,
        payload: parseAuditContent(a.content),
      }))
      .filter((row) => row.payload !== null)
      .map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        action: row.payload!.action,
        dayOfWeek: row.payload!.dayOfWeek,
        day: row.payload!.day,
        subject: row.payload!.subject,
        updaterName: row.payload!.updaterName,
        updaterPhone: row.payload!.updaterPhone,
        note: row.payload!.note,
      }));

    const latest = parsed[0] ?? null;

    res.json({
      latestUpdater: latest
        ? {
            name: latest.updaterName,
            phone: latest.updaterPhone,
            at: latest.createdAt,
          }
        : null,
      history: parsed,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch schedule history" });
  }
});

// Get students in a class sorted by roll number
router.get("/class/:className/students", authenticate, requireRole("teacher"), async (req: AuthRequest, res) => {
  try {
    const className = paramAsString(req.params.className);
    const students = await db
      .select({
        id: studentsTable.id,
        aadhaarNumber: studentsTable.aadhaarNumber,
        firstName: sql`lower(split_part(trim(${studentsTable.name}), ' ', 1))`,
        name: studentsTable.name,
        className: studentsTable.className,
        rollNumber: studentsTable.rollNumber,
      })
      .from(studentsTable)
      .where(
        and(
          eq(studentsTable.schoolId, schoolId(req)),
          eq(studentsTable.className, className),
          eq(studentsTable.isActive, true),
        ),
      )
      .orderBy(studentsTable.rollNumber);

    res.json(students);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Submit/update attendance for a class+subject+date (upsert per student)
router.post("/attendance", authenticate, requireRole("teacher"), async (req: AuthRequest, res) => {
  const { className, subject, attendanceDate, records } = req.body;

  if (!className || !subject || !attendanceDate || !Array.isArray(records)) {
    res.status(400).json({ error: "className, subject, attendanceDate, and records array required" });
    return;
  }

  try {
    const dateStr = new Date(attendanceDate).toISOString().split("T")[0];
    const now = new Date();
    let upserted = 0;

    for (const record of records) {
      const { aadhaarNumber, firstName, status } = record;
      if (!aadhaarNumber || !status) continue;
      if (!["present", "absent", "leave"].includes(status)) continue;

      await db
        .insert(studentAttendanceTable)
        .values({
          schoolId: schoolId(req),
          aadhaarNumber,
          firstName: (firstName || "").toLowerCase(),
          className,
          teacherId: teacherId(req),
          subject,
          attendanceDate: dateStr,
          status,
          remarks: record.remarks || null,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [
            studentAttendanceTable.schoolId,
            studentAttendanceTable.className,
            studentAttendanceTable.subject,
            studentAttendanceTable.attendanceDate,
            studentAttendanceTable.aadhaarNumber,
          ],
          set: {
            status,
            teacherId: teacherId(req),
            remarks: record.remarks || null,
            updatedAt: now,
          },
        });
      upserted++;
    }

    const [teacher] = await db
      .select({ name: teachersTable.name })
      .from(teachersTable)
      .where(eq(teachersTable.id, teacherId(req)));

    res.json({ success: true, upserted, submittedBy: teacher?.name ?? null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to mark attendance" });
  }
});

// Get student attendance history for a subject (legacy endpoint)
router.get("/attendance/:aadhaarNumber/:firstName/:subject", authenticate, requireRole("teacher"), async (req: AuthRequest, res) => {
  try {
    const aadhaarNumber = paramAsString(req.params.aadhaarNumber);
    const firstName = paramAsString(req.params.firstName).toLowerCase();
    const subject = paramAsString(req.params.subject);
    const attendance = await db
      .select()
      .from(studentAttendanceTable)
      .where(
        and(
          eq(studentAttendanceTable.schoolId, schoolId(req)),
          eq(studentAttendanceTable.aadhaarNumber, aadhaarNumber),
          eq(studentAttendanceTable.firstName, firstName),
          eq(studentAttendanceTable.subject, subject),
        ),
      )
      .orderBy(desc(studentAttendanceTable.attendanceDate));

    res.json(attendance);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
