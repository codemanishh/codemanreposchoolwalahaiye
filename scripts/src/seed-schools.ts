import { db } from "@workspace/db";
import {
  schoolsTable,
  studentsTable,
  resultsTable,
  notificationsTable,
  galleryTable,
} from "@workspace/db";
import bcrypt from "bcryptjs";

// Default student password: "111111"
const DEFAULT_STUDENT_PW = "$2b$10$8Q9z6lRKb0sMqUw7gCZ5w.c/4AEaFPB1IYkXsMnfNekjE/7y5B/A6";

// ──────────────────────────────────────────────────────────
// School definitions
// ──────────────────────────────────────────────────────────
const SCHOOLS = [
  {
    name: "Delhi Public School",
    slug: "delhi-public-school",
    username: "dps_admin",
    password: "school123",
    email: "admin@dps.edu.in",
    phone: "+91-11-26543210",
    address: "Ring Road, Vasant Kunj, New Delhi",
    city: "New Delhi",
    state: "Delhi",
    tagline: "Excellence in Education, Character in Life",
    about:
      "Delhi Public School was established in 1978 and has since grown into one of the most reputed schools in the capital. We offer world-class education blending modern pedagogy with rich Indian values.",
    mission:
      "To foster academic excellence, ethical values, and all-round development of every student so they become responsible citizens of the world.",
    vision:
      "A community of learners who are intellectually curious, morally upright, and socially responsible.",
    yearsOfExperience: 46,
    principalMessage:
      "At DPS we believe every child is unique. Our dedicated faculty nurtures each student's potential through innovative teaching, co-curricular activities, and strong mentoring.",
    founderMessage:
      "When I founded this institution, my dream was simple — give every child the opportunity to discover greatness within themselves. That dream lives on in each student who walks through our gates.",
    presidentMessage:
      "The school governing body remains committed to providing state-of-the-art infrastructure and the finest educators to shape tomorrow's leaders.",
    feeStructure:
      "Class 1–4: ₹45,000/year | Class 5–8: ₹55,000/year | Class 9–10: ₹65,000/year | Class 11–12: ₹75,000/year. Fees include tuition, library, and sports.",
    facilities:
      "Science Labs, Computer Lab with 120 systems, Olympic-size Swimming Pool, Indoor & Outdoor Sports Complex, Art & Craft Studio, Auditorium (1200 seats), Smart Classrooms, Library with 15,000+ books, Cafeteria, School Bus Service.",
    mapUrl: "https://maps.google.com/?q=Delhi+Public+School+Vasant+Kunj",
    socialFacebook: "https://facebook.com/dpsvasantkunj",
    socialTwitter: "https://twitter.com/dpsvasantkunj",
    socialInstagram: "https://instagram.com/dpsvasantkunj",
    socialYoutube: "https://youtube.com/c/dpsvasantkunj",
    logoUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=200",
    heroImageUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200",
  },
  {
    name: "St. Mary's Convent School",
    slug: "st-marys-convent",
    username: "stmarys_admin",
    password: "school123",
    email: "principal@stmarys.edu.in",
    phone: "+91-22-24456789",
    address: "Hill Road, Bandra West, Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    tagline: "Nurturing Minds, Building Futures",
    about:
      "St. Mary's Convent School, established in 1952 by the Sisters of Mercy, is a renowned girls' institution in Mumbai. We combine rigorous academics with a nurturing environment rooted in Catholic values open to students of all faiths.",
    mission:
      "To provide quality holistic education that develops the intellect, character, and spirit of every young woman in our care.",
    vision:
      "Empowered young women who lead with compassion, courage, and conviction in every field they choose.",
    yearsOfExperience: 72,
    principalMessage:
      "Our greatest joy is watching our students grow — not just academically but as compassionate young leaders. Every programme here is designed to help each girl find her voice and realize her potential.",
    founderMessage:
      "This school was born out of love — love for this city and its children. Over seven decades later, that love continues to guide every decision we make for our students.",
    presidentMessage:
      "The Board of Trustees pledges continued investment in modern infrastructure and qualified teaching staff to uphold the legacy of excellence that St. Mary's is known for.",
    feeStructure:
      "Class 1–4: ₹50,000/year | Class 5–8: ₹60,000/year | Class 9–10: ₹72,000/year | Class 11–12: ₹85,000/year. Includes tuition, lab fees, and extracurricular activities.",
    facilities:
      "State-of-the-art Science Labs, Digital Library with e-resources, Dance & Music Studios, Basketball & Volleyball Courts, Swimming Pool, Counselling Centre, Language Lab, Chapel, Spacious Cafeteria, School Transport.",
    mapUrl: "https://maps.google.com/?q=St+Marys+Convent+School+Bandra+Mumbai",
    socialFacebook: "https://facebook.com/stmarysbandra",
    socialTwitter: "https://twitter.com/stmarysbandra",
    socialInstagram: "https://instagram.com/stmarysbandra",
    socialYoutube: "https://youtube.com/c/stmarysbandramumbai",
    logoUrl: "https://images.unsplash.com/photo-1562774053-701939374585?w=200",
    heroImageUrl: "https://images.unsplash.com/photo-1562774053-701939374585?w=1200",
  },
  {
    name: "Sunrise Academy",
    slug: "sunrise-academy",
    username: "sunrise_admin",
    password: "school123",
    email: "info@sunriseacademy.edu.in",
    phone: "+91-80-28765432",
    address: "Whitefield Main Road, Bengaluru",
    city: "Bengaluru",
    state: "Karnataka",
    tagline: "Every Day a New Beginning",
    about:
      "Sunrise Academy opened its doors in 2005 with a vision to merge the best of Indian and international education. Located on a 10-acre green campus in Whitefield, we serve over 2000 students from Kindergarten to Grade 12.",
    mission:
      "To ignite curiosity, encourage innovation, and instil lifelong values so every student thrives in a rapidly changing world.",
    vision:
      "An institution where every sunrise brings new opportunities for students to discover, create, and contribute.",
    yearsOfExperience: 19,
    principalMessage:
      "Education at Sunrise is about asking great questions. We encourage our students to be problem-solvers, collaborators, and empathetic leaders. The world needs young people who can think critically and act with integrity.",
    founderMessage:
      "Starting a school from scratch was the most challenging and rewarding thing I have ever done. Watching those early batches go on to accomplish incredible things makes every sacrifice worthwhile.",
    presidentMessage:
      "Our management is dedicated to progressively enhancing every aspect of learning at Sunrise — from infrastructure and faculty development to student welfare and community engagement.",
    feeStructure:
      "Class 1–4: ₹60,000/year | Class 5–8: ₹72,000/year | Class 9–10: ₹85,000/year | Class 11–12: ₹1,00,000/year. Inclusive of tuition, digital resources, sports, and transport.",
    facilities:
      "STEM Labs with robotics kits, 3D Printing Lab, Green Amphitheatre, Olympic Track, Cricket Ground, Yoga & Meditation Centre, Innovation Hub, Smart e-Classrooms, Cafeteria with multi-cuisine menu, 24×7 CCTV campus.",
    mapUrl: "https://share.google/5zLtg1RygP4Ec3fMF",
    socialFacebook: "https://facebook.com/sunriseacademyblr",
    socialTwitter: "https://twitter.com/sunriseblr",
    socialInstagram: "https://instagram.com/sunriseacademyblr",
    socialYoutube: "https://youtube.com/c/sunriseacademybengaluru",
    logoUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200",
    heroImageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200",
  },
];

