import { BadRequestError, ConflictError, NotFoundError } from '../../common/errors';
import type { AuditLogger } from '../../common/services/audit';
import type { AcademicsRepository } from './academics.repository';
import type {
  AllocationFilterQuery,
  CreateAllocationInput,
  CreateCourseInput,
  CreateDepartmentInput,
  CreateSectionInput,
  CreateSemesterInput,
  CreateSubjectInput,
  UpdateCourseInput,
  UpdateDepartmentInput,
  UpdateSectionInput,
  UpdateSemesterInput,
  UpdateSubjectInput,
} from './academics.types';

export class AcademicsService {
  constructor(
    private readonly repo: AcademicsRepository,
    private readonly audit: AuditLogger,
  ) {}

  // ── Departments ──
  async listDepartments() {
    return this.repo.findDepartments();
  }

  async getDepartmentById(id: string) {
    const dept = await this.repo.findDepartmentById(id);
    if (!dept) throw new NotFoundError('Department not found');
    return dept;
  }

  async createDepartment(input: CreateDepartmentInput, actorId?: string, ip?: string) {
    const existing = await this.repo.findDepartmentByCode(input.code);
    if (existing) throw new ConflictError(`Department code ${input.code} already exists`);

    const dept = await this.repo.createDepartment(input);
    await this.audit.log({ actorId, action: 'DEPARTMENT_CREATED', entity: 'Department', entityId: dept.id, ipAddress: ip });
    return dept;
  }

  async updateDepartment(id: string, input: UpdateDepartmentInput, actorId?: string, ip?: string) {
    await this.getDepartmentById(id);
    if (input.code) {
      const existing = await this.repo.findDepartmentByCode(input.code);
      if (existing && existing.id !== id) throw new ConflictError(`Department code ${input.code} already exists`);
    }
    const updated = await this.repo.updateDepartment(id, input);
    await this.audit.log({ actorId, action: 'DEPARTMENT_UPDATED', entity: 'Department', entityId: id, ipAddress: ip });
    return updated;
  }

  async deleteDepartment(id: string, actorId?: string, ip?: string) {
    await this.getDepartmentById(id);
    const deleted = await this.repo.softDeleteDepartment(id);
    await this.audit.log({ actorId, action: 'DEPARTMENT_DELETED', entity: 'Department', entityId: id, ipAddress: ip });
    return deleted;
  }

  // ── Courses ──
  async listCourses(departmentId?: string) {
    return this.repo.findCourses(departmentId);
  }

  async getCourseById(id: string) {
    const course = await this.repo.findCourseById(id);
    if (!course) throw new NotFoundError('Course not found');
    return course;
  }

  async createCourse(input: CreateCourseInput, actorId?: string, ip?: string) {
    await this.getDepartmentById(input.departmentId);
    const existing = await this.repo.findCourseByCode(input.code);
    if (existing) throw new ConflictError(`Course code ${input.code} already exists`);

    const course = await this.repo.createCourse(input);
    await this.audit.log({ actorId, action: 'COURSE_CREATED', entity: 'Course', entityId: course.id, ipAddress: ip });
    return course;
  }

  async updateCourse(id: string, input: UpdateCourseInput, actorId?: string, ip?: string) {
    await this.getCourseById(id);
    if (input.code) {
      const existing = await this.repo.findCourseByCode(input.code);
      if (existing && existing.id !== id) throw new ConflictError(`Course code ${input.code} already exists`);
    }
    const updated = await this.repo.updateCourse(id, input);
    await this.audit.log({ actorId, action: 'COURSE_UPDATED', entity: 'Course', entityId: id, ipAddress: ip });
    return updated;
  }

  async deleteCourse(id: string, actorId?: string, ip?: string) {
    await this.getCourseById(id);
    const deleted = await this.repo.softDeleteCourse(id);
    await this.audit.log({ actorId, action: 'COURSE_DELETED', entity: 'Course', entityId: id, ipAddress: ip });
    return deleted;
  }

  // ── Semesters ──
  async listSemesters(courseId?: string, academicYear?: string) {
    return this.repo.findSemesters(courseId, academicYear);
  }

  async getSemesterById(id: string) {
    const sem = await this.repo.findSemesterById(id);
    if (!sem) throw new NotFoundError('Semester not found');
    return sem;
  }

  async createSemester(input: CreateSemesterInput, actorId?: string, ip?: string) {
    await this.getCourseById(input.courseId);
    if (new Date(input.startDate) >= new Date(input.endDate)) {
      throw new BadRequestError('Start date must be before end date');
    }
    const dup = await this.repo.findSemesterByUnique(input.courseId, input.number, input.academicYear);
    if (dup) throw new ConflictError(`Semester ${input.number} for ${input.academicYear} already exists in this course`);

    const sem = await this.repo.createSemester({
      ...input,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
    });
    await this.audit.log({ actorId, action: 'SEMESTER_CREATED', entity: 'Semester', entityId: sem.id, ipAddress: ip });
    return sem;
  }

