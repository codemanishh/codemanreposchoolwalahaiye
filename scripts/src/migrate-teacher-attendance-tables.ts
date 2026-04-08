import { pool } from "@workspace/db";

async function main() {
  console.log("Creating teacher attendance system tables...");

  // Teachers table
  await pool.query(`
    create table if not exists teachers (
      id serial primary key,
      school_id integer not null references schools(id) on delete cascade,
      name text not null,
      aadhaar_number text,
      email text,
      phone text,
      daily_password text not null,
      password_refresh_date timestamp not null default now(),
      is_active boolean not null default true,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    )
  `);

  // Student Attendance table
  await pool.query(`
    create table if not exists student_attendance (
      id serial primary key,
      school_id integer not null references schools(id) on delete cascade,
      student_id integer,
      aadhaar_number text,
      first_name text,
      class_name text,
      teacher_id integer references teachers(id) on delete cascade,
      subject text not null,
      attendance_date date not null,
      status text not null check (status in ('present', 'absent', 'leave')),
      remarks text,
      created_at timestamp not null default now()
    )
  `);

  // Subject Schedule table
  await pool.query(`
    create table if not exists subject_schedule (
      id serial primary key,
      school_id integer not null references schools(id) on delete cascade,
      class_name text not null,
      subject text not null,
      day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6),
      created_at timestamp not null default now()
    )
  `);

  // Teacher Subjects table
  await pool.query(`
    create table if not exists teacher_subjects (
      id serial primary key,
      teacher_id integer not null references teachers(id) on delete cascade,
      subject text not null,
      school_id integer not null,
      created_at timestamp not null default now()
    )
  `);

  // Create indexes for fast retrieval
  await pool.query(`
    create index if not exists teachers_school_active_idx
    on teachers (school_id, is_active)
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
    create index if not exists attendance_school_date_idx
    on student_attendance (school_id, attendance_date)
  `);

  await pool.query(`
    create index if not exists attendance_teacher_date_idx
    on student_attendance (teacher_id, attendance_date)
  `);

  await pool.query(`
    create index if not exists attendance_aadhaar_date_idx
    on student_attendance (aadhaar_number, attendance_date)
  `);

  await pool.query(`
    create index if not exists schedule_school_class_idx
    on subject_schedule (school_id, class_name)
  `);

  await pool.query(`
    create index if not exists teacher_subjects_teacher_idx
    on teacher_subjects (teacher_id, subject)
  `);

  console.log("✅ Teacher attendance system tables created successfully!");
  await pool.end();
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await pool.end();
  process.exit(1);
});
