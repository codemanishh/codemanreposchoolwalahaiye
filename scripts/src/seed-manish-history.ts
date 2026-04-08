import { pool } from "@workspace/db";
import bcrypt from "bcryptjs";

const AADHAAR = "846481726232";
const NAME = "MANISH KUMAR";
const PHONE = "9876543210";

const classConfigs = [
  { className: "5", rollNumber: "MK-501", year: "2023-03-15", marks: [82, 91, 86, 79, 88] },
  { className: "6", rollNumber: "MK-601", year: "2024-03-15", marks: [84, 89, 90, 83, 87] },
  { className: "7", rollNumber: "MK-701", year: "2025-03-15", marks: [88, 92, 91, 85, 90] },
  { className: "8", rollNumber: "MK-801", year: "2026-03-15", marks: [90, 94, 93, 89, 92] },
] as const;

const subjects = ["English", "Mathematics", "Science", "Social Studies", "Hindi"];

function gradeFor(marks: number) {
  if (marks >= 90) return "A+";
  if (marks >= 80) return "A";
  if (marks >= 70) return "B+";
  if (marks >= 60) return "B";
  if (marks >= 50) return "C";
  return "D";
}

async function main() {
  const defaultPasswordHash = await bcrypt.hash("111111", 10);

  const schoolRes = await pool.query("select id from schools where slug = $1 limit 1", ["sunrise-academy"]);
  const sunrise = schoolRes.rows[0] as { id: number } | undefined;
  if (!sunrise) throw new Error("Sunrise Academy not found");

  const existing = await pool.query(
    "select id from students where school_id = $1 and aadhaar_number = $2",
    [sunrise.id, AADHAAR],
  );

  for (const row of existing.rows as Array<{ id: number }>) {
    await pool.query("delete from results where student_id = $1", [row.id]);
    await pool.query("delete from students where id = $1", [row.id]);
  }

  const createdStudents: Array<{ id: number; className: string; rollNumber: string }> = [];

  for (const cfg of classConfigs) {
    const inserted = await pool.query(
      `
        insert into students
          (school_id, name, aadhaar_number, roll_number, password_hash, class_name, section,
           father_name, mother_name, phone, enrollment_date, has_changed_password, is_active)
        values
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false, true)
        returning id, class_name, roll_number
      `,
      [
        sunrise.id,
        NAME,
        AADHAAR,
        cfg.rollNumber,
        defaultPasswordHash,
        cfg.className,
        "A",
        "RAKESH KUMAR",
        "SUNITA KUMAR",
        PHONE,
        `${Number(cfg.className) + 2018}-06-10`,
      ],
    );

    const student = inserted.rows[0] as { id: number; class_name: string; roll_number: string } | undefined;
    if (!student) continue;
    createdStudents.push({ id: student.id, className: student.class_name, rollNumber: student.roll_number });

    for (let i = 0; i < subjects.length; i++) {
      const marks = cfg.marks[i];
      await pool.query(
        `
          insert into results
            (school_id, student_id, aadhaar_number, first_name, class_name, subject, marks, max_marks, grade, exam_type, exam_date, remarks)
          values
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `,
        [sunrise.id, student.id, AADHAAR, "manish", cfg.className, subjects[i], marks, 100, gradeFor(marks), "Yearly", cfg.year, "Promoted to next class"],
      );
    }
  }

  console.log("Created MANISH KUMAR history records:");
  console.table(createdStudents);
  console.log(`Login with Aadhaar: ${AADHAAR}, firstName: manish, password: 111111`);

  await pool.end();
}

main().then(() => process.exit(0)).catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
