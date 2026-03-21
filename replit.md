# Workspace

## Overview

School Management Platform — a multi-tenant SaaS for schools. Includes super admin portal, school admin portal, public school websites, and student login portal.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (shadcn/ui)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **File uploads**: multer + xlsx (Excel result uploads)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── school-platform/    # React + Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
└── ...config files
```

## Platform Architecture

### Portals

1. **Super Admin** — `/superadmin/login`
   - Credentials: `superadmin` / `admin123`
   - Can onboard schools, manage credentials, toggle active status

2. **School Admin** — `/admin/login`
   - Credentials: set by super admin per school
   - Can manage profile, students, results, notifications, gallery

3. **Public School Website** — `/school/:slug`
   - Anyone can browse a school's public page (about, gallery, notices, admission/fee structure, contact)

4. **Student Portal** — `/student/login` (root `/`)
   - Login with school slug + roll number + password (default: `111111`)
   - Can view profile, results, notifications; change password

### Database Tables

- `superadmin` — one or more super admins
- `schools` — school accounts with all profile fields
- `students` — per school, default password hash for `111111`
- `results` — uploaded via Excel; linked to students
- `notifications` — per school, shown to students and public
- `gallery` — image URLs per school

### API Routes (all under `/api`)

- `POST /auth/superadmin/login` — super admin login
- `POST /auth/school/login` — school admin login
- `POST /auth/student/login` — student login (schoolSlug + rollNumber + password)
- `GET /auth/me` — get current user from token
- `GET/POST /superadmin/schools` — list/create schools
- `GET/PUT/DELETE /superadmin/schools/:id` — manage individual school
- `GET/PUT /school/profile` — school profile
- `GET/POST/DELETE /school/students` — student CRUD
- `GET/POST /school/notifications` — notifications
- `POST /school/results/upload` — Excel file upload for results
- `GET /school/gallery` — gallery management
- `GET /public/schools` — public school listing
- `GET /public/schools/:slug` — public school detail
- `GET /public/schools/:slug/notifications` — public notifications
- `GET /public/schools/:slug/gallery` — public gallery
- `GET /student/profile` — student profile
- `GET /student/results` — student results
- `GET /student/notifications` — student notifications
- `POST /student/change-password` — change student password

### Excel Upload Format

Columns: `roll_number`, `subject`, `marks`, `max_marks`, `grade`, `exam_type`, `exam_date`, `remarks`
