import { PrismaClient, Role, SessionStatus, ProximityTier } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Attendex Database Seed on Neon...");

  const saltRounds = 10;
  const commonPassword = await bcrypt.hash("Pass@1234", saltRounds);

  // 1. Create or Update Teacher
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@attendex.edu" },
    update: {
      passwordHash: commonPassword,
      name: "Dr. Evelyn Reed",
      role: Role.TEACHER,
      department: "Computer Science & Engineering",
    },
    create: {
      email: "teacher@attendex.edu",
      name: "Dr. Evelyn Reed",
      role: Role.TEACHER,
      passwordHash: commonPassword,
      department: "Computer Science & Engineering",
    },
  });
  console.log("✅ Seeded Teacher:", teacher.email);

  // 2. Create or Update Students
  const student1 = await prisma.user.upsert({
    where: { email: "student@attendex.edu" },
    update: {
      passwordHash: commonPassword,
      name: "Varad Dalvi",
      role: Role.STUDENT,
      rollNumber: "CS-2026-001",
      department: "Computer Science & Engineering",
    },
    create: {
      email: "student@attendex.edu",
      name: "Varad Dalvi",
      role: Role.STUDENT,
      rollNumber: "CS-2026-001",
      passwordHash: commonPassword,
      department: "Computer Science & Engineering",
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: "aditi@attendex.edu" },
    update: {
      passwordHash: commonPassword,
      name: "Aditi Sharma",
      role: Role.STUDENT,
      rollNumber: "CS-2026-002",
      department: "Computer Science & Engineering",
    },
    create: {
      email: "aditi@attendex.edu",
      name: "Aditi Sharma",
      role: Role.STUDENT,
      rollNumber: "CS-2026-002",
      passwordHash: commonPassword,
      department: "Computer Science & Engineering",
    },
  });

  const student3 = await prisma.user.upsert({
    where: { email: "rahul@attendex.edu" },
    update: {
      passwordHash: commonPassword,
      name: "Rahul Verma",
      role: Role.STUDENT,
      rollNumber: "CS-2026-003",
      department: "Computer Science & Engineering",
    },
    create: {
      email: "rahul@attendex.edu",
      name: "Rahul Verma",
      role: Role.STUDENT,
      rollNumber: "CS-2026-003",
      passwordHash: commonPassword,
      department: "Computer Science & Engineering",
    },
  });
  console.log("✅ Seeded Students: Varad Dalvi, Aditi Sharma, Rahul Verma");

  // 3. Biometric Profile for Student 1
  await prisma.studentBiometricProfile.upsert({
    where: { studentId: student1.id },
    update: {
      templateVectorHash: "sha256_mock_vector_hash_varad_dalvi_v1",
      qualityScore: 0.96,
      algorithmVersion: "browser-mesh-v1",
    },
    create: {
      studentId: student1.id,
      templateVectorHash: "sha256_mock_vector_hash_varad_dalvi_v1",
      qualityScore: 0.96,
      algorithmVersion: "browser-mesh-v1",
    },
  });

  // 4. Create Classroom
  let classroom = await prisma.classroom.findFirst({
    where: { name: "Turing Hall 101" },
  });

  if (!classroom) {
    classroom = await prisma.classroom.create({
      data: {
        name: "Turing Hall 101",
        building: "Science & Engineering Complex",
        roomNumber: "SEC-101",
        latitude: 18.52043,
        longitude: 73.85674,
        radiusMeters: 30.0,
        expectedWifiBssid: "00:14:22:01:23:45",
        beaconFrequencyHz: 18750,
      },
    });
  }
  console.log("✅ Seeded Classroom:", classroom.name);

  // 5. Create Course
  const course = await prisma.course.upsert({
    where: { code: "CS-302" },
    update: {
      name: "Distributed Systems & Consensus",
      department: "Computer Science",
      teacherId: teacher.id,
    },
    create: {
      code: "CS-302",
      name: "Distributed Systems & Consensus",
      department: "Computer Science",
      teacherId: teacher.id,
    },
  });
  console.log("✅ Seeded Course:", course.code);

  // 6. Enroll Students in Course
  for (const s of [student1, student2, student3]) {
    await prisma.enrollment.upsert({
      where: {
        courseId_studentId: {
          courseId: course.id,
          studentId: s.id,
        },
      },
      update: {},
      create: {
        courseId: course.id,
        studentId: s.id,
      },
    });
  }
  console.log("✅ Enrolled 3 students in CS-302");

  // 7. Seed an ACTIVE Attendance Session
  let activeSession = await prisma.attendanceSession.findFirst({
    where: {
      courseId: course.id,
      status: SessionStatus.ACTIVE,
    },
  });

  if (!activeSession) {
    activeSession = await prisma.attendanceSession.create({
      data: {
        courseId: course.id,
        classroomId: classroom.id,
        teacherId: teacher.id,
        status: SessionStatus.ACTIVE,
        startTime: new Date(),
        ephemeralSecret: "attendex-live-acoustic-challenge-key-2026",
        proximityTierRequired: ProximityTier.TIER_A,
        maxAttempts: 3,
      },
    });
  }
  console.log("✅ Seeded ACTIVE AttendanceSession ID:", activeSession.id);

  console.log("\n🎉 Database seed finished successfully!");
  console.log("------------------------------------------");
  console.log("Credentials:");
  console.log("Teacher: teacher@attendex.edu / Pass@1234");
  console.log("Student: student@attendex.edu / Pass@1234 (Roll: CS-2026-001)");
  console.log("Active Session ID:", activeSession.id);
  console.log("------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
