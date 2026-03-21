import { Router } from "express";
import { db } from "@workspace/db";
import { schoolsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, requireRole, AuthRequest } from "../lib/auth.js";
import { hashPassword } from "../lib/auth.js";

const router = Router();

router.use(authenticate, requireRole("superadmin"));

// List all schools
router.get("/schools", async (req, res) => {
  try {
    const schools = await db.select({
      id: schoolsTable.id,
      name: schoolsTable.name,
      slug: schoolsTable.slug,
      username: schoolsTable.username,
      email: schoolsTable.email,
      phone: schoolsTable.phone,
      address: schoolsTable.address,
      city: schoolsTable.city,
      state: schoolsTable.state,
      isActive: schoolsTable.isActive,
      createdAt: schoolsTable.createdAt,
    }).from(schoolsTable).orderBy(schoolsTable.createdAt);
    res.json(schools);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create school
router.post("/schools", async (req, res) => {
  const { name, slug, username, password, email, phone, address, city, state } = req.body;
  if (!name || !slug || !username || !password) {
    res.status(400).json({ error: "name, slug, username, password are required" });
    return;
  }
  try {
    const passwordHash = await hashPassword(password);
    const [school] = await db.insert(schoolsTable).values({
      name,
      slug,
      username,
      passwordHash,
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      state: state || null,
    }).returning({
      id: schoolsTable.id,
      name: schoolsTable.name,
      slug: schoolsTable.slug,
      username: schoolsTable.username,
      email: schoolsTable.email,
      phone: schoolsTable.phone,
      address: schoolsTable.address,
      city: schoolsTable.city,
      state: schoolsTable.state,
      isActive: schoolsTable.isActive,
      createdAt: schoolsTable.createdAt,
    });
    res.status(201).json(school);
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(400).json({ error: "School with this slug or username already exists" });
      return;
    }
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get school by id
router.get("/schools/:schoolId", async (req, res) => {
  const schoolId = parseInt(req.params.schoolId);
  try {
    const [school] = await db.select({
      id: schoolsTable.id,
      name: schoolsTable.name,
      slug: schoolsTable.slug,
      username: schoolsTable.username,
      email: schoolsTable.email,
      phone: schoolsTable.phone,
      address: schoolsTable.address,
      city: schoolsTable.city,
      state: schoolsTable.state,
      isActive: schoolsTable.isActive,
      createdAt: schoolsTable.createdAt,
    }).from(schoolsTable).where(eq(schoolsTable.id, schoolId));
    if (!school) {
      res.status(404).json({ error: "School not found" });
      return;
    }
    res.json(school);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update school
router.put("/schools/:schoolId", async (req, res) => {
  const schoolId = parseInt(req.params.schoolId);
  const { name, email, phone, address, city, state, isActive, password } = req.body;
  try {
    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) updateData.passwordHash = await hashPassword(password);

    const [school] = await db.update(schoolsTable).set(updateData).where(eq(schoolsTable.id, schoolId)).returning({
      id: schoolsTable.id,
      name: schoolsTable.name,
      slug: schoolsTable.slug,
      username: schoolsTable.username,
      email: schoolsTable.email,
      phone: schoolsTable.phone,
      address: schoolsTable.address,
      city: schoolsTable.city,
      state: schoolsTable.state,
      isActive: schoolsTable.isActive,
      createdAt: schoolsTable.createdAt,
    });
    if (!school) {
      res.status(404).json({ error: "School not found" });
      return;
    }
    res.json(school);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete school
router.delete("/schools/:schoolId", async (req, res) => {
  const schoolId = parseInt(req.params.schoolId);
  try {
    await db.delete(schoolsTable).where(eq(schoolsTable.id, schoolId));
    res.json({ success: true, message: "School deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
