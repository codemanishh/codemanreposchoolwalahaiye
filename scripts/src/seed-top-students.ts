import { pool } from "@workspace/db";

const targetSlugs = [
  "sunrise-academy",
  "st-marys-convent",
  "delhi-public-school",
] as const;

const percentages = ["99%", "45%", "89%", "45%", "59%", "40%", "77%", "89%"];

const dummyStudents = [
  {
    name: "Aarav Sharma",
    className: "Class 10-A",
    message: "Consistent effort and discipline made this result possible.",
    photoUrl: "https://i.pravatar.cc/300?img=11",
  },
  {
    name: "Diya Verma",
    className: "Class 12 Science",
    message: "A focused learner and role model for peers.",
    photoUrl: "https://i.pravatar.cc/300?img=32",
  },
  {
    name: "Kabir Mehta",
    className: "Class 9-B",
    message: "Excellent improvement and strong academic mindset.",
    photoUrl: "https://i.pravatar.cc/300?img=15",
  },
  {
    name: "Anaya Patel",
    className: "Class 8-C",
    message: "Hard work and curiosity have produced outstanding growth.",
    photoUrl: "https://i.pravatar.cc/300?img=5",
  },
  {
    name: "Vivaan Rao",
    className: "Class 11 Commerce",
    message: "Smart planning and dedication delivered this milestone.",
    photoUrl: "https://i.pravatar.cc/300?img=18",
  },
  {
    name: "Ishita Nair",
    className: "Class 7-A",
    message: "Steady practice and confidence shine in results.",
    photoUrl: "https://i.pravatar.cc/300?img=47",
  },
  {
    name: "Rohan Singh",
    className: "Class 10-C",
    message: "A resilient performer with excellent consistency.",
    photoUrl: "https://i.pravatar.cc/300?img=21",
  },
  {
    name: "Myra Kapoor",
    className: "Class 6-B",
    message: "Strong fundamentals and effort are clearly visible.",
    photoUrl: "https://i.pravatar.cc/300?img=41",
  },
];

async function main() {
  const schoolResult = await pool.query(
    "select id, slug, name from schools where slug = any($1::text[])",
    [[...targetSlugs]]
  );
  const schools = schoolResult.rows as Array<{ id: number; slug: string; name: string }>;

  if (schools.length !== targetSlugs.length) {
    const found = schools.map((s) => s.slug).join(", ");
    throw new Error(`Expected ${targetSlugs.length} schools but found ${schools.length}. Found: ${found}`);
  }

  for (const school of schools) {
    await pool.query("delete from top_students where school_id = $1", [school.id]);

    for (let index = 0; index < dummyStudents.length; index++) {
      const student = dummyStudents[index];
      await pool.query(
        `
          insert into top_students
            (school_id, name, class_name, percentage, message, photo_url, display_order)
          values
            ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          school.id,
          student.name,
          student.className,
          percentages[index],
          `${student.message} (${school.name})`,
          student.photoUrl,
          index,
        ]
      );
    }
  }

  const counts = await Promise.all(
    schools.map(async (school) => {
      const result = await pool.query("select count(*)::int as count from top_students where school_id = $1", [school.id]);
      return { slug: school.slug, count: result.rows[0]?.count ?? 0 };
    })
  );

  console.log("Seeded top students:", counts);
  await pool.end();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
