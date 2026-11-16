import type { DayOfWeek, Prisma, PrismaClient } from '@prisma/client';
import type { TimetableQuery } from './timetable.types';

export class TimetableRepository {
  constructor(private readonly getDb: () => PrismaClient) {}

  async findSlots(query: TimetableQuery) {
    const where: Prisma.TimetableSlotWhereInput = {
      ...(query.dayOfWeek ? { dayOfWeek: query.dayOfWeek } : {}),
      ...(query.room ? { room: { contains: query.room, mode: 'insensitive' } } : {}),
      ...(query.sectionId || query.facultyId || query.semesterId
        ? {
            allocation: {
              ...(query.sectionId ? { sectionId: query.sectionId } : {}),
              ...(query.facultyId ? { facultyId: query.facultyId } : {}),
              ...(query.semesterId ? { section: { semesterId: query.semesterId } } : {}),
            },
          }
        : {}),
    };

    return this.getDb().timetableSlot.findMany({
      where,
      orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
      include: {
        allocation: {
          include: {
            subject: true,
            section: { include: { semester: { include: { course: true } } } },
            faculty: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          },
        },
      },
    });
  }

  async findSlotById(id: string) {
    return this.getDb().timetableSlot.findUnique({
      where: { id },
      include: {
        allocation: {
          include: {
            subject: true,
            section: { include: { semester: { include: { course: true } } } },
            faculty: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          },
        },
      },
    });
  }

  async findAllocationById(id: string) {
    return this.getDb().subjectAllocation.findUnique({
      where: { id },
      include: {
        subject: true,
        section: true,
        faculty: { include: { user: true } },
      },
    });
  }

  async findOverlappingSlots(dayOfWeek: DayOfWeek, startMinute: number, endMinute: number, excludeSlotId?: string) {
    return this.getDb().timetableSlot.findMany({
      where: {
        dayOfWeek,
        id: excludeSlotId ? { not: excludeSlotId } : undefined,
        // Overlap condition: slot.startMinute < new.endMinute AND slot.endMinute > new.startMinute
        startMinute: { lt: endMinute },
        endMinute: { gt: startMinute },
      },
      include: {
        allocation: {
          include: {
            subject: true,
            section: true,
            faculty: { include: { user: true } },
          },
        },
      },
    });
  }

  async createSlot(data: Prisma.TimetableSlotUncheckedCreateInput) {
    return this.getDb().timetableSlot.create({
      data,
      include: {
        allocation: {
          include: {
            subject: true,
            section: { include: { semester: { include: { course: true } } } },
            faculty: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          },
        },
      },
    });
  }

  async updateSlot(id: string, data: Prisma.TimetableSlotUncheckedUpdateInput) {
    return this.getDb().timetableSlot.update({
      where: { id },
      data,
      include: {
        allocation: {
          include: {
            subject: true,
            section: { include: { semester: { include: { course: true } } } },
            faculty: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          },
        },
      },
    });
  }

  async deleteSlot(id: string) {
    return this.getDb().timetableSlot.delete({ where: { id } });
  }

  async findStudentByUserId(userId: string) {
    return this.getDb().student.findUnique({ where: { userId } });
  }

  async findFacultyByUserId(userId: string) {
    return this.getDb().faculty.findUnique({ where: { userId } });
  }
}
