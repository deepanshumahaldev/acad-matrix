import type { Prisma, PrismaClient } from '@prisma/client';
import type { AllocationFilterQuery } from './academics.types';

export class AcademicsRepository {
  constructor(private readonly getDb: () => PrismaClient) {}

  // ── Departments ──
  async findDepartments() {
    return this.getDb().department.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { courses: true, faculty: true } },
      },
    });
  }

  async findDepartmentById(id: string) {
    return this.getDb().department.findUnique({
      where: { id },
      include: {
        courses: { where: { deletedAt: null } },
        faculty: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      },
    });
  }

  async findDepartmentByCode(code: string) {
    return this.getDb().department.findUnique({ where: { code } });
  }

  async createDepartment(data: Prisma.DepartmentCreateInput) {
    return this.getDb().department.create({ data });
  }

  async updateDepartment(id: string, data: Prisma.DepartmentUpdateInput) {
    return this.getDb().department.update({ where: { id }, data });
  }

  async softDeleteDepartment(id: string) {
    return this.getDb().department.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── Courses ──
  async findCourses(departmentId?: string) {
    return this.getDb().course.findMany({
      where: { deletedAt: null, ...(departmentId ? { departmentId } : {}) },
      orderBy: { name: 'asc' },
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { semesters: true, students: true } },
      },
    });
  }

  async findCourseById(id: string) {
    return this.getDb().course.findUnique({
      where: { id },
      include: {
        department: true,
        semesters: { orderBy: { number: 'asc' }, include: { sections: true, subjects: true } },
      },
    });
  }

  async findCourseByCode(code: string) {
    return this.getDb().course.findUnique({ where: { code } });
  }

  async createCourse(data: Prisma.CourseUncheckedCreateInput) {
    return this.getDb().course.create({
      data,
      include: { department: { select: { id: true, name: true, code: true } } },
    });
  }

  async updateCourse(id: string, data: Prisma.CourseUncheckedUpdateInput) {
    return this.getDb().course.update({
      where: { id },
      data,
      include: { department: { select: { id: true, name: true, code: true } } },
    });
  }

  async softDeleteCourse(id: string) {
    return this.getDb().course.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── Semesters ──
  async findSemesters(courseId?: string, academicYear?: string) {
    return this.getDb().semester.findMany({
      where: {
        ...(courseId ? { courseId } : {}),
        ...(academicYear ? { academicYear } : {}),
      },
      orderBy: [{ academicYear: 'desc' }, { number: 'asc' }],
      include: {
        course: { select: { id: true, name: true, code: true } },
        _count: { select: { sections: true, subjects: true, students: true } },
      },
    });
  }

  async findSemesterById(id: string) {
    return this.getDb().semester.findUnique({
      where: { id },
      include: {
        course: true,
        sections: { where: { deletedAt: null }, orderBy: { name: 'asc' } },
        subjects: { where: { deletedAt: null }, orderBy: { code: 'asc' } },
      },
    });
  }

  async findSemesterByUnique(courseId: string, number: number, academicYear: string) {
    return this.getDb().semester.findUnique({
      where: { courseId_number_academicYear: { courseId, number, academicYear } },
    });
  }

  async createSemester(data: Prisma.SemesterUncheckedCreateInput) {
    return this.getDb().semester.create({
      data,
      include: { course: { select: { id: true, name: true, code: true } } },
    });
  }

  async updateSemester(id: string, data: Prisma.SemesterUncheckedUpdateInput) {
    return this.getDb().semester.update({
      where: { id },
      data,
      include: { course: { select: { id: true, name: true, code: true } } },
    });
  }

  // ── Sections ──
  async findSections(semesterId?: string) {
    return this.getDb().section.findMany({
      where: { deletedAt: null, ...(semesterId ? { semesterId } : {}) },
      orderBy: { name: 'asc' },
      include: {
        semester: { include: { course: { select: { id: true, name: true, code: true } } } },
        _count: { select: { students: true, allocations: true } },
      },
    });
  }

  async findSectionById(id: string) {
    return this.getDb().section.findUnique({
      where: { id },
      include: {
        semester: { include: { course: true } },
        students: { include: { user: true } },
        allocations: { include: { subject: true, faculty: { include: { user: true } } } },
      },
    });
  }

  async findSectionByName(semesterId: string, name: string) {
    return this.getDb().section.findUnique({
      where: { semesterId_name: { semesterId, name } },
    });
  }

  async createSection(data: Prisma.SectionUncheckedCreateInput) {
    return this.getDb().section.create({
      data,
      include: { semester: { include: { course: { select: { id: true, name: true, code: true } } } } },
    });
  }

  async updateSection(id: string, data: Prisma.SectionUncheckedUpdateInput) {
    return this.getDb().section.update({
      where: { id },
      data,
      include: { semester: { include: { course: { select: { id: true, name: true, code: true } } } } },
    });
  }

  async softDeleteSection(id: string) {
    return this.getDb().section.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── Subjects ──
  async findSubjects(semesterId?: string) {
    return this.getDb().subject.findMany({
      where: { deletedAt: null, ...(semesterId ? { semesterId } : {}) },
      orderBy: { code: 'asc' },
      include: {
        semester: { include: { course: { select: { id: true, name: true, code: true } } } },
        _count: { select: { allocations: true } },
      },
    });
  }

  async findSubjectById(id: string) {
    return this.getDb().subject.findUnique({
      where: { id },
      include: {
        semester: { include: { course: true } },
        allocations: { include: { section: true, faculty: { include: { user: true } } } },
      },
    });
  }

  async findSubjectByCode(code: string) {
    return this.getDb().subject.findUnique({ where: { code } });
  }

  async createSubject(data: Prisma.SubjectUncheckedCreateInput) {
    return this.getDb().subject.create({
      data,
      include: { semester: { include: { course: { select: { id: true, name: true, code: true } } } } },
    });
  }

  async updateSubject(id: string, data: Prisma.SubjectUncheckedUpdateInput) {
    return this.getDb().subject.update({
      where: { id },
      data,
      include: { semester: { include: { course: { select: { id: true, name: true, code: true } } } } },
    });
  }

  async softDeleteSubject(id: string) {
    return this.getDb().subject.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── Allocations ──
  async findAllocations(filter: AllocationFilterQuery) {
    return this.getDb().subjectAllocation.findMany({
      where: {
        ...(filter.facultyId ? { facultyId: filter.facultyId } : {}),
        ...(filter.subjectId ? { subjectId: filter.subjectId } : {}),
        ...(filter.sectionId ? { sectionId: filter.sectionId } : {}),
        ...(filter.semesterId ? { section: { semesterId: filter.semesterId } } : {}),
      },
      include: {
        subject: true,
        section: { include: { semester: { include: { course: true } } } },
        faculty: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllocationBySubjectAndSection(subjectId: string, sectionId: string) {
    return this.getDb().subjectAllocation.findUnique({
      where: { subjectId_sectionId: { subjectId, sectionId } },
    });
  }

  async createAllocation(data: Prisma.SubjectAllocationUncheckedCreateInput) {
    return this.getDb().subjectAllocation.create({
      data,
      include: {
        subject: true,
        section: { include: { semester: { include: { course: true } } } },
        faculty: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      },
    });
  }

  async deleteAllocation(id: string) {
    return this.getDb().subjectAllocation.delete({ where: { id } });
  }
}
