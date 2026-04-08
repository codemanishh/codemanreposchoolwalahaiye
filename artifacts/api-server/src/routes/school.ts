import { Router } from "express";
import { db } from "@workspace/db";
import {
  schoolsTable,
  studentsTable,
  resultsTable,
  notificationsTable,
  galleryTable,
  topStudentsTable,
  curriculumClassesTable,
  curriculumSubjectsTable,
  teachersTable,
  subjectScheduleTable,
  schoolHolidaysTable,
} from "@workspace/db";
import { eq, and, isNull, sql } from "drizzle-orm";
import multer from "multer";
import * as XLSX from "xlsx";
import { authenticate, requireRole, hashPassword, AuthRequest } from "../lib/auth.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate, requireRole("school"));

function schoolId(req: AuthRequest): number {
  return req.user!.schoolId!;
}

function normalizePhoneDigits(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return null;
  return digits;
}

function normalizeAadhaar(value: unknown): string {
  return String(value ?? "").trim();
}

function parseRouteInt(value: string | string[] | undefined): number {
  const normalizedValue = Array.isArray(value) ? value[0] : value;
  return Number.parseInt(normalizedValue ?? "", 10);
}

function generateTeacherPassword(): string {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
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
    presidentMessage, feeStructure, facilities, mapUrl, socialFacebook, socialTwitter, socialInstagram, socialYoutube
  } = req.body;
  try {
    const [school] = await db.update(schoolsTable).set({
      tagline, about, mission, vision, email, phone, address, city, state,
      logoUrl, heroImageUrl, yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : null,
      principalMessage, founderMessage, presidentMessage, feeStructure, facilities,
      mapUrl, socialFacebook, socialTwitter, socialInstagram, socialYoutube,
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
  const notificationId = parseRouteInt(req.params.notificationId);
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

// Holidays
router.get("/holidays", async (req: AuthRequest, res) => {
  try {
    const holidays = await db
      .select()
      .from(schoolHolidaysTable)
      .where(and(eq(schoolHolidaysTable.schoolId, schoolId(req)), eq(schoolHolidaysTable.isActive, true)))
      .orderBy(schoolHolidaysTable.holidayDate);
    res.json(holidays);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/holidays", async (req: AuthRequest, res) => {
  const { title, holidayDate, description } = req.body;
  if (!title || !holidayDate) {
    res.status(400).json({ error: "title and holidayDate required" });
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(holidayDate))) {
    res.status(400).json({ error: "holidayDate must be in YYYY-MM-DD format" });
    return;
  }

  try {
    const [holiday] = await db.insert(schoolHolidaysTable).values({
      schoolId: schoolId(req),
      title: String(title).trim(),
      holidayDate: String(holidayDate),
      description: description ? String(description).trim() : null,
      isActive: true,
    }).returning();

    res.status(201).json(holiday);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/holidays/:holidayId", async (req: AuthRequest, res) => {
  const holidayId = parseRouteInt(req.params.holidayId);
  try {
    await db.delete(schoolHolidaysTable).where(
      and(eq(schoolHolidaysTable.id, holidayId), eq(schoolHolidaysTable.schoolId, schoolId(req))),
    );
    res.json({ success: true, message: "Holiday deleted" });
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
      isActive: studentsTable.isActive,
    }).from(studentsTable).where(eq(studentsTable.schoolId, schoolId(req))).orderBy(studentsTable.name);
    res.json(students);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/students", async (req: AuthRequest, res) => {
  const { name, aadhaarNumber, rollNumber, className, section, fatherName, motherName, phone, email, address, enrollmentDate } = req.body;
  if (!name || !rollNumber || !aadhaarNumber) {
    res.status(400).json({ error: "name, aadhaarNumber and rollNumber required" });
    return;
  }
  if (!/^\d{12}$/.test(String(aadhaarNumber).trim())) {
    res.status(400).json({ error: "aadhaarNumber must be exactly 12 digits" });
    return;
  }
  const normalizedPhone = normalizePhoneDigits(phone);
  if (normalizedPhone && normalizedPhone.length !== 10) {
    res.status(400).json({ error: "phone must be exactly 10 digits" });
    return;
  }

  try {
    const defaultHash = await hashPassword("111111");
    const [student] = await db.insert(studentsTable).values({
      schoolId: schoolId(req),
      name,
      aadhaarNumber: String(aadhaarNumber).trim(),
      rollNumber,
      passwordHash: defaultHash,
      className: className || null,
      section: section || null,
      fatherName: fatherName || null,
      motherName: motherName || null,
      phone: normalizedPhone,
      email: email || null,
      address: address || null,
      enrollmentDate: enrollmentDate || null,
    }).returning({
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
  const studentId = parseRouteInt(req.params.studentId);
  const { name, aadhaarNumber, className, section, fatherName, motherName, phone, email, address, enrollmentDate, isActive } = req.body;
  if (aadhaarNumber !== undefined && aadhaarNumber !== null && String(aadhaarNumber).trim() !== "" && !/^\d{12}$/.test(String(aadhaarNumber).trim())) {
    res.status(400).json({ error: "aadhaarNumber must be exactly 12 digits" });
    return;
  }
  const normalizedPhone = normalizePhoneDigits(phone);
  if (normalizedPhone && normalizedPhone.length !== 10) {
    res.status(400).json({ error: "phone must be exactly 10 digits" });
    return;
  }

  try {
    const [student] = await db.update(studentsTable).set({
      name,
      aadhaarNumber: aadhaarNumber !== undefined ? String(aadhaarNumber).trim() || null : undefined,
      className,
      section,
      fatherName,
      motherName,
      phone: phone !== undefined ? normalizedPhone : undefined,
      email,
      address,
      enrollmentDate,
      isActive: isActive !== undefined ? isActive : undefined,
      updatedAt: new Date(),
    }).where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, schoolId(req)))).returning({
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
  const studentId = parseRouteInt(req.params.studentId);
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

// Reset student password to default 111111
router.post("/students/:studentId/reset-password", async (req: AuthRequest, res) => {
  const studentId = parseRouteInt(req.params.studentId);
  try {
    const defaultHash = await hashPassword("111111");
    const [student] = await db.update(studentsTable).set({
      passwordHash: defaultHash,
      hasChangedPassword: false,
      updatedAt: new Date(),
    }).where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, schoolId(req)))).returning({ id: studentsTable.id });
    if (!student) { res.status(404).json({ error: "Student not found" }); return; }
    res.json({ success: true, message: "Password reset to 111111" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Set custom student password
router.put("/students/:studentId/password", async (req: AuthRequest, res) => {
  const studentId = parseRouteInt(req.params.studentId);
  const newPassword = String(req.body?.newPassword || "").trim();

  if (newPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  try {
    const newHash = await hashPassword(newPassword);
    const [student] = await db.update(studentsTable).set({
      passwordHash: newHash,
      hasChangedPassword: true,
      updatedAt: new Date(),
    }).where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, schoolId(req)))).returning({ id: studentsTable.id });

    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Bulk upload students from Excel
router.post("/students/upload", upload.single("file"), async (req: AuthRequest, res) => {
  if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
  const errors: string[] = [];
  let inserted = 0;
  try {
    const wb = XLSX.read(req.file.buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws) as any[];
    const defaultHash = await hashPassword("111111");
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = String(row.name || row.Name || row["Student Name"] || "").trim();
      const aadhaarNumber = String(row.aadhaar_number || row.aadhaarNumber || row["Aadhaar Number"] || row["Aadhaar"] || "").trim();
      const rollNumber = String(row.roll_number || row.rollNumber || row["Roll Number"] || "").trim();
      if (!name || !rollNumber || !aadhaarNumber) { errors.push(`Row ${i + 2}: missing name or roll_number or aadhaar_number`); continue; }
      if (!/^\d{12}$/.test(aadhaarNumber)) { errors.push(`Row ${i + 2}: aadhaar_number must be exactly 12 digits`); continue; }
      const phoneDigits = normalizePhoneDigits(row.phone || row.Phone || "");
      if (phoneDigits && phoneDigits.length !== 10) { errors.push(`Row ${i + 2}: phone must be exactly 10 digits`); continue; }
      try {
        await db.insert(studentsTable).values({
          schoolId: schoolId(req),
          name,
          aadhaarNumber,
          rollNumber,
          passwordHash: defaultHash,
          className: String(row.class_name || row.className || row["Class"] || "").trim() || null,
          section: String(row.section || row.Section || "").trim() || null,
          fatherName: String(row.father_name || row.fatherName || row["Father Name"] || "").trim() || null,
          phone: phoneDigits,
        });
        inserted++;
      } catch (e: any) {
        if (e.code === "23505") { errors.push(`Row ${i + 2}: roll number '${rollNumber}' or aadhaar '${aadhaarNumber}' already exists`); }
        else { errors.push(`Row ${i + 2}: ${e.message}`); }
      }
    }
    res.json({ success: true, inserted, errors });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to process file" });
  }
});

// Delete a single result
router.delete("/results/:resultId", async (req: AuthRequest, res) => {
  const resultId = parseRouteInt(req.params.resultId);
  try {
    await db.delete(resultsTable).where(
      and(eq(resultsTable.id, resultId), eq(resultsTable.schoolId, schoolId(req)))
    );
    res.json({ success: true });
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
  let skipped = 0;
  try {
    const wb = XLSX.read(req.file.buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws) as any[];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const aadhaarNumber = String(row.aadhaar_number || row.aadhaarNumber || row["Aadhaar Number"] || row["Aadhaar"] || "").trim();
      const firstName = String(row.first_name || row.firstName || row["First Name"] || "").trim().toLowerCase();
      const classNameFromFile = String(row.class_name || row.className || row["Class"] || "").trim();
      const subject = String(row.subject || row.Subject || "").trim();
      const marks = parseFloat(row.marks || row.Marks || 0);
      const maxMarks = parseFloat(row.max_marks || row.maxMarks || row["Max Marks"] || 100);

      if (!aadhaarNumber || !firstName || !subject) {
        errors.push(`Row ${i + 2}: missing aadhaar_number or first_name or subject`);
        continue;
      }
      if (!/^\d{12}$/.test(aadhaarNumber)) {
        errors.push(`Row ${i + 2}: aadhaar_number must be exactly 12 digits`);
        continue;
      }

      const students = await db.select().from(studentsTable).where(
        and(
          eq(studentsTable.aadhaarNumber, aadhaarNumber),
          eq(studentsTable.schoolId, schoolId(req)),
          eq(studentsTable.isActive, true),
          sql`lower(split_part(trim(${studentsTable.name}), ' ', 1)) = ${firstName}`,
        )
      );

      if (students.length === 0) {
        errors.push(`Row ${i + 2}: student with aadhaar '${aadhaarNumber}' not found`);
        continue;
      }

      if (students.length === 0) {
        errors.push(`Row ${i + 2}: first_name does not match student record for aadhaar '${aadhaarNumber}'`);
        continue;
      }

      const classMatches = classNameFromFile
        ? students.filter((s) => String(s.className || "").trim() === classNameFromFile)
        : students;

      if (classMatches.length === 0) {
        errors.push(`Row ${i + 2}: class '${classNameFromFile}' not found for this aadhaar + first_name`);
        continue;
      }

      if (!classNameFromFile && classMatches.length > 1) {
        errors.push(`Row ${i + 2}: multiple class records found; provide class_name to disambiguate`);
        continue;
      }

      const student = classMatches[0];
      const className = classNameFromFile || String(student.className || "").trim() || null;

      const examType = String(row.exam_type || row.examType || row["Exam Type"] || "").trim() || null;
      const examDate = String(row.exam_date || row.examDate || row["Exam Date"] || "").trim() || null;
      const remarks = String(row.remarks || row.Remarks || "").trim() || null;
      const grade = String(row.grade || row.Grade || "").trim() || null;

      // Idempotent import: if same row is already present, skip instead of erroring.
      const existing = await db.select({ id: resultsTable.id }).from(resultsTable).where(and(
        eq(resultsTable.schoolId, schoolId(req)),
        eq(resultsTable.aadhaarNumber, aadhaarNumber),
        eq(resultsTable.firstName, firstName),
        className === null ? isNull(resultsTable.className) : eq(resultsTable.className, className),
        eq(resultsTable.subject, subject),
        eq(resultsTable.marks, marks),
        eq(resultsTable.maxMarks, maxMarks),
        examType === null ? isNull(resultsTable.examType) : eq(resultsTable.examType, examType),
        examDate === null ? isNull(resultsTable.examDate) : eq(resultsTable.examDate, examDate),
      ));

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      await db.insert(resultsTable).values({
        schoolId: schoolId(req),
        studentId: student.id,
        aadhaarNumber,
        firstName,
        className,
        subject,
        marks,
        maxMarks,
        grade,
        examType,
        examDate,
        remarks,
      });
      inserted++;
    }
    res.json({ success: true, inserted, skipped, errors });
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
  const imageId = parseRouteInt(req.params.imageId);
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

// Top Students
router.get("/top-students", async (req: AuthRequest, res) => {
  try {
    const students = await db.select().from(topStudentsTable)
      .where(eq(topStudentsTable.schoolId, schoolId(req)))
      .orderBy(topStudentsTable.displayOrder, topStudentsTable.createdAt);
    res.json(students);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/top-students", async (req: AuthRequest, res) => {
  const { name, className, percentage, message, photoUrl, displayOrder } = req.body;
  if (!name || !className || !percentage) {
    res.status(400).json({ error: "name, className, and percentage are required" });
    return;
  }
  try {
    const [student] = await db.insert(topStudentsTable).values({
      schoolId: schoolId(req),
      name,
      className,
      percentage,
      message: message || null,
      photoUrl: photoUrl || null,
      displayOrder: displayOrder ?? 0,
    }).returning();
    res.status(201).json(student);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/top-students/:studentId", async (req: AuthRequest, res) => {
  const studentId = parseRouteInt(req.params.studentId);
  const { name, className, percentage, message, photoUrl, displayOrder } = req.body;
  try {
    const [student] = await db.update(topStudentsTable).set({
      name,
      className,
      percentage,
      message: message || null,
      photoUrl: photoUrl || null,
      displayOrder: displayOrder ?? 0,
    }).where(and(eq(topStudentsTable.id, studentId), eq(topStudentsTable.schoolId, schoolId(req)))).returning();
    if (!student) {
      res.status(404).json({ error: "Top student not found" });
      return;
    }
    res.json(student);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/top-students/:studentId", async (req: AuthRequest, res) => {
  const studentId = parseRouteInt(req.params.studentId);
  try {
    await db.delete(topStudentsTable).where(
      and(eq(topStudentsTable.id, studentId), eq(topStudentsTable.schoolId, schoolId(req)))
    );
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Curriculum
router.get("/curriculum", async (req: AuthRequest, res) => {
  try {
    const classes = await db.select().from(curriculumClassesTable)
      .where(eq(curriculumClassesTable.schoolId, schoolId(req)))
      .orderBy(curriculumClassesTable.displayOrder, curriculumClassesTable.createdAt);

    const classIds = classes.map((c) => c.id);
    const subjects = classIds.length > 0
      ? await db.select().from(curriculumSubjectsTable)
          .where(eq(curriculumSubjectsTable.classId, classIds[0]))
      : [];

    const otherSubjects = classIds.length > 1
      ? await Promise.all(classIds.slice(1).map((id) =>
          db.select().from(curriculumSubjectsTable).where(eq(curriculumSubjectsTable.classId, id))
        ))
      : [];

    const allSubjects = [...subjects, ...otherSubjects.flat()]
      .sort((a, b) => (a.displayOrder - b.displayOrder) || (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));

    const byClass = new Map<number, typeof allSubjects>();
    for (const subject of allSubjects) {
      const existing = byClass.get(subject.classId) || [];
      existing.push(subject);
      byClass.set(subject.classId, existing);
    }

    res.json(classes.map((c) => ({ ...c, subjects: byClass.get(c.id) || [] })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/curriculum/generate", async (req: AuthRequest, res) => {
  const rawCount = Number(req.body?.count);
  const count = Number.isFinite(rawCount) ? Math.floor(rawCount) : 0;
  if (count < 1 || count > 20) {
    res.status(400).json({ error: "count must be between 1 and 20" });
    return;
  }

  try {
    await db.delete(curriculumClassesTable).where(eq(curriculumClassesTable.schoolId, schoolId(req)));

    const created = await db.insert(curriculumClassesTable).values(
      Array.from({ length: count }, (_, i) => ({
        schoolId: schoolId(req),
        className: `Class ${i + 1}`,
        displayOrder: i + 1,
      }))
    ).returning();

    res.status(201).json(created);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/curriculum/classes", async (req: AuthRequest, res) => {
  const rawClassNo = Number(req.body?.classNo);
  const classNo = Number.isFinite(rawClassNo) ? Math.floor(rawClassNo) : 0;
  if (classNo < 1 || classNo > 20) {
    res.status(400).json({ error: "classNo must be between 1 and 20" });
    return;
  }

  try {
    const existing = await db.select().from(curriculumClassesTable).where(eq(curriculumClassesTable.schoolId, schoolId(req)));
    if (existing.some((c) => c.displayOrder === classNo)) {
      res.status(400).json({ error: `Class ${classNo} already exists` });
      return;
    }

    const [created] = await db.insert(curriculumClassesTable).values({
      schoolId: schoolId(req),
      className: `Class ${classNo}`,
      displayOrder: classNo,
    }).returning();

    res.status(201).json(created);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/curriculum/classes/:classId", async (req: AuthRequest, res) => {
  const classId = parseRouteInt(req.params.classId);
  const { className, displayOrder } = req.body;

  try {
    const [classItem] = await db.update(curriculumClassesTable).set({
      className,
      displayOrder: displayOrder ?? 0,
      updatedAt: new Date(),
    }).where(and(
      eq(curriculumClassesTable.id, classId),
      eq(curriculumClassesTable.schoolId, schoolId(req))
    )).returning();

    if (!classItem) {
      res.status(404).json({ error: "Class not found" });
      return;
    }

    res.json(classItem);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/curriculum/classes/:classId/subjects", async (req: AuthRequest, res) => {
  const classId = parseRouteInt(req.params.classId);
  const name = String(req.body?.subjectName || "").trim();
  if (!name) {
    res.status(400).json({ error: "subjectName is required" });
    return;
  }

  try {
    const [classItem] = await db.select().from(curriculumClassesTable).where(and(
      eq(curriculumClassesTable.id, classId),
      eq(curriculumClassesTable.schoolId, schoolId(req))
    ));

    if (!classItem) {
      res.status(404).json({ error: "Class not found" });
      return;
    }

    const existing = await db.select().from(curriculumSubjectsTable).where(eq(curriculumSubjectsTable.classId, classId));
    if (existing.some((s) => s.subjectName.trim().toLowerCase() === name.toLowerCase())) {
      res.status(400).json({ error: `"${name}" already exists in this class` });
      return;
    }

    const [subject] = await db.insert(curriculumSubjectsTable).values({
      classId,
      subjectName: name,
      displayOrder: existing.length,
    }).returning();

    res.status(201).json(subject);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/curriculum/subjects/:subjectId", async (req: AuthRequest, res) => {
  const subjectId = parseRouteInt(req.params.subjectId);
  const name = String(req.body?.subjectName || "").trim();
  if (!name) {
    res.status(400).json({ error: "subjectName is required" });
    return;
  }

  try {
    const [subject] = await db.select().from(curriculumSubjectsTable).where(eq(curriculumSubjectsTable.id, subjectId));
    if (!subject) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }

    const [classItem] = await db.select().from(curriculumClassesTable).where(and(
      eq(curriculumClassesTable.id, subject.classId),
      eq(curriculumClassesTable.schoolId, schoolId(req))
    ));
    if (!classItem) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }

    const [updated] = await db.update(curriculumSubjectsTable).set({ subjectName: name })
      .where(eq(curriculumSubjectsTable.id, subjectId)).returning();
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/curriculum/subjects/:subjectId", async (req: AuthRequest, res) => {
  const subjectId = parseRouteInt(req.params.subjectId);
  try {
    const [subject] = await db.select().from(curriculumSubjectsTable).where(eq(curriculumSubjectsTable.id, subjectId));
    if (!subject) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }
    const [classItem] = await db.select().from(curriculumClassesTable).where(and(
      eq(curriculumClassesTable.id, subject.classId),
      eq(curriculumClassesTable.schoolId, schoolId(req))
    ));
    if (!classItem) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }

    await db.delete(curriculumSubjectsTable).where(eq(curriculumSubjectsTable.id, subjectId));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/curriculum/classes/:classId", async (req: AuthRequest, res) => {
  const classId = parseRouteInt(req.params.classId);
  try {
    await db.delete(curriculumClassesTable).where(and(
      eq(curriculumClassesTable.id, classId),
      eq(curriculumClassesTable.schoolId, schoolId(req))
    ));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ========== TEACHER MANAGEMENT ==========

// Get all teachers
router.get("/teachers", async (req: AuthRequest, res) => {
  try {
    const teachers = await db.select({
      id: teachersTable.id,
      name: teachersTable.name,
      aadhaarNumber: teachersTable.aadhaarNumber,
      email: teachersTable.email,
      phone: teachersTable.phone,
      isActive: teachersTable.isActive,
      createdAt: teachersTable.createdAt,
    }).from(teachersTable).where(eq(teachersTable.schoolId, schoolId(req)));
    res.json(teachers);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create teacher
router.post("/teachers", async (req: AuthRequest, res) => {
  const { name, aadhaarNumber, email, phone, password } = req.body;
  if (!name || !aadhaarNumber) {
    res.status(400).json({ error: "Teacher name and aadhaarNumber are required" });
    return;
  }

  const normalizedAadhaar = normalizeAadhaar(aadhaarNumber);
  if (!/^\d{12}$/.test(normalizedAadhaar)) {
    res.status(400).json({ error: "aadhaarNumber must be exactly 12 digits" });
    return;
  }

  const plainPassword = password ? String(password).trim() : generateTeacherPassword();
  if (!/^\d{9}$/.test(plainPassword)) {
    res.status(400).json({ error: "Teacher password must be exactly 9 digits" });
    return;
  }
  
  try {
    const hashedPassword = await hashPassword(plainPassword);

    const [teacher] = await db.insert(teachersTable).values({
      schoolId: schoolId(req),
      name,
      aadhaarNumber: normalizedAadhaar,
      email: email || null,
      phone: phone || null,
      dailyPassword: hashedPassword,
    }).returning();

    res.status(201).json({
      ...teacher,
      plainPassword, // Return plain password once at creation
    });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(400).json({ error: "Teacher with this Aadhaar number already exists in this school" });
      return;
    }
    req.log.error(err);
    res.status(500).json({ error: "Failed to create teacher" });
  }
});

// Update teacher
router.put("/teachers/:teacherId", async (req: AuthRequest, res) => {
  const teacherId = parseRouteInt(req.params.teacherId);
  const { name, aadhaarNumber, email, phone, isActive } = req.body;

  if (aadhaarNumber !== undefined) {
    const normalizedAadhaar = normalizeAadhaar(aadhaarNumber);
    if (!/^\d{12}$/.test(normalizedAadhaar)) {
      res.status(400).json({ error: "aadhaarNumber must be exactly 12 digits" });
      return;
    }
  }
  
  try {
    const [teacher] = await db.update(teachersTable).set({
      name: name !== undefined ? name : undefined,
      aadhaarNumber: aadhaarNumber !== undefined ? normalizeAadhaar(aadhaarNumber) : undefined,
      email: email !== undefined ? email : undefined,
      phone: phone !== undefined ? phone : undefined,
      isActive: isActive !== undefined ? isActive : undefined,
      updatedAt: new Date(),
    }).where(and(
      eq(teachersTable.id, teacherId),
      eq(teachersTable.schoolId, schoolId(req))
    )).returning();

    if (!teacher) {
      res.status(404).json({ error: "Teacher not found" });
      return;
    }

    res.json(teacher);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(400).json({ error: "Teacher with this Aadhaar number already exists in this school" });
      return;
    }
    req.log.error(err);
    res.status(500).json({ error: "Failed to update teacher" });
  }
});

// Refresh teacher password
router.post("/teachers/:teacherId/refresh-password", async (req: AuthRequest, res) => {
  const teacherId = parseRouteInt(req.params.teacherId);
  
  try {
    const newPassword = generateTeacherPassword();
    const hashedPassword = await hashPassword(newPassword);

    const [teacher] = await db.update(teachersTable).set({
      dailyPassword: hashedPassword,
      passwordRefreshDate: new Date(),
    }).where(and(
      eq(teachersTable.id, teacherId),
      eq(teachersTable.schoolId, schoolId(req))
    )).returning();

    if (!teacher) {
      res.status(404).json({ error: "Teacher not found" });
      return;
    }

    res.json({
      id: teacher.id,
      name: teacher.name,
      aadhaarNumber: teacher.aadhaarNumber,
      plainPassword: newPassword, // Return plain password once
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to refresh password" });
  }
});

// Delete teacher
router.delete("/teachers/:teacherId", async (req: AuthRequest, res) => {
  const teacherId = parseRouteInt(req.params.teacherId);
  try {
    await db.delete(teachersTable).where(and(
      eq(teachersTable.id, teacherId),
      eq(teachersTable.schoolId, schoolId(req))
    ));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete teacher" });
  }
});

// ========== SUBJECT SCHEDULE MANAGEMENT ==========

// Create subject schedule for a class/day
router.post("/schedule", async (req: AuthRequest, res) => {
  const { className, subject, dayOfWeek } = req.body;
  
  if (!className || !subject || dayOfWeek === undefined) {
    res.status(400).json({ error: "className, subject, and dayOfWeek required" });
    return;
  }

  if (dayOfWeek < 0 || dayOfWeek > 6) {
    res.status(400).json({ error: "dayOfWeek must be 0-6" });
    return;
  }

  try {
   const [schedule] = await db.insert(subjectScheduleTable).values({
      schoolId: schoolId(req),
      className,
      subject,
      dayOfWeek,
    }).returning();

    res.status(201).json(schedule);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create schedule" });
  }
});

// Delete subject schedule
router.delete("/schedule/:scheduleId", async (req: AuthRequest, res) => {
  const scheduleId = parseRouteInt(req.params.scheduleId);
  try {
    await db.delete(subjectScheduleTable).where(and(
      eq(subjectScheduleTable.id, scheduleId),
      eq(subjectScheduleTable.schoolId, schoolId(req))
    ));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete schedule" });
  }
});

// Get school session dates (start / end of academic year)
router.get("/session", async (req: AuthRequest, res) => {
  try {
    const [school] = await db
      .select({ sessionStartDate: schoolsTable.sessionStartDate, sessionEndDate: schoolsTable.sessionEndDate })
      .from(schoolsTable)
      .where(eq(schoolsTable.id, schoolId(req)));
    res.json({ sessionStartDate: school?.sessionStartDate ?? null, sessionEndDate: school?.sessionEndDate ?? null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update school session dates
router.put("/session", async (req: AuthRequest, res) => {
  const { sessionStartDate, sessionEndDate } = req.body;
  try {
    await db
      .update(schoolsTable)
      .set({ sessionStartDate: sessionStartDate ?? null, sessionEndDate: sessionEndDate ?? null, updatedAt: new Date() })
      .where(eq(schoolsTable.id, schoolId(req)));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update session dates" });
  }
});

export default router;
