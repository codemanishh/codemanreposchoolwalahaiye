import { pool } from "@workspace/db";

async function main() {
  await pool.query(`alter table results drop constraint if exists results_student_id_students_id_fk`);
  await pool.query(`alter table results alter column student_id drop not null`);

  await pool.query(`alter table results add column if not exists aadhaar_number text`);
  await pool.query(`alter table results add column if not exists first_name text`);
  await pool.query(`alter table results add column if not exists class_name text`);

  await pool.query(`
    update results r
    set
      aadhaar_number = s.aadhaar_number,
      first_name = lower(split_part(trim(s.name), ' ', 1)),
      class_name = s.class_name
    from students s
    where r.student_id = s.id
      and (
        r.aadhaar_number is null
        or r.first_name is null
        or r.class_name is null
      )
  `);

  await pool.query(`
    create index if not exists results_school_aadhaar_first_name_idx
    on results (school_id, aadhaar_number, first_name)
  `);

  await pool.query(`
    create index if not exists students_school_aadhaar_active_idx
    on students (school_id, aadhaar_number, is_active)
  `);

  await pool.query(`
    create index if not exists students_aadhaar_active_idx
    on students (aadhaar_number, is_active)
  `);

  await pool.query(`
    create index if not exists students_school_roll_active_idx
    on students (school_id, roll_number, is_active)
  `);

  await pool.query(`
    create index if not exists students_school_aadhaar_first_name_active_expr_idx
    on students (school_id, aadhaar_number, (lower(split_part(trim(name), ' ', 1))), is_active)
  `);

  await pool.query(`
    create index if not exists students_aadhaar_first_name_active_expr_idx
    on students (aadhaar_number, (lower(split_part(trim(name), ' ', 1))), is_active)
  `);

  await pool.query(`
    create index if not exists results_school_aadhaar_first_name_class_idx
    on results (school_id, aadhaar_number, first_name, class_name)
  `);

  await pool.query(`
    create index if not exists results_school_created_idx
    on results (school_id, created_at)
  `);

  await pool.query(`
    create index if not exists results_dedupe_lookup_idx
    on results (school_id, aadhaar_number, first_name, class_name, subject, exam_type, exam_date)
  `);

  console.log("Results table Aadhaar identity migration complete.");
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
