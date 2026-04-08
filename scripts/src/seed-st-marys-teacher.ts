import { db } from "@workspace/db";
import { schoolsTable, teachersTable } from "@workspace/db";
import bcrypt from "bcryptjs";

async function main() {
  const schoolSlug = "st-marys-convent";
  const aadhaarNumber = "999988887777";
  const teacherName = "Sr. Mary Grace";
  const plainPassword = "123456789";

  const schools = await db.select().from(schoolsTable);
  const school = schools.find((s) => s.slug === schoolSlug);
  if (!school) {
    console.log(`School '${schoolSlug}' not found.`);
    return;
  }

  const teachers = await db.select({ id: teachersTable.id, schoolId: teachersTable.schoolId, aadhaarNumber: teachersTable.aadhaarNumber }).from(teachersTable);
  const existing = teachers.find((t) => t.schoolId === school.id && t.aadhaarNumber === aadhaarNumber);

  if (existing) {
    console.log("Dummy teacher already exists for St. Mary's Convent.");
    console.log(`Login: schoolId=${school.id}, aadhaar=${aadhaarNumber}, password=${plainPassword}`);
    return;
  }

  const passwordHash = await bcrypt.hash(plainPassword, 10);

  await db.insert(teachersTable).values({
    schoolId: school.id,
    name: teacherName,
    aadhaarNumber,
    email: "mary.grace@stmarys.edu.in",
    phone: "9876543210",
    dailyPassword: passwordHash,
    isActive: true,
  });

  console.log("✅ Dummy teacher created for St. Mary's Convent.");
  console.log(`Login: schoolId=${school.id}, aadhaar=${aadhaarNumber}, password=${plainPassword}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
