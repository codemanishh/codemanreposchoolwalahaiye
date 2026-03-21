import { Router } from "express";
import { db } from "@workspace/db";
import { studentsTable, resultsTable, notificationsTable, schoolsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
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
    const results = await db.select({
      id: resultsTable.id,
      studentId: resultsTable.studentId,
      subject: resultsTable.subject,
      marks: resultsTable.marks,
      maxMarks: resultsTable.maxMarks,
      grade: resultsTable.grade,
      examType: resultsTable.examType,
      examDate: resultsTable.examDate,
      remarks: resultsTable.remarks,
    }).from(resultsTable).where(eq(resultsTable.studentId, studentId(req)));
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

export default router;
