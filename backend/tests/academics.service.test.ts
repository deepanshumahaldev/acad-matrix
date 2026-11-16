import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { BadRequestError, ConflictError, NotFoundError } from '../src/common/errors';
import { AcademicsService } from '../src/modules/academics/academics.service';
import type { AcademicsRepository } from '../src/modules/academics/academics.repository';
import { FakeAudit } from './helpers/fakes';

function createMockAcademicsRepo() {
  const departments = new Map<string, any>();
  const courses = new Map<string, any>();
  const semesters = new Map<string, any>();
  const sections = new Map<string, any>();
  const subjects = new Map<string, any>();
  const allocations = new Map<string, any>();

  const repo: Partial<AcademicsRepository> = {
    // Depts
    findDepartments: async () => Array.from(departments.values()).filter((d) => !d.deletedAt),
    findDepartmentById: async (id: string) => departments.get(id) ?? null,
    findDepartmentByCode: async (code: string) =>
      Array.from(departments.values()).find((d) => d.code === code && !d.deletedAt) ?? null,
    createDepartment: async (data) => {
      const id = randomUUID();
      const dept = { id, ...data, deletedAt: null };
      departments.set(id, dept);
      return dept as any;
    },
    updateDepartment: async (id: string, data) => {
      const d = departments.get(id);
      Object.assign(d, data);
      return d;
    },
    softDeleteDepartment: async (id: string) => {
      const d = departments.get(id);
      d.deletedAt = new Date();
      return d;
    },

    // Courses
    findCourses: async () => Array.from(courses.values()).filter((c) => !c.deletedAt),
    findCourseById: async (id: string) => courses.get(id) ?? null,
    findCourseByCode: async (code: string) =>
      Array.from(courses.values()).find((c) => c.code === code && !c.deletedAt) ?? null,
    createCourse: async (data) => {
      const id = randomUUID();
      const course = { id, ...data, deletedAt: null };
      courses.set(id, course);
      return course as any;
    },

    // Semesters
    findSemesters: async () => Array.from(semesters.values()),
    findSemesterById: async (id: string) => semesters.get(id) ?? null,
    findSemesterByUnique: async (courseId, number, academicYear) =>
      Array.from(semesters.values()).find(
        (s) => s.courseId === courseId && s.number === number && s.academicYear === academicYear,
      ) ?? null,
    createSemester: async (data) => {
      const id = randomUUID();
      const sem = { id, ...data };
      semesters.set(id, sem);
      return sem as any;
    },

    // Sections
    findSections: async () => Array.from(sections.values()).filter((s) => !s.deletedAt),
    findSectionById: async (id: string) => sections.get(id) ?? null,
    findSectionByName: async (semesterId, name) =>
      Array.from(sections.values()).find((s) => s.semesterId === semesterId && s.name === name && !s.deletedAt) ??
      null,
    createSection: async (data) => {
      const id = randomUUID();
      const sec = { id, ...data, deletedAt: null };
      sections.set(id, sec);
      return sec as any;
    },

    // Subjects
    findSubjects: async () => Array.from(subjects.values()).filter((s) => !s.deletedAt),
    findSubjectById: async (id: string) => subjects.get(id) ?? null,
    findSubjectByCode: async (code: string) =>
      Array.from(subjects.values()).find((s) => s.code === code && !s.deletedAt) ?? null,
    createSubject: async (data) => {
      const id = randomUUID();
      const sub = { id, ...data, deletedAt: null };
      subjects.set(id, sub);
      return sub as any;
    },

    // Allocations
    findAllocations: async () => Array.from(allocations.values()),
    findAllocationBySubjectAndSection: async (subjectId, sectionId) =>
      Array.from(allocations.values()).find((a) => a.subjectId === subjectId && a.sectionId === sectionId) ?? null,
    createAllocation: async (data) => {
      const id = randomUUID();
      const alloc = { id, ...data };
      allocations.set(id, alloc);
      return alloc as any;
    },
    deleteAllocation: async (id: string) => {
      const a = allocations.get(id);
      allocations.delete(id);
      return a;
    },
  };

  return { repo: repo as AcademicsRepository, departments, courses, semesters, sections, subjects, allocations };
}

describe('AcademicsService', () => {
  it('creates and updates department, preventing duplicate codes', async () => {
    const { repo } = createMockAcademicsRepo();
    const audit = new FakeAudit();
    const service = new AcademicsService(repo, audit);

    const dept = await service.createDepartment({ name: 'Computer Science', code: 'CSE' });
    expect(dept.code).toBe('CSE');

    await expect(service.createDepartment({ name: 'CS Duplicate', code: 'CSE' })).rejects.toThrow(ConflictError);
  });

  it('validates semester dates and rejects if start date is after end date', async () => {
    const { repo } = createMockAcademicsRepo();
    const audit = new FakeAudit();
    const service = new AcademicsService(repo, audit);

    const dept = await service.createDepartment({ name: 'Electronics', code: 'ECE' });
    const course = await service.createCourse({ name: 'B.Tech ECE', code: 'ECE-BTECH', departmentId: dept.id });

    await expect(
      service.createSemester({
        courseId: course.id,
        number: 1,
        academicYear: '2026-27',
        startDate: '2026-12-01',
        endDate: '2026-06-01', // End date before start date
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('allocates subject to section only if they belong to the same semester and prevents double allocation', async () => {
    const { repo } = createMockAcademicsRepo();
    const audit = new FakeAudit();
    const service = new AcademicsService(repo, audit);

    const dept = await service.createDepartment({ name: 'Mechanical', code: 'MECH' });
    const course = await service.createCourse({ name: 'B.Tech ME', code: 'ME-BTECH', departmentId: dept.id });
    const sem1 = await service.createSemester({
      courseId: course.id,
      number: 1,
      academicYear: '2026-27',
      startDate: '2026-08-01',
      endDate: '2026-12-15',
    });
    const sem2 = await service.createSemester({
      courseId: course.id,
      number: 2,
      academicYear: '2026-27',
      startDate: '2027-01-05',
      endDate: '2027-05-20',
    });

    const sec1 = await service.createSection({ semesterId: sem1.id, name: 'A' });
    const sub2 = await service.createSubject({ semesterId: sem2.id, code: 'ME201', name: 'Thermodynamics' });
    const facultyId = randomUUID();

    // Subject from sem2 and section from sem1 -> rejected
    await expect(
      service.createAllocation({ subjectId: sub2.id, sectionId: sec1.id, facultyId }),
    ).rejects.toThrow(BadRequestError);

    // Subject from sem1
    const sub1 = await service.createSubject({ semesterId: sem1.id, code: 'ME101', name: 'Mechanics' });
    const alloc = await service.createAllocation({ subjectId: sub1.id, sectionId: sec1.id, facultyId });
    expect(alloc.id).toBeDefined();

    // Duplicate allocation for same subject + section -> rejected
    await expect(
      service.createAllocation({ subjectId: sub1.id, sectionId: sec1.id, facultyId: randomUUID() }),
    ).rejects.toThrow(ConflictError);
  });
});
