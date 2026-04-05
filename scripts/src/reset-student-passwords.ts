import { pool } from "@workspace/db";
import bcrypt from "bcryptjs";

async function main() {
  const hash = await bcrypt.hash("111111", 10);

  const result = await pool.query(
    "update students set password_hash = $1, updated_at = now() where is_active = true",
    [hash],
  );

  console.log(`Updated active student passwords: ${result.rowCount ?? 0}`);

  await pool.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
