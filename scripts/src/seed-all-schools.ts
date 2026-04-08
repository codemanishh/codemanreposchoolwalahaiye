/**
 * seed-all-schools.ts
 *
 * Truncates all student / teacher / result / curriculum / attendance data
 * and re-seeds 3 schools with the following layout:
 *
 *   School index 0  →  classes 1, 3, 5, 7
 *   School index 1  →  classes 1, 2, 3, 4, 5
 *   School index 2  →  classes 2, 3, 5, 6, 9
 *
 * Per school:
 *   • 5 subjects per class
 *   • 10 students per class
 *   • 10 teachers
 *   • Results (mid-year=0 and final=1) for every student × every subject
 *
 * Schools are identified by their DB row ORDER (lowest id = school 0),
 * so the seeder stays correct even if a school is deleted and a new one
 * is added later.
 */

import { db } from "@workspace/db";
import {
  schoolsTable,
  studentsTable,
  teachersTable,
  resultsTable,
  curriculumClassesTable,
  curriculumSubjectsTable,
  studentAttendanceTable,
  subjectScheduleTable,
  teacherSubjectsTable,
} from "@workspace/db";
import bcrypt from "bcryptjs";

// ─── Configuration ───────────────────────────────────────────────────────────

const SCHOOL_CLASSES: number[][] = [
  [1, 3, 5, 7],       // school index 0
  [1, 2, 3, 4, 5],    // school index 1
  [2, 3, 5, 6, 9],    // school index 2
];

const SUBJECTS_PER_CLASS = [
  "Mathematics",
  "Science",
  "English",
  "Hindi",
  "Social Science",
];

const TEACHERS_PER_SCHOOL = 10;
const STUDENTS_PER_CLASS = 10;

// Teacher default password (9 digits)
const TEACHER_PASSWORD = "123456789";

// Student default password hash for "111111"
const STUDENT_PASSWORD_HASH =
  "$2b$10$8Q9z6lRKb0sMqUw7gCZ5w.c/4AEaFPB1IYkXsMnfNekjE/7y5B/A6";

// ─── Name Banks ──────────────────────────────────────────────────────────────

const TEACHER_NAMES = [
  "Rajesh Kumar",
  "Priya Sharma",
  "Anil Verma",
  "Sunita Yadav",
  "Mohan Das",
  "Kavita Singh",
  "Suresh Patel",
  "Meena Joshi",
  "Ravi Tiwari",
  "Anita Gupta",
  "Vikram Mishra",
  "Pooja Nair",
  "Deepak Rao",
  "Sneha Iyer",
  "Arun Pillai",
  "Neha Kapoor",
  "Sanjay Bhat",
  "Rekha Menon",
  "Arjun Reddy",
  "Geeta Jain",
  "Ashok Choudhary",
  "Usha Banerjee",
  "Vijay Naik",
  "Divya Shetty",
  "Rakesh Pandey",
  "Asha Trivedi",
  "Nitin Sharma",
  "Lalita Dubey",
  "Hemant Goswami",
  "Sarla Desai",
];

