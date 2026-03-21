import { Router } from "express";
import { db } from "@workspace/db";
import { schoolsTable, notificationsTable, galleryTable } from "@workspace/db";
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

export default router;