// ──────────────────────────────────────────────────────────
// Student name pools per school
// ──────────────────────────────────────────────────────────
const STUDENTS_PER_SCHOOL: Record<number, { class: string; students: { name: string; father: string; mother: string }[] }[]> = {
  0: [ // Delhi Public School
    {
      class: "1",
      students: [
        { name: "Aarav Sharma", father: "Rajesh Sharma", mother: "Priya Sharma" },
        { name: "Diya Gupta", father: "Vikas Gupta", mother: "Neha Gupta" },
        { name: "Kabir Singh", father: "Harpreet Singh", mother: "Manjeet Kaur" },
        { name: "Anaya Verma", father: "Suresh Verma", mother: "Sunita Verma" },
        { name: "Rohan Mehta", father: "Sanjay Mehta", mother: "Anju Mehta" },
      ],
    },
    {
      class: "2",
      students: [
        { name: "Ishaan Joshi", father: "Deepak Joshi", mother: "Kavita Joshi" },
        { name: "Saanvi Kapoor", father: "Ankur Kapoor", mother: "Ritu Kapoor" },
        { name: "Advait Yadav", father: "Ramesh Yadav", mother: "Gita Yadav" },
        { name: "Priya Malhotra", father: "Anil Malhotra", mother: "Smita Malhotra" },
        { name: "Arjun Bhatia", father: "Vinod Bhatia", mother: "Rekha Bhatia" },
      ],
    },
    {
      class: "3",
      students: [
        { name: "Vivaan Saxena", father: "Pankaj Saxena", mother: "Meena Saxena" },
        { name: "Myra Agarwal", father: "Hemant Agarwal", mother: "Nandita Agarwal" },
        { name: "Rehan Qureshi", father: "Imran Qureshi", mother: "Salma Qureshi" },
        { name: "Tanvi Patel", father: "Bharat Patel", mother: "Hema Patel" },
        { name: "Siddharth Nair", father: "Sunil Nair", mother: "Lata Nair" },
      ],
    },
    {
      class: "4",
      students: [
        { name: "Aisha Khan", father: "Farhan Khan", mother: "Rukhsar Khan" },
        { name: "Neil Chaudhary", father: "Rakesh Chaudhary", mother: "Vandana Chaudhary" },
        { name: "Pihu Bajaj", father: "Manoj Bajaj", mother: "Seema Bajaj" },
        { name: "Yuvan Trivedi", father: "Girish Trivedi", mother: "Indu Trivedi" },
        { name: "Kiara Menon", father: "Sudhir Menon", mother: "Anita Menon" },
      ],
    },
  ],
  1: [ // St. Mary's Convent
    {
      class: "1",
      students: [
        { name: "Sophia D'Souza", father: "Allan D'Souza", mother: "Clara D'Souza" },
        { name: "Aliya Fernandes", father: "Kevin Fernandes", mother: "Maria Fernandes" },
        { name: "Rhea Rodrigues", father: "Leo Rodrigues", mother: "Dana Rodrigues" },
        { name: "Tara Desai", father: "Niren Desai", mother: "Pallavi Desai" },
        { name: "Zara Irani", father: "Darius Irani", mother: "Shereen Irani" },
      ],
    },
    {
      class: "2",
      students: [
        { name: "Anaya Pereira", father: "Steven Pereira", mother: "Judith Pereira" },
        { name: "Meera Pillai", father: "Vijayan Pillai", mother: "Sudha Pillai" },
        { name: "Nora Gonsalves", father: "Frank Gonsalves", mother: "Rita Gonsalves" },
        { name: "Pooja Rao", father: "Subramanian Rao", mother: "Girija Rao" },
        { name: "Simran Oberoi", father: "Gurdeep Oberoi", mother: "Jasvinder Oberoi" },
      ],
    },
    {
      class: "3",
      students: [
        { name: "Kavya Nambiar", father: "Rajan Nambiar", mother: "Deepa Nambiar" },
        { name: "Isha Thakur", father: "Suresh Thakur", mother: "Savita Thakur" },
        { name: "Layla Sheikh", father: "Asif Sheikh", mother: "Nadia Sheikh" },
        { name: "Divya Kulkarni", father: "Prakash Kulkarni", mother: "Madhuri Kulkarni" },
        { name: "Elena Monteiro", father: "Paul Monteiro", mother: "Grace Monteiro" },
      ],
    },
    {
      class: "4",
      students: [
        { name: "Shreya Jain", father: "Hitesh Jain", mother: "Komal Jain" },
        { name: "Riya Mhatre", father: "Santosh Mhatre", mother: "Jayashree Mhatre" },
        { name: "Trisha Chatterjee", father: "Subhash Chatterjee", mother: "Tapasi Chatterjee" },
        { name: "Chloe Lobo", father: "Gerald Lobo", mother: "Shirley Lobo" },
        { name: "Aditi Khatri", father: "Manish Khatri", mother: "Nisha Khatri" },
      ],
    },
  ],
  2: [ // Sunrise Academy
    {
      class: "1",
      students: [
        { name: "Aryan Reddy", father: "V. Srinivas Reddy", mother: "Asha Reddy" },
        { name: "Tarini Krishnan", father: "Mohan Krishnan", mother: "Lalitha Krishnan" },
        { name: "Dev Hegde", father: "Ramesh Hegde", mother: "Sulochana Hegde" },
        { name: "Aadhya Murthy", father: "Harish Murthy", mother: "Rekha Murthy" },
        { name: "Nihal Shetty", father: "Dinesh Shetty", mother: "Usha Shetty" },
      ],
    },
    {
      class: "2",
      students: [
        { name: "Krish Gowda", father: "Nagesh Gowda", mother: "Savitha Gowda" },
        { name: "Preethi Naidu", father: "Siva Naidu", mother: "Jyothi Naidu" },
        { name: "Ronak Shah", father: "Harsh Shah", mother: "Foram Shah" },
        { name: "Yashvi Kumar", father: "Anil Kumar", mother: "Geeta Kumar" },
        { name: "Akshay Rao", father: "Sunder Rao", mother: "Vimala Rao" },
      ],
    },
    {
      class: "3",
      students: [
        { name: "Manav Prabhu", father: "Dilip Prabhu", mother: "Sheela Prabhu" },
        { name: "Nia Bhatt", father: "Mihir Bhatt", mother: "Roshni Bhatt" },
        { name: "Kedar Joshi", father: "Suhas Joshi", mother: "Varsha Joshi" },
        { name: "Sana Mirza", father: "Zubair Mirza", mother: "Fatima Mirza" },
        { name: "Tejas Patil", father: "Santosh Patil", mother: "Shubhangi Patil" },
      ],
    },
    {
      class: "4",
      students: [
        { name: "Aditya Naik", father: "Suresh Naik", mother: "Meera Naik" },
        { name: "Roshani Iyer", father: "Venkat Iyer", mother: "Gomathi Iyer" },
        { name: "Shiv Kunder", father: "Pramod Kunder", mother: "Swati Kunder" },
        { name: "Nithya Bhat", father: "Chandrashekar Bhat", mother: "Manjula Bhat" },
        { name: "Omkar Kamat", father: "Vitthal Kamat", mother: "Rohini Kamat" },
      ],
    },
  ],
};

