# 🚀 Teacher Attendance System - Quick Start Guide

## 🎯 In 5 Minutes

### Check Server Status
- **API Server:** `http://localhost:3000`
- **Frontend App:** `http://localhost:5174`

### Step 1: Login as School Admin
```
Go to: http://localhost:5174/admin
Use credentials from seed data:
  - School: "1" (Sunrise Academy)
  - Password: See admin seeding in scripts
```

---

## 🔑 Test Credentials

### Option A: Use Existing School (Seeded Data)
**School:** ID = 1 (Sunrise Academy)
**Students:** MANISH KUMAR
  - Aadhaar: `846481726232`
  - Password: `111111`
  - Classes: 5, 6, 7, 8

---

## 📱 Complete User Journey (Test Script)

### **Part 1: Admin Setup** (5 min)
1. Login to admin dashboard `/admin` (already seeded)
2. Go to **Teachers** section
3. Click **"+ Add Teacher"**
   ```
   Name: Test Teacher
  Aadhaar: 123412341234
   Email: test@school.edu
   Phone: 9876543210
   ```
4. Click **Create** → shows `Password: 123456789` (example)
5. **Copy this password** (shown only once!)

### **Step 2: Setup Schedule** (3 min)
1. Go back to Admin Dashboard
2. Click **Curriculum** tab
3. Select **Class 5** (or test class)
4. Add today's subjects:
   - Subject: "Mathematics"
   - Day: Monday (if today is Monday)
   - Click Add
   - Repeat for English, Science
5. Save

### **Step 3: Teacher Login** (2 min)
1. Go to `http://localhost:5174/teacher/login`
2. Enter:
   - **School ID:** `1`
  - **Aadhaar Number:** `123412341234`
  - **Password:** `123456789` (from Step 1)
3. Click **Sign In**
4. Should see teacher dashboard with classes grid

### **Step 4: Select Class & View Schedule** (2 min)
1. Click **Class 5** button
2. Weekly calendar appears with today's schedule
3. See: Mathematics, English, Science (from Step 2)

### **Step 5: Mark Attendance** (5 min)
1. Click **"Mark Attendance for Class 5"** button
2. Page shows today's subjects dropdown
3. Select **"Mathematics"**
4. Table shows all Class 5 students:
   - MANISH KUMAR (846481726232)
   - Other students...
5. Mark status for each:
   - ✓ Present = Green check
   - ✗ Absent = Red X
   - ⏱ Leave = Yellow clock
6. Watch **Quick Stats** update below table
7. Click **"Submit Attendance"** (green button)
8. Success alert → Auto-redirect to dashboard

### **Step 6: Verify in Student Portal** (2 min)
1. Go to `http://localhost:5174/student`
2. Login as MANISH KUMAR:
   - Aadhaar: `846481726232`
   - Password: `111111`
3. Click **"Attendance"** tab (new)
4. See placeholder: "Coming Soon"
5. Explanation text confirms attendance tracked

---

## 🔄 Refresh Password (Admin Daily Task)

1. Go to Admin Dashboard → Teachers
2. Find Teacher card/row
3. Click **⟳ Refresh Password** icon
4. New 9-digit password generated
5. Show teacher the new password
6. Teacher login flow updates tomorrow

---

## 🧪 Quick API Tests

### Test in Terminal/Postman

**Login as Teacher:**
```bash
curl -X POST http://localhost:3000/api/auth/teacher/login \
  -H "Content-Type: application/json" \
  -d '{
    "schoolId": 1,
    "aadhaarNumber": "123412341234",
    "password": "123456789"
  }'
```

Response:
```json
{
  "token": "eyJhbGc...",
  "role": "teacher",
  "user": { "id": 1, "name": "Test Teacher", "schoolId": 1 }
}
```

**Get Classes:**
```bash
curl -H "Authorization: Bearer <token_from_above>" \
  http://localhost:3000/api/teacher/classes
```

