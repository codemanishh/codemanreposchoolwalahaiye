import { Router } from "express";
import { db } from "@workspace/db";
import {
  schoolsTable,
  notificationsTable,
  galleryTable,
  topStudentsTable,
  curriculumClassesTable,
  curriculumSubjectsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

// List all public schools
router.get("/schools", async (req, res) => {
  try {
    const schools = await db.select({
      id: schoolsTable.id,
      name: schoolsTable.name,
      slug: schoolsTable.slug,
      tagline: schoolsTable.tagline,
      city: schoolsTable.city,
      state: schoolsTable.state,
      logoUrl: schoolsTable.logoUrl,
    }).from(schoolsTable).where(eq(schoolsTable.isActive, true)).orderBy(schoolsTable.name);
    res.json(schools);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get public school by slug
router.get("/schools/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    const [school] = await db.select({
      id: schoolsTable.id,
      name: schoolsTable.name,
      slug: schoolsTable.slug,
      tagline: schoolsTable.tagline,
      about: schoolsTable.about,
      mission: schoolsTable.mission,
      vision: schoolsTable.vision,
      email: schoolsTable.email,
      phone: schoolsTable.phone,
      address: schoolsTable.address,
      city: schoolsTable.city,
      state: schoolsTable.state,
      logoUrl: schoolsTable.logoUrl,
      heroImageUrl: schoolsTable.heroImageUrl,
      yearsOfExperience: schoolsTable.yearsOfExperience,
      principalMessage: schoolsTable.principalMessage,
      founderMessage: schoolsTable.founderMessage,
      presidentMessage: schoolsTable.presidentMessage,
      feeStructure: schoolsTable.feeStructure,
      facilities: schoolsTable.facilities,
      mapUrl: schoolsTable.mapUrl,
      socialFacebook: schoolsTable.socialFacebook,
      socialTwitter: schoolsTable.socialTwitter,
      socialInstagram: schoolsTable.socialInstagram,
      socialYoutube: schoolsTable.socialYoutube,
    }).from(schoolsTable).where(and(eq(schoolsTable.slug, slug), eq(schoolsTable.isActive, true)));
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

// Get public notifications for a school
router.get("/schools/:slug/notifications", async (req, res) => {
  const { slug } = req.params;
  try {
    const [school] = await db.select({ id: schoolsTable.id }).from(schoolsTable)
      .where(and(eq(schoolsTable.slug, slug), eq(schoolsTable.isActive, true)));
    if (!school) {
      res.status(404).json({ error: "School not found" });
      return;
    }
    const notifications = await db.select().from(notificationsTable)
      .where(and(eq(notificationsTable.schoolId, school.id), eq(notificationsTable.isActive, true)))
      .orderBy(notificationsTable.createdAt);
    res.json(notifications);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get public gallery for a school
router.get("/schools/:slug/gallery", async (req, res) => {
  const { slug } = req.params;
  try {
    const [school] = await db.select({ id: schoolsTable.id }).from(schoolsTable)
      .where(and(eq(schoolsTable.slug, slug), eq(schoolsTable.isActive, true)));
    if (!school) {
      res.status(404).json({ error: "School not found" });
      return;
    }
    const images = await db.select().from(galleryTable)
      .where(eq(galleryTable.schoolId, school.id))
      .orderBy(galleryTable.createdAt);
    res.json(images);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get public top students for a school
router.get("/schools/:slug/top-students", async (req, res) => {
  const { slug } = req.params;
  try {
    const [school] = await db.select({ id: schoolsTable.id }).from(schoolsTable)
      .where(and(eq(schoolsTable.slug, slug), eq(schoolsTable.isActive, true)));
    if (!school) {
      res.status(404).json({ error: "School not found" });
      return;
    }
    const students = await db.select().from(topStudentsTable)
      .where(eq(topStudentsTable.schoolId, school.id))
      .orderBy(topStudentsTable.displayOrder, topStudentsTable.createdAt);
    res.json(students);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get public curriculum for a school
router.get("/schools/:slug/curriculum", async (req, res) => {
  const { slug } = req.params;
  try {
    const [school] = await db.select({ id: schoolsTable.id }).from(schoolsTable)
      .where(and(eq(schoolsTable.slug, slug), eq(schoolsTable.isActive, true)));
    if (!school) {
      res.status(404).json({ error: "School not found" });
      return;
    }

    const classes = await db.select().from(curriculumClassesTable)
      .where(eq(curriculumClassesTable.schoolId, school.id))
      .orderBy(curriculumClassesTable.displayOrder, curriculumClassesTable.createdAt);

    const classIds = classes.map((c) => c.id);
    const subjects = classIds.length > 0
      ? await Promise.all(classIds.map((id) => db.select().from(curriculumSubjectsTable).where(eq(curriculumSubjectsTable.classId, id))))
      : [];

    const flattened = subjects.flat().sort((a, b) => (a.displayOrder - b.displayOrder) || (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    const byClass = new Map<number, typeof flattened>();

    for (const subject of flattened) {
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

export default router;