// Subjects per class
const SUBJECTS: Record<string, string[]> = {
  "1": ["English", "Mathematics", "Environmental Science", "Hindi"],
  "2": ["English", "Mathematics", "Science", "Hindi", "Social Studies"],
  "3": ["English", "Mathematics", "Science", "Hindi", "Social Studies"],
  "4": ["English", "Mathematics", "Science", "Hindi", "Social Studies"],
};

function getGrade(marks: number, maxMarks: number): string {
  const pct = (marks / maxMarks) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  return "D";
}

// Deterministic pseudo-random so re-runs are idempotent
function fakeMarks(seed: number, max: number): number {
  const base = ((seed * 7919) % (max - 30)) + 30;
  return Math.round(base * 10) / 10;
}

const SCHOOL_PREFIXES = ["DPS", "SMC", "SUA"];

// ──────────────────────────────────────────────────────────
// Notifications per school
// ──────────────────────────────────────────────────────────
const NOTIFICATIONS: { title: string; content: string }[][] = [
  [
    {
      title: "Annual Sports Day 2026",
      content:
        "The Annual Sports Day will be held on 15 March 2026 at the school ground. All students are required to report in sports attire by 7:30 AM. Parents are cordially invited.",
    },
    {
      title: "Parent-Teacher Meeting – Term 1",
      content:
        "A Parent-Teacher Meeting is scheduled for 22 March 2026 (Saturday) from 9 AM to 1 PM. Please collect your ward's progress report and meet subject teachers. Prior appointment via school app is recommended.",
    },
    {
      title: "Admission Open – Session 2026-27",
      content:
        "Admissions for the academic session 2026-27 are now open for Classes 1 to 9. Interested parents may collect the prospectus from the school office on all working days between 9 AM and 3 PM.",
    },
  ],
  [
    {
      title: "Inter-School Science Exhibition",
      content:
        "St. Mary's Convent will be hosting the Inter-School Science Exhibition on 5 April 2026. Students who wish to participate must submit their project proposals to the Science Department by 20 March 2026.",
    },
    {
      title: "Summer Vacation Notice",
      content:
        "The school will remain closed for summer vacation from 28 April 2026 to 9 June 2026. School reopens on 10 June 2026. Students are encouraged to complete their holiday homework and reading projects.",
    },
    {
      title: "Cultural Fest – Utsav 2026",
      content:
        "Utsav 2026, the annual cultural festival, will be celebrated on 18 April 2026 in the school auditorium. All classes will participate. Detailed schedule will be shared by class teachers.",
    },
  ],
  [
    {
      title: "STEM Workshop by IISc Faculty",
      content:
        "A special two-day STEM workshop conducted by faculty from IISc Bengaluru is scheduled for Classes 3 and 4 on 10–11 April 2026. Enrolment is on a first-come, first-served basis. Contact the Academic Office.",
    },
    {
      title: "Half-Yearly Exam Schedule Released",
      content:
        "The half-yearly examination timetable for all classes has been uploaded to the school portal. Exams commence on 25 April 2026. Students must report 15 minutes before the exam start time.",
    },
    {
      title: "New School Bus Routes Announced",
      content:
        "Two new bus routes covering Sarjapur Road and Marathahalli have been added from the new academic term. Parents interested in availing bus facilities may register at the transport office before 15 April 2026.",
    },
  ],
];

