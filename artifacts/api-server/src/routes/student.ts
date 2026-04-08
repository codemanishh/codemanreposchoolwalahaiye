import { Router } from "express";
import { db } from "@workspace/db";
import { studentsTable, resultsTable, notificationsTable, schoolsTable, schoolHolidaysTable, studentAttendanceTable } from "@workspace/db";
import { eq, and, gte, asc, sql } from "drizzle-orm";
import { authenticate, requireRole, comparePassword, hashPassword, AuthRequest } from "../lib/auth.js";

const router = Router();

router.use(authenticate, requireRole("student"));

function studentId(req: AuthRequest): number {
  return req.user!.id;
}

function studentSchoolId(req: AuthRequest): number {
  return req.user!.schoolId!;
}

// Get student profile
router.get("/profile", async (req: AuthRequest, res) => {
  try {
    const [student] = await db.select({
      id: studentsTable.id,
      name: studentsTable.name,
      aadhaarNumber: studentsTable.aadhaarNumber,
      rollNumber: studentsTable.rollNumber,
      className: studentsTable.className,
      section: studentsTable.section,
      fatherName: studentsTable.fatherName,
      motherName: studentsTable.motherName,
      phone: studentsTable.phone,
      email: studentsTable.email,
      address: studentsTable.address,
      enrollmentDate: studentsTable.enrollmentDate,
      hasChangedPassword: studentsTable.hasChangedPassword,
    }).from(studentsTable).where(eq(studentsTable.id, studentId(req)));

    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    const [school] = await db.select({ name: schoolsTable.name, slug: schoolsTable.slug })
      .from(schoolsTable).where(eq(schoolsTable.id, studentSchoolId(req)));

    res.json({
      ...student,
      schoolName: school?.name ?? "",
      schoolSlug: school?.slug ?? "",
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get student results
router.get("/results", async (req: AuthRequest, res) => {
  try {
    const [currentStudent] = await db.select({
      aadhaarNumber: studentsTable.aadhaarNumber,
      name: studentsTable.name,
      schoolId: studentsTable.schoolId,
    }).from(studentsTable).where(eq(studentsTable.id, studentId(req)));

    if (!currentStudent?.aadhaarNumber) {
      res.status(404).json({ error: "Student Aadhaar record not found" });
      return;
    }

    const firstName = (currentStudent.name || "").trim().split(/\s+/)[0]?.toLowerCase() || "";
    if (!firstName) {
      res.status(404).json({ error: "Student name record not found" });
      return;
    }

    const results = await db.select({
      id: resultsTable.id,
      aadhaarNumber: resultsTable.aadhaarNumber,
      firstName: resultsTable.firstName,
      className: resultsTable.className,
      subject: resultsTable.subject,
      marks: resultsTable.marks,
      maxMarks: resultsTable.maxMarks,
      grade: resultsTable.grade,
      examType: resultsTable.examType,
      examDate: resultsTable.examDate,
      remarks: resultsTable.remarks,
    }).from(resultsTable)
      .where(and(
        eq(resultsTable.schoolId, currentStudent.schoolId),
        eq(resultsTable.aadhaarNumber, currentStudent.aadhaarNumber),
        eq(resultsTable.firstName, firstName),
      ));

    res.json(results);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get notifications from school
router.get("/notifications", async (req: AuthRequest, res) => {
  try {
    const notifications = await db.select().from(notificationsTable)
      .where(and(eq(notificationsTable.schoolId, studentSchoolId(req)), eq(notificationsTable.isActive, true)))
      .orderBy(notificationsTable.createdAt);
    res.json(notifications);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get upcoming school holidays for students
router.get("/holidays/upcoming", async (req: AuthRequest, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const holidays = await db
      .select()
      .from(schoolHolidaysTable)
      .where(
        and(
          eq(schoolHolidaysTable.schoolId, studentSchoolId(req)),
          eq(schoolHolidaysTable.isActive, true),
          gte(schoolHolidaysTable.holidayDate, today),
        ),
      )
      .orderBy(asc(schoolHolidaysTable.holidayDate));

    res.json(holidays);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Change password
router.post("/change-password", async (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "currentPassword and newPassword required" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" });
    return;
  }
  try {
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId(req)));
    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }
    const valid = await comparePassword(currentPassword, student.passwordHash);
    if (!valid) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }
    const newHash = await hashPassword(newPassword);
    await db.update(studentsTable).set({ passwordHash: newHash, hasChangedPassword: true, updatedAt: new Date() })
      .where(eq(studentsTable.id, studentId(req)));
    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get student attendance stats per subject (for attendance graph on student dashboard)
router.get("/attendance/stats", async (req: AuthRequest, res) => {
  try {
    const [student] = await db.select({
      aadhaarNumber: studentsTable.aadhaarNumber,
      className: studentsTable.className,
      schoolId: studentsTable.schoolId,
    }).from(studentsTable).where(eq(studentsTable.id, studentId(req)));

    if (!student?.aadhaarNumber) {
      res.json([]);
      return;
    }

    // Get school session start date for filtering
    const [school] = await db.select({
      sessionStartDate: schoolsTable.sessionStartDate,
    }).from(schoolsTable).where(eq(schoolsTable.id, student.schoolId));
    const sessionStart = school?.sessionStartDate ?? null;

    // Aggregate attendance per subject
    const rows = await db
      .select({
        subject: studentAttendanceTable.subject,
        total: sql<number>`count(*)::int`,
        present: sql<number>`count(*) filter (where ${studentAttendanceTable.status} = 'present')::int`,
      })
      .from(studentAttendanceTable)
      .where(
        and(
          eq(studentAttendanceTable.schoolId, student.schoolId),
          eq(studentAttendanceTable.aadhaarNumber, student.aadhaarNumber),
          eq(studentAttendanceTable.className, student.className ?? ""),
          ...(sessionStart ? [gte(studentAttendanceTable.attendanceDate, sessionStart)] : []),
        ),
      )
      .groupBy(studentAttendanceTable.subject)
      .orderBy(studentAttendanceTable.subject);

    const stats = rows.map((r) => ({
      subject: r.subject,
      present: r.present,
      total: r.total,
      percentage: r.total > 0 ? Math.round((r.present / r.total) * 100) : 0,
    }));

    res.json(stats);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
