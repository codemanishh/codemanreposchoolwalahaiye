import { pool } from "@workspace/db";

async function main() {
  console.log("Creating school_holidays table...");

  await pool.query(`
    create table if not exists school_holidays (
      id serial primary key,
      school_id integer not null references schools(id) on delete cascade,
      title text not null,
      holiday_date date not null,
      description text,
      is_active boolean not null default true,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    )
  `);

  await pool.query(`
    create index if not exists school_holidays_school_date_idx
    on school_holidays (school_id, holiday_date)
  `);

  console.log("✅ school_holidays ready");
  await pool.end();
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await pool.end();
  process.exit(1);
});
