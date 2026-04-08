import { pool } from "@workspace/db";

async function main() {
  console.log("Applying teacher Aadhaar auth migration...");

  await pool.query(`
    alter table teachers
    add column if not exists aadhaar_number text
  `);

  await pool.query(`
    create index if not exists teachers_aadhaar_idx
    on teachers (aadhaar_number)
  `);

  await pool.query(`
    create unique index if not exists teachers_school_aadhaar_uniq
    on teachers (school_id, aadhaar_number)
    where aadhaar_number is not null
  `);

  await pool.query(`
    update teachers
    set aadhaar_number = null
    where aadhaar_number is not null and aadhaar_number !~ '^\\d{12}$'
  `);

  console.log("✅ Teacher Aadhaar auth migration completed.");
  console.log("Note: Existing teachers must be updated with valid 12-digit Aadhaar numbers before they can log in.");

  await pool.end();
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await pool.end();
  process.exit(1);
});
