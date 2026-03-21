import { Router } from "express";
import { db } from "@workspace/db";
import { superadminTable, schoolsTable, studentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
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

// Student login
router.post("/student/login", async (req, res) => {
  const { schoolSlug, rollNumber, password } = req.body;
  if (!schoolSlug || !rollNumber || !password) {
    res.status(400).json({ error: "School slug, roll number and password required" });
    return;
  }
  try {
    const [school] = await db.select().from(schoolsTable).where(eq(schoolsTable.slug, schoolSlug));
    if (!school || !school.isActive) {
      res.status(401).json({ error: "School not found" });
      return;
    }
    const [student] = await db.select().from(studentsTable).where(
      and(eq(studentsTable.schoolId, school.id), eq(studentsTable.rollNumber, rollNumber), eq(studentsTable.isActive, true))
    );
    if (!student) {
      res.status(401).json({ error: "Student not found" });
      return;
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
