import { db } from "@workspace/db";
import { superadminTable } from "@workspace/db";
import bcrypt from "bcryptjs";

async function seed() {
  const passwordHash = await bcrypt.hash("admin123", 10);
  
  try {
    await db.insert(superadminTable).values({
      username: "superadmin",
      passwordHash,
      name: "Super Admin",
    }).onConflictDoNothing();
    console.log("Superadmin seeded: username=superadmin, password=admin123");
  } catch (err) {
    console.error("Error seeding superadmin:", err);
  }
  process.exit(0);
}

seed();
