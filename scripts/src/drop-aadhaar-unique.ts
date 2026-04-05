import { pool } from "@workspace/db";

async function main() {
  await pool.query("drop index if exists students_aadhaar_number_unique");
  console.log("Dropped index: students_aadhaar_number_unique (if it existed)");
  await pool.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
