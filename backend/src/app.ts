import { readFileSync } from 'node:fs';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { parse as parseYaml } from 'yaml';
import { config } from './common/config';
import { API_PREFIX } from './common/constants';
import { ForbiddenError } from './common/errors';
import { apiLimiter, errorHandler, httpLogger, notFound, requestId } from './common/middleware';
import { createAcademicsRoutes } from './modules/academics/academics.routes';
import type { AcademicsService } from './modules/academics/academics.service';
import { createAssignmentsRoutes } from './modules/assignments/assignments.routes';
import type { AssignmentsService } from './modules/assignments/assignments.service';
import { createAttendanceRoutes } from './modules/attendance/attendance.routes';
import type { AttendanceService } from './modules/attendance/attendance.service';
import { createAuthRoutes } from './modules/auth/auth.routes';
import type { AuthService } from './modules/auth/auth.service';
import { createDashboardRoutes } from './modules/dashboard/dashboard.routes';
import type { DashboardService } from './modules/dashboard/dashboard.service';
import { createExamsRoutes } from './modules/exams/exams.routes';
import type { ExamsService } from './modules/exams/exams.service';
import { createFeesRoutes } from './modules/fees/fees.routes';
import type { FeesService } from './modules/fees/fees.service';
import { healthRoutes } from './modules/health/health.routes';
import { createNotificationsRoutes } from './modules/notifications/notifications.routes';
import type { NotificationsService } from './modules/notifications/notifications.service';
import { createSupportRoutes } from './modules/support/support.routes';
import type { SupportService } from './modules/support/support.service';
import { createTimetableRoutes } from './modules/timetable/timetable.routes';
import type { TimetableService } from './modules/timetable/timetable.service';
import { createUsersRoutes } from './modules/users/users.routes';
import type { UsersService } from './modules/users/users.service';

function loadOpenApi(): object | null {
  try {
    const file = path.resolve(__dirname, '..', 'docs', 'openapi.yaml');
    return parseYaml(readFileSync(file, 'utf8')) as object;
  } catch {
    return null;
  }
}

export interface AppDeps {
  authService?: AuthService;
  usersService?: UsersService;
  academicsService?: AcademicsService;
  timetableService?: TimetableService;
  attendanceService?: AttendanceService;
  notificationsService?: NotificationsService;
  assignmentsService?: AssignmentsService;
  examsService?: ExamsService;
  feesService?: FeesService;
  supportService?: SupportService;
  dashboardService?: DashboardService;
}

export function createApp(deps: AppDeps = {}): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(requestId);
  app.use(httpLogger);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
        return cb(new ForbiddenError(`Origin ${origin} is not allowed`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // Platform probes (no rate limit, no auth)
  app.use('/health', healthRoutes);

  const openApi = loadOpenApi();
  if (openApi && !config.isProd) {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApi));
  }

  // Versioned API
  const api = express.Router();
  api.use(apiLimiter);
  api.use('/health', healthRoutes);
  api.use('/auth', createAuthRoutes(deps.authService));
  api.use('/users', createUsersRoutes(deps.usersService));
  api.use('/academics', createAcademicsRoutes(deps.academicsService));
  api.use('/timetable', createTimetableRoutes(deps.timetableService));
  api.use('/attendance', createAttendanceRoutes(deps.attendanceService));
  api.use('/notifications', createNotificationsRoutes(deps.notificationsService));
  api.use('/assignments', createAssignmentsRoutes(deps.assignmentsService));
  api.use('/exams', createExamsRoutes(deps.examsService));
  api.use('/fees', createFeesRoutes(deps.feesService));
  api.use('/support', createSupportRoutes(deps.supportService));
  api.use('/dashboard', createDashboardRoutes(deps.dashboardService));
  app.use(API_PREFIX, api);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
