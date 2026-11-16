import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { ConflictError, NotFoundError } from '../src/common/errors';
import { TimetableService } from '../src/modules/timetable/timetable.service';
import type { TimetableRepository } from '../src/modules/timetable/timetable.repository';
import { FakeAudit } from './helpers/fakes';

function createMockTimetableRepo() {
  const slots = new Map<string, any>();
  const allocations = new Map<string, any>();

  const repo: Partial<TimetableRepository> = {
    findSlots: async () => Array.from(slots.values()),
    findSlotById: async (id: string) => slots.get(id) ?? null,
    findAllocationById: async (id: string) => allocations.get(id) ?? null,
    findOverlappingSlots: async (dayOfWeek, startMinute, endMinute, excludeSlotId) => {
      return Array.from(slots.values()).filter((s) => {
        if (excludeSlotId && s.id === excludeSlotId) return false;
        return s.dayOfWeek === dayOfWeek && s.startMinute < endMinute && s.endMinute > startMinute;
      });
    },
    createSlot: async (data) => {
      const id = randomUUID();
      const alloc = allocations.get(data.allocationId)!;
      const slot = { id, ...data, allocation: alloc };
      slots.set(id, slot);
      return slot as any;
    },
    updateSlot: async (id, data) => {
      const existing = slots.get(id)!;
      Object.assign(existing, data);
      return existing;
    },
    deleteSlot: async (id) => {
      const s = slots.get(id);
      slots.delete(id);
      return s;
    },
  };

  return { repo: repo as TimetableRepository, slots, allocations };
}

describe('TimetableService', () => {
  it('blocks faculty, room, and section timetable conflicts', async () => {
    const { repo, allocations } = createMockTimetableRepo();
    const audit = new FakeAudit();
    const service = new TimetableService(repo, audit);

    const fac1 = { id: randomUUID(), user: { firstName: 'Anita', lastName: 'Sharma' } };
    const fac2 = { id: randomUUID(), user: { firstName: 'Rahul', lastName: 'Verma' } };
    const secA = { id: randomUUID(), name: 'A' };
    const secB = { id: randomUUID(), name: 'B' };
    const sub1 = { id: randomUUID(), name: 'Data Structures' };
    const sub2 = { id: randomUUID(), name: 'Algorithms' };

    const alloc1 = { id: randomUUID(), facultyId: fac1.id, sectionId: secA.id, faculty: fac1, section: secA, subject: sub1 };
    const alloc2 = { id: randomUUID(), facultyId: fac2.id, sectionId: secB.id, faculty: fac2, section: secB, subject: sub2 };
    const alloc3 = { id: randomUUID(), facultyId: fac1.id, sectionId: secB.id, faculty: fac1, section: secB, subject: sub2 };

    allocations.set(alloc1.id, alloc1);
    allocations.set(alloc2.id, alloc2);
    allocations.set(alloc3.id, alloc3);

    // Create slot 1: Monday 09:00 - 10:00 (540 - 600) Room 101, Alloc 1 (fac1, secA)
    const slot1 = await service.createSlot({
      allocationId: alloc1.id,
      dayOfWeek: 'MONDAY',
      startMinute: 540,
      endMinute: 600,
      room: 'Room 101',
    });
    expect(slot1.id).toBeDefined();

    // Conflict 1: Same faculty (fac1) in overlapping slot (Alloc 3)
    await expect(
      service.createSlot({
        allocationId: alloc3.id,
        dayOfWeek: 'MONDAY',
        startMinute: 570, // 09:30 - 10:30 overlaps with 09:00 - 10:00
        endMinute: 630,
        room: 'Room 202',
      }),
    ).rejects.toThrow(ConflictError);

    // Conflict 2: Same room (Room 101) in overlapping slot (Alloc 2)
    await expect(
      service.createSlot({
        allocationId: alloc2.id,
        dayOfWeek: 'MONDAY',
        startMinute: 540,
        endMinute: 600,
        room: 'Room 101',
      }),
    ).rejects.toThrow(ConflictError);

    // Conflict 3: Same section (secA) in overlapping slot
    const alloc4 = { id: randomUUID(), facultyId: fac2.id, sectionId: secA.id, faculty: fac2, section: secA, subject: sub2 };
    allocations.set(alloc4.id, alloc4);
    await expect(
      service.createSlot({
        allocationId: alloc4.id,
        dayOfWeek: 'MONDAY',
        startMinute: 540,
        endMinute: 600,
        room: 'Room 303',
      }),
    ).rejects.toThrow(ConflictError);

    // No conflict: Different time slot (10:00 - 11:00) in same room
    const slot2 = await service.createSlot({
      allocationId: alloc2.id,
      dayOfWeek: 'MONDAY',
      startMinute: 600,
      endMinute: 660,
      room: 'Room 101',
    });
    expect(slot2.id).toBeDefined();
  });
});
