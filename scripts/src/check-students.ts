import { pool } from "@workspace/db";
import bcrypt from "bcryptjs";

async function main() {
  const counts = await pool.query(
    "select s.slug, count(st.id) as student_count from schools s left join students st on st.school_id = s.id group by s.slug order by s.slug",
  );

  console.log("Student counts by school:", JSON.stringify(counts.rows, null, 2));

  const sample = await pool.query(
    "select s.slug, st.roll_number from schools s join students st on st.school_id = s.id where s.slug = $1 order by st.roll_number limit 10",
    ["sunrise-academy"],
  );

  console.log("Sunrise sample roll numbers:", JSON.stringify(sample.rows, null, 2));

  const credentialCheck = await pool.query(
    "select st.roll_number, st.password_hash from schools s join students st on st.school_id = s.id where s.slug = $1 and st.roll_number = $2 limit 1",
    ["sunrise-academy", "SUA-102"],
  );

  console.log("Credential row:", JSON.stringify(credentialCheck.rows, null, 2));

  if (credentialCheck.rows.length > 0) {
    const row = credentialCheck.rows[0] as { roll_number: string; password_hash: string };
    const candidates = [
      "111111",
      "123456",
      "password",
      "student123",
      "school123",
      row.roll_number,
      row.roll_number.toLowerCase(),
    ];

    const results: Array<{ password: string; matched: boolean }> = [];
    for (const candidate of candidates) {
      const matched = await bcrypt.compare(candidate, row.password_hash);
      results.push({ password: candidate, matched });
    }

    console.log(`Password probe for ${row.roll_number}:`, JSON.stringify(results, null, 2));
  }

  await pool.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