const STUDENT_NAMES = [
  "Aarav Sharma",
  "Vivaan Patel",
  "Aditya Singh",
  "Vihaan Kumar",
  "Arjun Gupta",
  "Sai Krishna",
  "Reyansh Yadav",
  "Ayaan Khan",
  "Krishna Iyer",
  "Ishaan Mehta",
  "Ananya Reddy",
  "Diya Nair",
  "Saanvi Joshi",
  "Pari Sharma",
  "Aanya Verma",
  "Riya Kapoor",
  "Aarohi Gupta",
  "Priya Menon",
  "Avni Pillai",
  "Neha Tiwari",
  "Rohan Mishra",
  "Kabir Das",
  "Dev Banerjee",
  "Yash Rao",
  "Aryan Bhat",
  "Tanish Naik",
  "Pranav Shetty",
  "Karan Pandey",
  "Akash Dubey",
  "Rahul Desai",
  "Pooja Trivedi",
  "Simran Choudhary",
  "Meera Goswami",
  "Preeti Jain",
  "Kavya Naikwadi",
  "Sneha Malhotra",
  "Ritika Sinha",
  "Anjali Patil",
  "Swati More",
  "Priyanka Yadav",
  "Gaurav Sonawane",
  "Nikhil Waghmare",
  "Sunil Shinde",
  "Hemant Kadam",
  "Vishal Bhosale",
  "Amit Jadhav",
  "Rajesh Pawar",
  "Santosh Gaikwad",
  "Dilip Kale",
  "Sushant Mane",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateAadhaar(schoolIndex: number, seed: number): string {
  // 12 digits, unique per school+seed
  const base = ((schoolIndex + 1) * 100000 + seed) % 1000000000000;
  return String(base).padStart(12, "0");
}

function gradeFromMarks(marks: number): string {
  if (marks >= 90) return "A+";
  if (marks >= 80) return "A";
  if (marks >= 70) return "B+";
  if (marks >= 60) return "B";
  if (marks >= 50) return "C";
  if (marks >= 40) return "D";
  return "F";
}

function randomMarks(min = 35, max = 98): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🗑️  Clearing existing teacher / student / result / curriculum / attendance data…");

  // Order matters: child rows first (or rely on cascade, but explicit is safer in scripts)
  await db.delete(studentAttendanceTable);
  await db.delete(subjectScheduleTable);
  await db.delete(teacherSubjectsTable);
  await db.delete(resultsTable);
  await db.delete(studentsTable);
  await db.delete(teachersTable);
  await db.delete(curriculumSubjectsTable);
  await db.delete(curriculumClassesTable);

  console.log("✅ Cleared.");

  // Fetch schools ordered by id so index 0 = oldest / lowest id
  const schools = (await db.select().from(schoolsTable)).sort((a, b) => a.id - b.id);

  if (schools.length === 0) {
    console.error("❌ No schools found. Run seed-schools first.");
    process.exit(1);
  }

  console.log(`Found ${schools.length} school(s). Seeding first ${Math.min(schools.length, 3)}…\n`);

  const teacherPasswordHash = await bcrypt.hash(TEACHER_PASSWORD, 10);

  // Track rolling counters for unique Aadhaar generation
  let globalStudentSeed = 1;
  let globalTeacherSeed = 1;

  for (let si = 0; si < Math.min(schools.length, 3); si++) {
    const school = schools[si];
    const classNumbers = SCHOOL_CLASSES[si];

    console.log(`\n📚 School [${si}]: "${school.name}" (id=${school.id})`);
    console.log(`   Classes: ${classNumbers.join(", ")}`);

    // ── 1. Curriculum classes + subjects ──────────────────────────────────
    console.log("   → Inserting curriculum classes & subjects…");
    for (let ci = 0; ci < classNumbers.length; ci++) {
      const classNum = classNumbers[ci];
      const className = `Class ${classNum}`;

      const [cc] = await db
        .insert(curriculumClassesTable)
        .values({ schoolId: school.id, className, displayOrder: ci })
        .returning({ id: curriculumClassesTable.id });

      for (let sj = 0; sj < SUBJECTS_PER_CLASS.length; sj++) {
        await db
          .insert(curriculumSubjectsTable)
          .values({ classId: cc.id, subjectName: SUBJECTS_PER_CLASS[sj], displayOrder: sj });
      }
    }

    // Subject schedule: all subjects on Monday–Friday for each class
    for (const classNum of classNumbers) {
      const className = `Class ${classNum}`;
      for (const subject of SUBJECTS_PER_CLASS) {
        for (const day of [1, 2, 3, 4, 5]) {
          await db.insert(subjectScheduleTable).values({
            schoolId: school.id,
            className,
            subject,
            dayOfWeek: day,
          });
        }
      }
    }

    // ── 2. Teachers ───────────────────────────────────────────────────────
    console.log(`   → Inserting ${TEACHERS_PER_SCHOOL} teachers…`);
    const teacherNameBank = TEACHER_NAMES.slice((si * TEACHERS_PER_SCHOOL) % TEACHER_NAMES.length);

    const insertedTeachers: { id: number }[] = [];
    for (let ti = 0; ti < TEACHERS_PER_SCHOOL; ti++) {
      const nameIdx = ti % teacherNameBank.length;
      const name = teacherNameBank[nameIdx] ?? `Teacher ${ti + 1}`;
      const aadhaar = generateAadhaar(si, globalTeacherSeed++);

      const [t] = await db
        .insert(teachersTable)
        .values({
          schoolId: school.id,
          name,
          aadhaarNumber: aadhaar,
          email: `teacher${globalTeacherSeed}@school${si + 1}.edu.in`,
          phone: `9${String(si * 10 + ti + 1).padStart(9, "0")}`,
          dailyPassword: teacherPasswordHash,
          isActive: true,
        })
        .returning({ id: teachersTable.id });
      insertedTeachers.push(t);
    }

    // Assign each teacher some subjects (round-robin)
    for (let ti = 0; ti < insertedTeachers.length; ti++) {
      await db.insert(teacherSubjectsTable).values({
        teacherId: insertedTeachers[ti].id,
        subject: SUBJECTS_PER_CLASS[ti % SUBJECTS_PER_CLASS.length],
        schoolId: school.id,
      });
    }

    // ── 3. Students + results ─────────────────────────────────────────────
    let totalStudentsThisSchool = 0;
    for (const classNum of classNumbers) {
      const className = `Class ${classNum}`;
      console.log(`   → Class ${classNum}: inserting ${STUDENTS_PER_CLASS} students + results…`);

      const studentNamePool = STUDENT_NAMES;

      for (let stIdx = 0; stIdx < STUDENTS_PER_CLASS; stIdx++) {
        const name = studentNamePool[(globalStudentSeed - 1) % studentNamePool.length] ?? `Student ${stIdx + 1}`;
        const aadhaar = generateAadhaar(si + 10, globalStudentSeed);
        const rollNumber = `${school.id}C${classNum}S${String(stIdx + 1).padStart(2, "0")}`;

        await db.insert(studentsTable).values({
          schoolId: school.id,
          name,
          aadhaarNumber: aadhaar,
          rollNumber,
          passwordHash: STUDENT_PASSWORD_HASH,
          className,
          section: "A",
          fatherName: `Father of ${name.split(" ")[0]}`,
          motherName: `Mother of ${name.split(" ")[0]}`,
          isActive: true,
        });

        // Results: mid-year (examType="0") and final (examType="1") for each subject
        const resultValues = [];
        for (const subject of SUBJECTS_PER_CLASS) {
          for (const examType of ["0", "1"]) {
            const marks = randomMarks();
            resultValues.push({
              schoolId: school.id,
              aadhaarNumber: aadhaar,
              firstName: name,
              className,
              subject,
              marks,
              maxMarks: 100,
              grade: gradeFromMarks(marks),
              examType,
              examDate: examType === "0" ? "2025-10-15" : "2026-03-25",
              remarks: "Auto-seeded",
            });
          }
        }
        await db.insert(resultsTable).values(resultValues);

        globalStudentSeed++;
        totalStudentsThisSchool++;
      }
    }

    console.log(
      `   ✅ School "${school.name}": ${classNumbers.length} classes, ${TEACHERS_PER_SCHOOL} teachers, ${totalStudentsThisSchool} students.`
    );
  }

  console.log("\n🎉 All done! Summary:");
  console.log("   Teacher login password: 123456789");
  console.log("   Student login password: 111111");
  console.log("   School index 0 → classes 1,3,5,7");
  console.log("   School index 1 → classes 1,2,3,4,5");
  console.log("   School index 2 → classes 2,3,5,6,9");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
