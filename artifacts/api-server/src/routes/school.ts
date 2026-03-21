import { Router } from "express";
import { db } from "@workspace/db";
import { schoolsTable, studentsTable, resultsTable, notificationsTable, galleryTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import multer from "multer";
import * as XLSX from "xlsx";
import { authenticate, requireRole, hashPassword, AuthRequest } from "../lib/auth.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate, requireRole("school"));

function schoolId(req: AuthRequest): number {
  return req.user!.schoolId!;
}

// Get school profile
router.get("/profile", async (req: AuthRequest, res) => {
  try {
    const [school] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, schoolId(req)));
    if (!school) {
      res.status(404).json({ error: "School not found" });
      return;
    }
    const { passwordHash: _ph, ...profile } = school;
    res.json(profile);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update school profile
router.put("/profile", async (req: AuthRequest, res) => {
  const {
    tagline, about, mission, vision, email, phone, address, city, state,
    logoUrl, heroImageUrl, yearsOfExperience, principalMessage, founderMessage,
    presidentMessage, feeStructure, facilities, mapUrl, socialFacebook, socialTwitter, socialYoutube
  } = req.body;
  try {
    const [school] = await db.update(schoolsTable).set({
      tagline, about, mission, vision, email, phone, address, city, state,
      logoUrl, heroImageUrl, yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : null,
      principalMessage, founderMessage, presidentMessage, feeStructure, facilities,
      mapUrl, socialFacebook, socialTwitter, socialYoutube,
      updatedAt: new Date(),
    }).where(eq(schoolsTable.id, schoolId(req))).returning();
    const { passwordHash: _ph, ...profile } = school;
    res.json(profile);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Notifications
router.get("/notifications", async (req: AuthRequest, res) => {
  try {
    const notifications = await db.select().from(notificationsTable)
      .where(eq(notificationsTable.schoolId, schoolId(req)))
      .orderBy(notificationsTable.createdAt);
    res.json(notifications);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/notifications", async (req: AuthRequest, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    res.status(400).json({ error: "title and content required" });
    return;
  }
  try {
    const [notification] = await db.insert(notificationsTable).values({
      schoolId: schoolId(req),
      title,
      content,
    }).returning();
    res.status(201).json(notification);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/notifications/:notificationId", async (req: AuthRequest, res) => {
  const notificationId = parseInt(req.params.notificationId);
  try {
    await db.delete(notificationsTable).where(
      and(eq(notificationsTable.id, notificationId), eq(notificationsTable.schoolId, schoolId(req)))
    );
    res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Students
router.get("/students", async (req: AuthRequest, res) => {
  try {
    const students = await db.select({
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
      isActive: studentsTable.isActive,
    }).from(studentsTable).where(eq(studentsTable.schoolId, schoolId(req))).orderBy(studentsTable.name);
    res.json(students);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/students", async (req: AuthRequest, res) => {
  const { name, rollNumber, className, section, fatherName, motherName, phone, email, address, enrollmentDate } = req.body;
  if (!name || !rollNumber) {
    res.status(400).json({ error: "name and rollNumber required" });
    return;
  }
  try {
    const defaultHash = await hashPassword("111111");
    const [student] = await db.insert(studentsTable).values({
      schoolId: schoolId(req),
      name,
      rollNumber,
      passwordHash: defaultHash,
      className: className || null,
      section: section || null,
      fatherName: fatherName || null,
      motherName: motherName || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      enrollmentDate: enrollmentDate || null,
    }).returning({
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
      isActive: studentsTable.isActive,
    });
    res.status(201).json(student);
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(400).json({ error: "Student with this roll number already exists" });
      return;
    }
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/students/:studentId", async (req: AuthRequest, res) => {
  const studentId = parseInt(req.params.studentId);
  const { name, className, section, fatherName, motherName, phone, email, address, enrollmentDate, isActive } = req.body;
  try {
    const [student] = await db.update(studentsTable).set({
      name, className, section, fatherName, motherName, phone, email, address, enrollmentDate,
      isActive: isActive !== undefined ? isActive : undefined,
      updatedAt: new Date(),
    }).where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, schoolId(req)))).returning({
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
      isActive: studentsTable.isActive,
    });
    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }
    res.json(student);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/students/:studentId", async (req: AuthRequest, res) => {
  const studentId = parseInt(req.params.studentId);
  try {
    await db.delete(studentsTable).where(
      and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, schoolId(req)))
    );
    res.json({ success: true, message: "Student deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Results upload (Excel)
router.post("/results/upload", upload.single("file"), async (req: AuthRequest, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  const errors: string[] = [];
  let inserted = 0;
  try {
    const wb = XLSX.read(req.file.buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws) as any[];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rollNumber = String(row.roll_number || row.rollNumber || row["Roll Number"] || "").trim();
      const subject = String(row.subject || row.Subject || "").trim();
      const marks = parseFloat(row.marks || row.Marks || 0);
      const maxMarks = parseFloat(row.max_marks || row.maxMarks || row["Max Marks"] || 100);

      if (!rollNumber || !subject) {
        errors.push(`Row ${i + 2}: missing roll_number or subject`);
        continue;
      }
      const [student] = await db.select().from(studentsTable).where(
        and(eq(studentsTable.rollNumber, rollNumber), eq(studentsTable.schoolId, schoolId(req)))
      );
      if (!student) {
        errors.push(`Row ${i + 2}: student with roll number '${rollNumber}' not found`);
        continue;
      }
      await db.insert(resultsTable).values({
        schoolId: schoolId(req),
        studentId: student.id,
        subject,
        marks,
        maxMarks,
        grade: String(row.grade || row.Grade || "").trim() || null,
        examType: String(row.exam_type || row.examType || row["Exam Type"] || "").trim() || null,
        examDate: String(row.exam_date || row.examDate || row["Exam Date"] || "").trim() || null,
        remarks: String(row.remarks || row.Remarks || "").trim() || null,
      });
      inserted++;
    }
    res.json({ success: true, inserted, errors });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to process file" });
  }
});

// List results
router.get("/results", async (req: AuthRequest, res) => {
  try {
    const results = await db.select({
      id: resultsTable.id,
      studentId: resultsTable.studentId,
      studentName: studentsTable.name,
      rollNumber: studentsTable.rollNumber,
      className: studentsTable.className,
      subject: resultsTable.subject,
      marks: resultsTable.marks,
      maxMarks: resultsTable.maxMarks,
      grade: resultsTable.grade,
      examType: resultsTable.examType,
      examDate: resultsTable.examDate,
      remarks: resultsTable.remarks,
    }).from(resultsTable)
      .leftJoin(studentsTable, eq(resultsTable.studentId, studentsTable.id))
      .where(eq(resultsTable.schoolId, schoolId(req)));
    res.json(results);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Gallery
router.get("/gallery", async (req: AuthRequest, res) => {
  try {
    const images = await db.select().from(galleryTable)
      .where(eq(galleryTable.schoolId, schoolId(req)))
      .orderBy(galleryTable.createdAt);
    res.json(images);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/gallery", async (req: AuthRequest, res) => {
  const { url, caption } = req.body;
  if (!url) {
    res.status(400).json({ error: "url required" });
    return;
  }
  try {
    const [image] = await db.insert(galleryTable).values({
      schoolId: schoolId(req),
      url,
      caption: caption || null,
    }).returning();
    res.status(201).json(image);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/gallery/:imageId", async (req: AuthRequest, res) => {
  const imageId = parseInt(req.params.imageId);
  try {
    await db.delete(galleryTable).where(
      and(eq(galleryTable.id, imageId), eq(galleryTable.schoolId, schoolId(req)))
    );
    res.json({ success: true, message: "Image deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
