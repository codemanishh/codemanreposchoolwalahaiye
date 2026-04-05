import { pgTable, serial, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const schoolsTable = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  tagline: text("tagline"),
  about: text("about"),
  mission: text("mission"),
  vision: text("vision"),
  logoUrl: text("logo_url"),
  heroImageUrl: text("hero_image_url"),
  yearsOfExperience: integer("years_of_experience"),
  principalMessage: text("principal_message"),
  founderMessage: text("founder_message"),
  presidentMessage: text("president_message"),
  feeStructure: text("fee_structure"),
  facilities: text("facilities"),
  mapUrl: text("map_url"),
  socialFacebook: text("social_facebook"),
  socialTwitter: text("social_twitter"),
  socialInstagram: text("social_instagram"),
  socialYoutube: text("social_youtube"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSchoolSchema = createInsertSchema(schoolsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type School = typeof schoolsTable.$inferSelect;