  async updateSemester(id: string, input: UpdateSemesterInput, actorId?: string, ip?: string) {
    const sem = await this.getSemesterById(id);
    const start = input.startDate ? new Date(input.startDate) : sem.startDate;
    const end = input.endDate ? new Date(input.endDate) : sem.endDate;
    if (start >= end) throw new BadRequestError('Start date must be before end date');

    const updated = await this.repo.updateSemester(id, {
      ...input,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    });
    await this.audit.log({ actorId, action: 'SEMESTER_UPDATED', entity: 'Semester', entityId: id, ipAddress: ip });
    return updated;
  }

  // ── Sections ──
  async listSections(semesterId?: string) {
    return this.repo.findSections(semesterId);
  }

  async getSectionById(id: string) {
    const sec = await this.repo.findSectionById(id);
    if (!sec) throw new NotFoundError('Section not found');
    return sec;
  }

  async createSection(input: CreateSectionInput, actorId?: string, ip?: string) {
    await this.getSemesterById(input.semesterId);
    const existing = await this.repo.findSectionByName(input.semesterId, input.name);
    if (existing) throw new ConflictError(`Section ${input.name} already exists in this semester`);

    const sec = await this.repo.createSection(input);
    await this.audit.log({ actorId, action: 'SECTION_CREATED', entity: 'Section', entityId: sec.id, ipAddress: ip });
    return sec;
  }

  async updateSection(id: string, input: UpdateSectionInput, actorId?: string, ip?: string) {
    const sec = await this.getSectionById(id);
    const dup = await this.repo.findSectionByName(sec.semesterId, input.name);
    if (dup && dup.id !== id) throw new ConflictError(`Section ${input.name} already exists in this semester`);

    const updated = await this.repo.updateSection(id, input);
    await this.audit.log({ actorId, action: 'SECTION_UPDATED', entity: 'Section', entityId: id, ipAddress: ip });
    return updated;
  }

  async deleteSection(id: string, actorId?: string, ip?: string) {
    await this.getSectionById(id);
    const deleted = await this.repo.softDeleteSection(id);
    await this.audit.log({ actorId, action: 'SECTION_DELETED', entity: 'Section', entityId: id, ipAddress: ip });
    return deleted;
  }

  // ── Subjects ──
  async listSubjects(semesterId?: string) {
    return this.repo.findSubjects(semesterId);
  }

  async getSubjectById(id: string) {
    const sub = await this.repo.findSubjectById(id);
    if (!sub) throw new NotFoundError('Subject not found');
    return sub;
  }

  async createSubject(input: CreateSubjectInput, actorId?: string, ip?: string) {
    await this.getSemesterById(input.semesterId);
    const existing = await this.repo.findSubjectByCode(input.code);
    if (existing) throw new ConflictError(`Subject code ${input.code} already exists`);

    const sub = await this.repo.createSubject(input);
    await this.audit.log({ actorId, action: 'SUBJECT_CREATED', entity: 'Subject', entityId: sub.id, ipAddress: ip });
    return sub;
  }

  async updateSubject(id: string, input: UpdateSubjectInput, actorId?: string, ip?: string) {
    await this.getSubjectById(id);
    if (input.code) {
      const existing = await this.repo.findSubjectByCode(input.code);
      if (existing && existing.id !== id) throw new ConflictError(`Subject code ${input.code} already exists`);
    }
    const updated = await this.repo.updateSubject(id, input);
    await this.audit.log({ actorId, action: 'SUBJECT_UPDATED', entity: 'Subject', entityId: id, ipAddress: ip });
    return updated;
  }

  async deleteSubject(id: string, actorId?: string, ip?: string) {
    await this.getSubjectById(id);
    const deleted = await this.repo.softDeleteSubject(id);
    await this.audit.log({ actorId, action: 'SUBJECT_DELETED', entity: 'Subject', entityId: id, ipAddress: ip });
    return deleted;
  }

  // ── Allocations ──
  async listAllocations(filter: AllocationFilterQuery) {
    return this.repo.findAllocations(filter);
  }

  async createAllocation(input: CreateAllocationInput, actorId?: string, ip?: string) {
    const [subject, section] = await Promise.all([
      this.getSubjectById(input.subjectId),
      this.getSectionById(input.sectionId),
    ]);

    if (subject.semesterId !== section.semesterId) {
      throw new BadRequestError('Subject and section must belong to the same semester');
    }

    const dup = await this.repo.findAllocationBySubjectAndSection(input.subjectId, input.sectionId);
    if (dup) throw new ConflictError('This subject is already allocated for this section');

    const alloc = await this.repo.createAllocation(input);
    await this.audit.log({ actorId, action: 'ALLOCATION_CREATED', entity: 'SubjectAllocation', entityId: alloc.id, ipAddress: ip });
    return alloc;
  }

  async deleteAllocation(id: string, actorId?: string, ip?: string) {
    const deleted = await this.repo.deleteAllocation(id);
    await this.audit.log({ actorId, action: 'ALLOCATION_DELETED', entity: 'SubjectAllocation', entityId: id, ipAddress: ip });
    return deleted;
  }
}