// ──────────────────────────────────────────────────────────
// Gallery per school
// ──────────────────────────────────────────────────────────
const GALLERY: { url: string; caption: string }[][] = [
  [
    { url: "https://images.unsplash.com/photo-1541178735493-479c1a27ed24?w=800", caption: "Annual Sports Day 2025" },
    { url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800", caption: "Science Laboratory" },
    { url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800", caption: "Republic Day Parade" },
    { url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800", caption: "School Campus" },
  ],
  [
    { url: "https://images.unsplash.com/photo-1613896527026-f195d5c818ed?w=800", caption: "Utsav 2025 – Cultural Evening" },
    { url: "https://images.unsplash.com/photo-1604881991720-f91add269bed?w=800", caption: "Basketball Championship" },
    { url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800", caption: "Graduation Day 2025" },
    { url: "https://images.unsplash.com/photo-1562774053-701939374585?w=800", caption: "School Building" },
  ],
  [
    { url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800", caption: "STEM Innovation Fair 2025" },
    { url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800", caption: "Annual Day Performance" },
    { url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800", caption: "Coding Hackathon" },
    { url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800", caption: "Campus Green Zone" },
  ],
];

// ──────────────────────────────────────────────────────────
// Main seed
// ──────────────────────────────────────────────────────────
async function seed() {
  console.log("🌱  Starting school seed...\n");

  const schoolPassword = await bcrypt.hash("school123", 10);

  for (let si = 0; si < SCHOOLS.length; si++) {
    const s = SCHOOLS[si];
    console.log(`📚  Seeding school ${si + 1}/3: ${s.name}`);

    // Upsert school
    const [school] = await db
      .insert(schoolsTable)
      .values({
        name: s.name,
        slug: s.slug,
        username: s.username,
        passwordHash: schoolPassword,
        email: s.email,
        phone: s.phone,
        address: s.address,
        city: s.city,
        state: s.state,
        tagline: s.tagline,
        about: s.about,
        mission: s.mission,
        vision: s.vision,
        logoUrl: s.logoUrl,
        heroImageUrl: s.heroImageUrl,
        yearsOfExperience: s.yearsOfExperience,
        principalMessage: s.principalMessage,
        founderMessage: s.founderMessage,
        presidentMessage: s.presidentMessage,
        feeStructure: s.feeStructure,
        facilities: s.facilities,
        mapUrl: s.mapUrl,
        socialFacebook: s.socialFacebook,
        socialTwitter: s.socialTwitter,
        socialInstagram: s.socialInstagram,
        socialYoutube: s.socialYoutube,
        isActive: true,
      })
      .onConflictDoNothing()
      .returning();

    if (!school) {
      console.log(`   ⚠️  School "${s.name}" already exists, skipping students/data.`);
      continue;
    }

    // Notifications
    for (const n of NOTIFICATIONS[si]) {
      await db.insert(notificationsTable).values({ schoolId: school.id, ...n }).onConflictDoNothing();
    }
    console.log(`   ✅  ${NOTIFICATIONS[si].length} notifications added`);

    // Gallery
    for (const g of GALLERY[si]) {
      await db.insert(galleryTable).values({ schoolId: school.id, ...g }).onConflictDoNothing();
    }
    console.log(`   ✅  ${GALLERY[si].length} gallery images added`);

    // Students + Results
    let totalStudents = 0;
    let totalResults = 0;
    const prefix = SCHOOL_PREFIXES[si];

    for (const classData of STUDENTS_PER_SCHOOL[si]) {
      const cls = classData.class;
      const subjects = SUBJECTS[cls];

      for (let idx = 0; idx < classData.students.length; idx++) {
        const st = classData.students[idx];
        const rollNumber = `${prefix}-${cls}0${idx + 1}`;
        const aadhaarNumber = String(846400000000 + si * 10000000 + parseInt(cls) * 1000 + (idx + 1)).padStart(12, "0");

        const [student] = await db
          .insert(studentsTable)
          .values({
            schoolId: school.id,
            name: st.name,
            aadhaarNumber,
            rollNumber,
            passwordHash: DEFAULT_STUDENT_PW,
            className: cls,
            section: "A",
            fatherName: st.father,
            motherName: st.mother,
            phone: `9${((800000000 + si * 100000 + parseInt(cls) * 1000 + idx * 10) % 1000000000).toString().padStart(9, "0")}`,
            email: `${st.name.toLowerCase().replace(/[^a-z]/g, ".")}@student.${s.slug}.edu.in`,
            address: s.address,
            enrollmentDate: `2025-06-10`,
            isActive: true,
          })
          .onConflictDoNothing()
          .returning();

        if (!student) continue;
        totalStudents++;

        // Results for each subject
        for (let subIdx = 0; subIdx < subjects.length; subIdx++) {
          const seed = si * 10000 + parseInt(cls) * 1000 + idx * 100 + subIdx;
          const maxMarks = 100;
          const marks = fakeMarks(seed, maxMarks);
          const grade = getGrade(marks, maxMarks);

          await db.insert(resultsTable).values({
            schoolId: school.id,
            studentId: student.id,
            aadhaarNumber,
            firstName: st.name.trim().split(/\s+/)[0]?.toLowerCase() || "",
            className: cls,
            subject: subjects[subIdx],
            marks,
            maxMarks,
            grade,
            examType: "Half-Yearly",
            examDate: "2026-03-15",
            remarks: grade === "A+" || grade === "A" ? "Excellent performance" : grade === "B+" || grade === "B" ? "Good effort" : "Needs improvement",
          });
          totalResults++;
        }
      }
    }

    console.log(`   ✅  ${totalStudents} students added | ${totalResults} results added`);
    console.log(`   🔑  Admin login → username: ${s.username} | password: school123\n`);
  }

  console.log("✅  Seed complete!\n");
  console.log("School admin credentials:");
  console.log("  Delhi Public School   → dps_admin / school123");
  console.log("  St. Mary's Convent    → stmarys_admin / school123");
  console.log("  Sunrise Academy       → sunrise_admin / school123");
  console.log("\nStudent login: Aadhaar Number + lowercase first name + password (default 111111)");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
