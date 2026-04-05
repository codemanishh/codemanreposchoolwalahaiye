import { pool } from "@workspace/db";

async function main() {
  const result = await pool.query(
    `
      with targets as (
        select id,
               row_number() over (order by id) as rn
        from students
        where aadhaar_number is null or aadhaar_number = ''
      )
      update students s
      set aadhaar_number = lpad((846400000000 + t.rn)::text, 12, '0'),
          updated_at = now()
      from targets t
      where s.id = t.id
      returning s.id, s.name, s.roll_number, s.aadhaar_number
    `,
  );

  console.log(`Backfilled Aadhaar for ${result.rowCount ?? 0} students`);
  console.table(result.rows.slice(0, 10));

  const sample = await pool.query(
    `
      select aadhaar_number, split_part(lower(name), ' ', 1) as first_name, roll_number
      from students
      where is_active = true
      order by id
      limit 10
    `,
  );

  console.log("Sample student login identifiers:");
  console.table(sample.rows);

  await pool.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
