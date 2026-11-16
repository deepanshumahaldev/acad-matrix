import 'dotenv/config';
import argon2 from 'argon2';
import { DayOfWeek, PrismaClient, Role, SubjectType } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@AcadMatrix.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe@123';
const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD ?? 'Welcome@123';
const ACADEMIC_YEAR = '2026-27';

const hash = (pw: string) => argon2.hash(pw, { type: argon2.argon2id });
const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  return h * 60 + m;
};

async function main() {
  if (process.env.NODE_ENV === 'production' && !process.env.SEED_ADMIN_PASSWORD) {
    throw new Error('Set SEED_ADMIN_PASSWORD before seeding a production database.');
  }

  const adminHash = await hash(ADMIN_PASSWORD);
  const defaultHash = await hash(DEFAULT_PASSWORD);

  // ── Admin ───────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      passwordHash: adminHash,
      role: Role.ADMIN,
      firstName: 'System',
      lastName: 'Admin',
      mustChangePassword: true,
    },
  });

  // ── Academic structure ──────────────────────────────────
  const dept = await prisma.department.upsert({
    where: { code: 'CSE' },
    update: {},
    create: { name: 'Computer Science & Engineering', code: 'CSE' },
  });

  const course = await prisma.course.upsert({
    where: { code: 'BTECH-CSE' },
    update: {},
    create: { name: 'B.Tech Computer Science', code: 'BTECH-CSE', departmentId: dept.id, durationSemesters: 8 },
  });

  const semester = await prisma.semester.upsert({
    where: { courseId_number_academicYear: { courseId: course.id, number: 3, academicYear: ACADEMIC_YEAR } },
    update: {},
    create: {
      courseId: course.id,
      number: 3,
      academicYear: ACADEMIC_YEAR,
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-12-20'),
      isCurrent: true,
    },
  });

  const sections = await Promise.all(
    ['A', 'B'].map((name) =>
      prisma.section.upsert({
        where: { semesterId_name: { semesterId: semester.id, name } },
        update: {},
        create: { semesterId: semester.id, name },
      }),
    ),
  );
  const [secA, secB] = sections as [(typeof sections)[number], (typeof sections)[number]];

  const subjectDefs = [
    { code: 'CS301', name: 'Data Structures', type: SubjectType.THEORY },
    { code: 'CS302', name: 'Database Management Systems', type: SubjectType.THEORY },
    { code: 'CS303', name: 'Operating Systems', type: SubjectType.THEORY },
    { code: 'CS304', name: 'Discrete Mathematics', type: SubjectType.THEORY },
    { code: 'CS305', name: 'Data Structures Lab', type: SubjectType.PRACTICAL },
  ];
  const subjects = await Promise.all(
    subjectDefs.map((s) =>
      prisma.subject.upsert({
        where: { code: s.code },
        update: {},
        create: { ...s, semesterId: semester.id, credits: s.type === SubjectType.PRACTICAL ? 2 : 4 },
      }),
    ),
  );

  // ── Faculty ─────────────────────────────────────────────
  const facultyDefs = [
    { n: 1, first: 'Anita', last: 'Sharma', designation: 'Professor' },
    { n: 2, first: 'Rahul', last: 'Verma', designation: 'Associate Professor' },
    { n: 3, first: 'Priya', last: 'Singh', designation: 'Assistant Professor' },
  ];
  const faculty = [];
  for (const f of facultyDefs) {
    const email = `faculty${f.n}@AcadMatrix.local`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: defaultHash,
        role: Role.FACULTY,
        firstName: f.first,
        lastName: f.last,
        mustChangePassword: true,
      },
    });
    faculty.push(
      await prisma.faculty.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          employeeId: `EMP${String(f.n).padStart(3, '0')}`,
          departmentId: dept.id,
          designation: f.designation,
        },
      }),
    );
  }

  // ── Students (6 in A, 4 in B) ───────────────────────────
  const firstNames = ['Aarav', 'Diya', 'Kabir', 'Meera', 'Rohan', 'Sneha', 'Vikram', 'Isha', 'Arjun', 'Neha'];
  const lastNames = ['Gupta', 'Patel', 'Kumar', 'Reddy', 'Joshi', 'Nair', 'Mehta', 'Das', 'Yadav', 'Rao'];
  for (let i = 0; i < 10; i++) {
    const n = i + 1;
    const email = `student${String(n).padStart(2, '0')}@AcadMatrix.local`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: defaultHash,
        role: Role.STUDENT,
        firstName: firstNames[i]!,
        lastName: lastNames[i]!,
        mustChangePassword: true,
      },
    });
    await prisma.student.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        rollNumber: `CSE24${String(n).padStart(3, '0')}`,
        courseId: course.id,
        semesterId: semester.id,
        sectionId: i < 6 ? secA.id : secB.id,
        admissionYear: 2024,
      },
    });
  }

  // ── Subject allocations (every subject in both sections) ─
  const allocations = new Map<string, string>(); // `${subjectCode}:${sectionName}` -> allocationId
  for (const [si, subject] of subjects.entries()) {
    for (const section of sections) {
      const teacher = faculty[(si + (section.name === 'B' ? 1 : 0)) % faculty.length]!;
      const alloc = await prisma.subjectAllocation.upsert({
        where: { subjectId_sectionId: { subjectId: subject.id, sectionId: section.id } },
        update: {},
        create: { subjectId: subject.id, sectionId: section.id, facultyId: teacher.id },
      });
      allocations.set(`${subject.code}:${section.name}`, alloc.id);
    }
  }

  // ── Timetable (re-created on every run; conflict-free by construction) ─
  await prisma.timetableSlot.deleteMany({ where: { allocationId: { in: [...allocations.values()] } } });

  const grid: Array<[DayOfWeek, string, string, string, string, string]> = [
    // day, start, end, subjectCode, section, room
    [DayOfWeek.MONDAY, '09:00', '10:00', 'CS301', 'A', 'R101'],
    [DayOfWeek.MONDAY, '10:00', '11:00', 'CS302', 'A', 'R101'],
    [DayOfWeek.MONDAY, '09:00', '10:00', 'CS302', 'B', 'R102'],
    [DayOfWeek.MONDAY, '10:00', '11:00', 'CS301', 'B', 'R102'],
    [DayOfWeek.TUESDAY, '09:00', '10:00', 'CS303', 'A', 'R101'],
    [DayOfWeek.TUESDAY, '10:00', '11:00', 'CS304', 'A', 'R101'],
    [DayOfWeek.TUESDAY, '09:00', '10:00', 'CS304', 'B', 'R102'],
    [DayOfWeek.TUESDAY, '10:00', '11:00', 'CS303', 'B', 'R102'],
    [DayOfWeek.WEDNESDAY, '09:00', '11:00', 'CS305', 'A', 'LAB1'],
    [DayOfWeek.WEDNESDAY, '11:30', '13:30', 'CS305', 'B', 'LAB1'],
    [DayOfWeek.THURSDAY, '09:00', '10:00', 'CS302', 'A', 'R101'],
    [DayOfWeek.THURSDAY, '09:00', '10:00', 'CS301', 'B', 'R102'],
    [DayOfWeek.FRIDAY, '10:00', '11:00', 'CS303', 'A', 'R101'],
    [DayOfWeek.FRIDAY, '10:00', '11:00', 'CS304', 'B', 'R102'],
  ];
  for (const [day, start, end, code, sec, room] of grid) {
    const allocationId = allocations.get(`${code}:${sec}`)!;
    await prisma.timetableSlot.create({
      data: { allocationId, dayOfWeek: day, startMinute: minutes(start), endMinute: minutes(end), room },
    });
  }

  // ── Fee structure + student fees ────────────────────────
  const existingStructure = await prisma.feeStructure.findFirst({
    where: { courseId: course.id, semesterId: semester.id, academicYear: ACADEMIC_YEAR },
  });
  const structure =
    existingStructure ??
    (await prisma.feeStructure.create({
      data: {
        courseId: course.id,
        semesterId: semester.id,
        name: 'Semester 3 Fees',
        academicYear: ACADEMIC_YEAR,
        totalAmount: 60000,
        components: [
          { label: 'Tuition', amount: 50000 },
          { label: 'Library & Lab', amount: 6000 },
          { label: 'Development', amount: 4000 },
        ],
        dueDate: new Date('2026-09-15'),
      },
    }));
  const students = await prisma.student.findMany({ where: { semesterId: semester.id } });
  for (const s of students) {
    await prisma.studentFee.upsert({
      where: { studentId_feeStructureId: { studentId: s.id, feeStructureId: structure.id } },
      update: {},
      create: { studentId: s.id, feeStructureId: structure.id, amountDue: 60000, dueDate: structure.dueDate },
    });
  }

  console.log('\nSeed complete.');
  console.log(`  Admin     : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`  Faculty   : faculty1@AcadMatrix.local … faculty3@AcadMatrix.local / ${DEFAULT_PASSWORD}`);
  console.log(`  Students  : student01@AcadMatrix.local … student10@AcadMatrix.local / ${DEFAULT_PASSWORD}`);
  console.log('  All seeded accounts must change their password on first login.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
