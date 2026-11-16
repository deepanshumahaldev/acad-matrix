import { NotFoundError } from '../../common/errors';
import type { DashboardRepository } from './dashboard.repository';
import type { DashboardData } from './dashboard.types';

export class DashboardService {
  constructor(private readonly repo: DashboardRepository) {}

  async getDashboard(userId: string, role: string): Promise<DashboardData> {
    if (role === 'ADMIN') {
      const stats = await this.repo.getAdminStats();
      return { role: 'ADMIN', ...stats };
    }

    if (role === 'FACULTY') {
      const faculty = await this.repo.findFacultyByUserId(userId);
      if (!faculty) throw new NotFoundError('Faculty profile not found');
      const stats = await this.repo.getFacultyStats(faculty.id);
      return { role: 'FACULTY', ...stats };
    }

    if (role === 'STUDENT') {
      const student = await this.repo.findStudentByUserId(userId);
      if (!student) throw new NotFoundError('Student profile not found');
      const stats = await this.repo.getStudentStats(student.id, student.sectionId, student.semesterId);
      return { role: 'STUDENT', ...stats };
    }

    throw new NotFoundError(`Unsupported dashboard role: ${role}`);
  }
}
