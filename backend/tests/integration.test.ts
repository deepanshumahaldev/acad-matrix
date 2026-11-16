import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { signAccessToken } from '../src/common/utils/jwt';
import { DashboardService } from '../src/modules/dashboard/dashboard.service';
import { SupportService } from '../src/modules/support/support.service';
import { buildHarness } from './helpers/fakes';

describe('AcadMatrix End-to-End API Integration', () => {
  let app: ReturnType<typeof createApp>;
  let adminToken: string;
  let studentToken: string;

  beforeEach(async () => {
    const hAdmin = await buildHarness({ role: 'ADMIN' });
    const hStudent = await buildHarness({ role: 'STUDENT' });

    adminToken = signAccessToken({
      sub: hAdmin.user.id,
      role: 'ADMIN',
      mcp: false,
    });

    studentToken = signAccessToken({
      sub: hStudent.user.id,
      role: 'STUDENT',
      mcp: false,
    });

    const mockDashboardService: Partial<DashboardService> = {
      getDashboard: async (_userId, role) => {
        if (role === 'ADMIN') {
          return {
            role: 'ADMIN',
            counts: { students: 10, faculty: 5, departments: 2, courses: 3, openTickets: 1 },
            fees: { totalCollected: 100000, totalPending: 20000 },
            todaySessionsCount: 4,
            recentAuditLogs: [],
          };
        }
        return {
          role: 'STUDENT',
          todaySchedule: [],
          attendance: { totalClasses: 20, attendedClasses: 18, overallPercentage: 90, isLowAttendance: false },
          fees: { netDue: 50000, totalPaid: 50000, balanceRemaining: 0 },
          upcomingAssignments: [],
          upcomingExams: [],
        };
      },
    };

    const mockSupportService: Partial<SupportService> = {
      createTicket: async (input, userId) => ({
        id: randomUUID(),
        number: 101,
        raisedById: userId,
        subject: input.subject,
        category: input.category || null,
        priority: input.priority || 'MEDIUM',
        status: 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any),
      replyTicket: async (id, input, userId) => ({
        id: randomUUID(),
        ticketId: id,
        senderId: userId,
        body: input.body,
        createdAt: new Date(),
      } as any),
    };

    app = createApp({
      authService: hAdmin.service,
      dashboardService: mockDashboardService as DashboardService,
      supportService: mockSupportService as SupportService,
    });
  });

  it('probes system health with 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.uptimeSeconds).toBeTypeOf('number');
  });

  it('rejects unauthenticated requests to protected routes with 401', async () => {
    const res = await request(app).get('/api/v1/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns role-tailored dashboard payload for authenticated user', async () => {
    const adminRes = await request(app)
      .get('/api/v1/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminRes.status).toBe(200);
    expect(adminRes.body.data.role).toBe('ADMIN');
    expect(adminRes.body.data.counts.students).toBe(10);

    const studentRes = await request(app)
      .get('/api/v1/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(studentRes.status).toBe(200);
    expect(studentRes.body.data.role).toBe('STUDENT');
    expect(studentRes.body.data.attendance.overallPercentage).toBe(90);
  });

  it('raises support ticket and posts conversation replies', async () => {
    const createRes = await request(app)
      .post('/api/v1/support')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        subject: 'Cannot access WiFi portal',
        category: 'IT & Portal',
        priority: 'HIGH',
        initialMessage: 'My login credentials fail on the hostel router.',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.subject).toBe('Cannot access WiFi portal');

    const ticketId = createRes.body.data.id;
    const replyRes = await request(app)
      .post(`/api/v1/support/${ticketId}/reply`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ body: 'Also tried on the library router, same issue.' });

    expect(replyRes.status).toBe(201);
    expect(replyRes.body.data.body).toContain('library router');
  });

  it('returns structured 422 with validation errors for invalid input', async () => {
    const res = await request(app)
      .post('/api/v1/support')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ subject: 'AB' }); // Too short, missing initialMessage

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });
});
