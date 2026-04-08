import { Router } from "express";
import { db } from "@workspace/db";
import { superadminTable, schoolsTable, studentsTable, teachersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { signToken, comparePassword, authenticate, AuthRequest } from "../lib/auth.js";

const router = Router();

// Super admin login
router.post("/superadmin/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }
  try {
    const [admin] = await db.select().from(superadminTable).where(eq(superadminTable.username, username));
    if (!admin) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const valid = await comparePassword(password, admin.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = signToken({ id: admin.id, role: "superadmin" });
    res.json({ token, role: "superadmin", user: { id: admin.id, name: admin.name, username: admin.username } });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// School admin login
router.post("/school/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }
  try {
    const [school] = await db.select().from(schoolsTable).where(eq(schoolsTable.username, username));
    if (!school) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (!school.isActive) {
      res.status(401).json({ error: "School account is inactive" });
      return;
    }
    const valid = await comparePassword(password, school.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = signToken({ id: school.id, role: "school", schoolId: school.id, schoolSlug: school.slug });
    res.json({ token, role: "school", user: { id: school.id, name: school.name, username: school.username } });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Teacher login (schoolId + aadhaarNumber + 9-digit password)
router.post("/teacher/login", async (req, res) => {
  const { schoolId: schoolIdParam, aadhaarNumber, password } = req.body;
  if (!schoolIdParam || !aadhaarNumber || !password) {
    res.status(400).json({ error: "School ID, Aadhaar number, and password are required" });
    return;
  }

  const normalizedAadhaar = String(aadhaarNumber).trim();
  if (!/^\d{12}$/.test(normalizedAadhaar)) {
    res.status(400).json({ error: "Aadhaar number must be exactly 12 digits" });
    return;
  }

  const rawPassword = String(password).trim();
  if (!/^\d{9}$/.test(rawPassword)) {
    res.status(400).json({ error: "Password must be exactly 9 digits" });
    return;
  }

  try {
    const [school] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, schoolIdParam));
    if (!school || !school.isActive) {
      res.status(401).json({ error: "School not found" });
      return;
    }

    const [teacher] = await db
      .select()
      .from(teachersTable)
      .where(and(
        eq(teachersTable.schoolId, schoolIdParam),
        eq(teachersTable.aadhaarNumber, normalizedAadhaar),
        eq(teachersTable.isActive, true),
      ));

    if (!teacher) {
      res.status(401).json({ error: "Teacher not found" });
      return;
    }

    const valid = await comparePassword(rawPassword, teacher.dailyPassword);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = signToken({ id: teacher.id, role: "teacher", schoolId: school.id, schoolSlug: school.slug });
    res.json({
      token,
      role: "teacher",
      user: { id: teacher.id, name: teacher.name, schoolId: school.id, aadhaarNumber: teacher.aadhaarNumber },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Student login
router.post("/student/login", async (req, res) => {
  const { schoolSlug, rollNumber, aadhaarNumber, firstName, password } = req.body;
  if (!password) {
    res.status(400).json({ error: "Password required" });
    return;
  }

  const hasAadhaarFlow = Boolean(aadhaarNumber && firstName);
  const hasLegacyFlow = Boolean(schoolSlug && rollNumber);

  if (!hasAadhaarFlow && !hasLegacyFlow) {
    res.status(400).json({ error: "Provide either (aadhaarNumber + firstName + password) or (schoolSlug + rollNumber + password)" });
    return;
  }

  try {
    let student: (typeof studentsTable.$inferSelect) | undefined;
    let school: (typeof schoolsTable.$inferSelect) | undefined;

    if (hasAadhaarFlow) {
      const aadhaar = String(aadhaarNumber).trim();
      const first = String(firstName).trim().toLowerCase();
      if (!/^\d{12}$/.test(aadhaar)) {
        res.status(400).json({ error: "Aadhaar number must be exactly 12 digits" });
        return;
      }
      if (!first) {
        res.status(400).json({ error: "First name required" });
        return;
      }

      const found = await db.select().from(studentsTable).where(
        and(
          eq(studentsTable.aadhaarNumber, aadhaar),
          eq(studentsTable.isActive, true),
          sql`lower(split_part(trim(${studentsTable.name}), ' ', 1)) = ${first}`,
        ),
      );

      if (found.length === 0) {
        res.status(401).json({ error: "Student not found" });
        return;
      }

      if (found.length === 0) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const sortedMatches = [...found].sort((a, b) => {
        const classA = parseInt(a.className || "0", 10);
        const classB = parseInt(b.className || "0", 10);
        if (!Number.isNaN(classA) && !Number.isNaN(classB) && classA !== classB) {
          return classB - classA;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      const selected = sortedMatches[0];

      const [studentSchool] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, selected.schoolId));
      if (!studentSchool || !studentSchool.isActive) {
        res.status(401).json({ error: "School not found" });
        return;
      }

      student = selected;
      school = studentSchool;
    } else {
      const [legacySchool] = await db.select().from(schoolsTable).where(eq(schoolsTable.slug, schoolSlug));
      if (!legacySchool || !legacySchool.isActive) {
        res.status(401).json({ error: "School not found" });
        return;
      }

      const [legacyStudent] = await db.select().from(studentsTable).where(
        and(eq(studentsTable.schoolId, legacySchool.id), eq(studentsTable.rollNumber, rollNumber), eq(studentsTable.isActive, true)),
      );
      if (!legacyStudent) {
        res.status(401).json({ error: "Student not found" });
        return;
      }

      student = legacyStudent;
      school = legacySchool;
    }

    const valid = await comparePassword(password, student.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = signToken({ id: student.id, role: "student", schoolId: school.id, schoolSlug: school.slug });
    res.json({ token, role: "student", user: { id: student.id, name: student.name, username: student.rollNumber } });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get me
router.get("/me", authenticate, async (req: AuthRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({
    id: req.user.id,
    role: req.user.role,
    schoolId: req.user.schoolId ?? null,
    schoolSlug: req.user.schoolSlug ?? null,
    name: "User",
  });
});

// Logout
router.post("/logout", (_req, res) => {
  res.json({ success: true, message: "Logged out" });
});

export default router;