Response:
```json
{
  "classes": ["5", "6", "7", "8"]
}
```

**Get Today's Schedule:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/teacher/schedule/today/5
```

Response:
```json
{
  "subjects": ["Mathematics", "English", "Science"],
  "date": "2026-04-07",
  "dayOfWeek": "Tuesday"
}
```

**Mark Attendance:**
```bash
curl -X POST http://localhost:3000/api/teacher/attendance \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "className": "5",
    "subject": "Mathematics",
    "attendanceDate": "2026-04-07",
    "records": [
      {"aadhaarNumber": "846481726232", "firstName": "manish", "status": "present"}
    ]
  }'
```

---

## 📊 Database Verification

**Connect to PostgreSQL:**
```bash
psql postgresql://user:password@localhost/school_campus
```

**Verify tables created:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%teacher%' OR table_name LIKE '%attendance%';
```

**Check teacher record:**
```sql
SELECT * FROM teachers WHERE school_id = 1;
```

**Check attendance records:**
```sql
SELECT * FROM student_attendance WHERE school_id = 1;
```

**Check schedule:**
```sql
SELECT * FROM subject_schedule WHERE school_id = 1 AND class_name = '5';
```

---

## 🎨 UI Components Tested

- [ ] Teacher login form (School ID + Password)
- [ ] Error messages (invalid credentials)
- [ ] Success toast (login successful)
- [ ] Class grid buttons (class selection)
- [ ] Weekly schedule display (7 days)
- [ ] Add subject form (input + button per day)
- [ ] Subject cards (display, delete icon)
- [ ] Student table (roll, name, Aadhaar)
- [ ] Status buttons (✓ ✗ ⏱)
- [ ] Quick stats cards (counts update)
- [ ] Submit button (disabled until data ready)
- [ ] Attendance tab in student portal
- [ ] Responsive layout (Desktop/Tablet/Mobile)

---

## ❌ Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Invalid Credentials" on login | Check School ID, Aadhaar (12 digits), and 9-digit password |
| Students not showing in class | Verify students exist with that className in students table |
| Schedule not updating | Refresh page after adding schedule |
| Attendance not saving | Check all required fields: className, subject, attendanceDate, records |
| Dashboard not loading | Check JWT token expiry (7 days), try logout/login |
| Port 5174 busy | Stop other Vite instances or use different port |

---

## 📈 Performance Metrics

**Expected Response Times:**
- Login: < 100ms
- Get classes: < 50ms
- Get schedule: < 100ms
- Mark attendance: < 200ms (with 40 students)

**Database Indexes:**
- Teachers lookup: O(log n)
- Attendance queries: O(log n) with composite indexes
- Schedule lookup: O(log n)

---

## 🎓 Understanding the Flow

```
Teacher Login (/teacher/login)
    ↓ [Valid Credentials]
Teacher Dashboard (/teacher/dashboard)
    ↓ [Select Class]
Class Selected (Weekly Schedule Shows)
    ↓ [Click "Mark Attendance"]
Attendance Page (/teacher/class/:classId/attendance)
    ↓ [Select Subject for Today]
Subject Selected (Students List Loads)
    ↓ [Mark Each Student Status]
Status Marked (✓ ✗ ⏱)
    ↓ [Click Submit]
Database Updated
    ↓ [Auto-Redirect]
Back to Dashboard
```

---

## 💾 Data Persistence

- ✅ Attendance records saved in PostgreSQL
- ✅ Schedule persisted per class
- ✅ Teacher passwords hashed (bcrypt)
- ✅ JWT token stored in localStorage
- ✅ All operations idempotent (safe to re-submit)

---

## 📞 Need Help?

Check the full documentation:
→ `TEACHER_ATTENDANCE_SYSTEM.md`

---

**Status:** ✅ Ready to Test
**API Server:** ✅ Running on localhost:3000
**Frontend Server:** ✅ Running on localhost:5174
**Database:** ✅ Tables migrated & indexed
