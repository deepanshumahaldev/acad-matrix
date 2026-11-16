import type { Prisma, PrismaClient, UserStatus } from '@prisma/client';
import type { FacultyFilterQuery, StudentFilterQuery } from './users.types';
import { toSkipTake } from '../../common/utils/pagination';

export class UsersRepository {
  constructor(private readonly getDb: () => PrismaClient) {}

  // ───────────────────────── Faculty ─────────────────────────

  async findFaculty(query: FacultyFilterQuery) {
    const { skip, take } = toSkipTake(query);
    const where: Prisma.FacultyWhereInput = {
      user: {
        deletedAt: null,
        ...(query.status ? { status: query.status } : {}),
        ...(query.search
          ? {
              OR: [
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.search ? { OR: [{ employeeId: { contains: query.search, mode: 'insensitive' } }] } : {}),
    };

    const [data, total] = await Promise.all([
      this.getDb().faculty.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: query.order ?? 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, status: true } },
          department: { select: { id: true, name: true, code: true } },
          allocations: {
            select: {
              id: true,
              subject: { select: { id: true, name: true, code: true } },
              section: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.getDb().faculty.count({ where }),
    ]);

    return { data, total };
  }

  async findFacultyById(id: string) {
    return this.getDb().faculty.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, status: true, failedLoginAttempts: true, lockedUntil: true } },
        department: { select: { id: true, name: true, code: true } },
        allocations: {
          include: {
            subject: true,
            section: { include: { semester: { include: { course: true } } } },
          },
        },
      },
    });
  }

  async findFacultyByEmployeeId(employeeId: string) {
    return this.getDb().faculty.findUnique({ where: { employeeId } });
  }

  async createFaculty(data: {
    user: Prisma.UserCreateInput;
    faculty: Omit<Prisma.FacultyUncheckedCreateInput, 'userId'>;
  }) {
    return this.getDb().$transaction(async (tx) => {
      const user = await tx.user.create({ data: data.user });
      const faculty = await tx.faculty.create({
        data: { ...data.faculty, userId: user.id },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, status: true } },
          department: { select: { id: true, name: true, code: true } },
        },
      });
      return faculty;
    });
  }

  async updateFaculty(id: string, data: {
    user?: Prisma.UserUpdateInput;
    faculty?: Prisma.FacultyUncheckedUpdateInput;
  }) {
    return this.getDb().$transaction(async (tx) => {
      const existing = await tx.faculty.findUniqueOrThrow({ where: { id } });
      if (data.user) {
        await tx.user.update({ where: { id: existing.userId }, data: data.user });
      }
      return tx.faculty.update({
        where: { id },
        data: data.faculty ?? {},
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, status: true } },
          department: { select: { id: true, name: true, code: true } },
        },
      });
    });
  }

  // ───────────────────────── Students ─────────────────────────

  async findStudents(query: StudentFilterQuery) {
    const { skip, take } = toSkipTake(query);
    const where: Prisma.StudentWhereInput = {
      user: {
        deletedAt: null,
        ...(query.status ? { status: query.status } : {}),
        ...(query.search
          ? {
              OR: [
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      ...(query.courseId ? { courseId: query.courseId } : {}),
      ...(query.semesterId ? { semesterId: query.semesterId } : {}),
      ...(query.sectionId ? { sectionId: query.sectionId } : {}),
      ...(query.search ? { OR: [{ rollNumber: { contains: query.search, mode: 'insensitive' } }] } : {}),
    };

    const [data, total] = await Promise.all([
      this.getDb().student.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: query.order ?? 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, status: true } },
          course: { select: { id: true, name: true, code: true } },
          semester: { select: { id: true, number: true, academicYear: true } },
          section: { select: { id: true, name: true } },
        },
      }),
      this.getDb().student.count({ where }),
    ]);

    return { data, total };
  }

  async findStudentById(id: string) {
    return this.getDb().student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, status: true, failedLoginAttempts: true, lockedUntil: true } },
        course: { select: { id: true, name: true, code: true } },
        semester: { select: { id: true, number: true, academicYear: true } },
        section: { select: { id: true, name: true } },
      },
    });
  }

  async findStudentByRollNumber(rollNumber: string) {
    return this.getDb().student.findUnique({ where: { rollNumber } });
  }

  async createStudent(data: {
    user: Prisma.UserCreateInput;
    student: Omit<Prisma.StudentUncheckedCreateInput, 'userId'>;
  }) {
    return this.getDb().$transaction(async (tx) => {
      const user = await tx.user.create({ data: data.user });
      const student = await tx.student.create({
        data: { ...data.student, userId: user.id },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, status: true } },
          course: { select: { id: true, name: true, code: true } },
          semester: { select: { id: true, number: true, academicYear: true } },
          section: { select: { id: true, name: true } },
        },
      });
      return student;
    });
  }

  async updateStudent(id: string, data: {
    user?: Prisma.UserUpdateInput;
    student?: Prisma.StudentUncheckedUpdateInput;
  }) {
    return this.getDb().$transaction(async (tx) => {
      const existing = await tx.student.findUniqueOrThrow({ where: { id } });
      if (data.user) {
        await tx.user.update({ where: { id: existing.userId }, data: data.user });
      }
      return tx.student.update({
        where: { id },
        data: data.student ?? {},
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, status: true } },
          course: { select: { id: true, name: true, code: true } },
          semester: { select: { id: true, number: true, academicYear: true } },
          section: { select: { id: true, name: true } },
        },
      });
    });
  }

  // ───────────────────────── Common User Actions ─────────────────────────

  async findUserByEmail(email: string) {
    return this.getDb().user.findUnique({ where: { email } });
  }

  async updateUserStatus(userId: string, status: UserStatus) {
    return this.getDb().user.update({
      where: { id: userId },
      data: { status },
      select: { id: true, email: true, status: true },
    });
  }

  async softDeleteUser(userId: string) {
    return this.getDb().user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
      select: { id: true, email: true, status: true, deletedAt: true },
    });
  }

  async unlockUser(userId: string) {
    return this.getDb().user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
      select: { id: true, email: true, failedLoginAttempts: true, lockedUntil: true },
    });
  }
}
