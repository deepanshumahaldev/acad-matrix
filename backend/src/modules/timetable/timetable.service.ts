import { ConflictError, NotFoundError } from '../../common/errors';
import type { AuditLogger } from '../../common/services/audit';
import type { TimetableRepository } from './timetable.repository';
import type { CreateSlotInput, TimetableQuery, UpdateSlotInput } from './timetable.types';

export class TimetableService {
  constructor(
    private readonly repo: TimetableRepository,
    private readonly audit: AuditLogger,
  ) {}

  async listSlots(query: TimetableQuery) {
    return this.repo.findSlots(query);
  }

  async getMyTimetable(userId: string, role: string) {
    if (role === 'STUDENT') {
      const student = await this.repo.findStudentByUserId(userId);
      if (!student) return [];
      return this.repo.findSlots({ sectionId: student.sectionId });
    }
    if (role === 'FACULTY') {
      const faculty = await this.repo.findFacultyByUserId(userId);
      if (!faculty) return [];
      return this.repo.findSlots({ facultyId: faculty.id });
    }
    return this.repo.findSlots({});
  }

  async getSlotById(id: string) {
    const slot = await this.repo.findSlotById(id);
    if (!slot) throw new NotFoundError('Timetable slot not found');
    return slot;
  }

  private async checkConflicts(params: {
    dayOfWeek: CreateSlotInput['dayOfWeek'];
    startMinute: number;
    endMinute: number;
    room: string;
    facultyId: string;
    sectionId: string;
    excludeSlotId?: string;
  }) {
    const overlapping = await this.repo.findOverlappingSlots(
      params.dayOfWeek,
      params.startMinute,
      params.endMinute,
      params.excludeSlotId,
    );

    for (const slot of overlapping) {
      if (slot.allocation.facultyId === params.facultyId) {
        const facName = `${slot.allocation.faculty.user.firstName} ${slot.allocation.faculty.user.lastName}`;
        throw new ConflictError(
          `Faculty ${facName} already has ${slot.allocation.subject.name} in Room ${slot.room} on ${params.dayOfWeek} at this time`,
        );
      }
      if (slot.room.trim().toLowerCase() === params.room.trim().toLowerCase()) {
        throw new ConflictError(
          `Room ${params.room} is already booked for ${slot.allocation.subject.name} on ${params.dayOfWeek} at this time`,
        );
      }
      if (slot.allocation.sectionId === params.sectionId) {
        throw new ConflictError(
          `Section ${slot.allocation.section.name} already has ${slot.allocation.subject.name} scheduled on ${params.dayOfWeek} at this time`,
        );
      }
    }
  }

  async createSlot(input: CreateSlotInput, actorId?: string, ip?: string) {
    const allocation = await this.repo.findAllocationById(input.allocationId);
    if (!allocation) throw new NotFoundError('Subject allocation not found');

    await this.checkConflicts({
      dayOfWeek: input.dayOfWeek,
      startMinute: input.startMinute,
      endMinute: input.endMinute,
      room: input.room,
      facultyId: allocation.facultyId,
      sectionId: allocation.sectionId,
    });

    const slot = await this.repo.createSlot(input);
    await this.audit.log({
      actorId,
      action: 'TIMETABLE_SLOT_CREATED',
      entity: 'TimetableSlot',
      entityId: slot.id,
      metadata: { dayOfWeek: input.dayOfWeek, room: input.room, allocationId: input.allocationId },
      ipAddress: ip,
    });
    return slot;
  }

  async updateSlot(id: string, input: UpdateSlotInput, actorId?: string, ip?: string) {
    const existing = await this.getSlotById(id);
    const allocationId = input.allocationId ?? existing.allocationId;
    const allocation = await this.repo.findAllocationById(allocationId);
    if (!allocation) throw new NotFoundError('Subject allocation not found');

    const dayOfWeek = input.dayOfWeek ?? existing.dayOfWeek;
    const startMinute = input.startMinute ?? existing.startMinute;
    const endMinute = input.endMinute ?? existing.endMinute;
    const room = input.room ?? existing.room;

    await this.checkConflicts({
      dayOfWeek,
      startMinute,
      endMinute,
      room,
      facultyId: allocation.facultyId,
      sectionId: allocation.sectionId,
      excludeSlotId: id,
    });

    const updated = await this.repo.updateSlot(id, input);
    await this.audit.log({
      actorId,
      action: 'TIMETABLE_SLOT_UPDATED',
      entity: 'TimetableSlot',
      entityId: id,
      ipAddress: ip,
    });
    return updated;
  }

  async deleteSlot(id: string, actorId?: string, ip?: string) {
    await this.getSlotById(id);
    const deleted = await this.repo.deleteSlot(id);
    await this.audit.log({
      actorId,
      action: 'TIMETABLE_SLOT_DELETED',
      entity: 'TimetableSlot',
      entityId: id,
      ipAddress: ip,
    });
    return deleted;
  }
}
