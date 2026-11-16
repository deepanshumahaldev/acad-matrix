import { Router } from 'express';
import { getPrisma } from '../../common/db/prisma';
import { authenticate } from '../../common/middleware';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { DashboardController } from './dashboard.controller';
import { DashboardRepository } from './dashboard.repository';
import { DashboardService } from './dashboard.service';

export function createDefaultDashboardService(): DashboardService {
  return new DashboardService(new DashboardRepository(getPrisma));
}

export function createDashboardRoutes(service: DashboardService = createDefaultDashboardService()): Router {
  const c = new DashboardController(service);
  const router = Router();

  router.use(authenticate());

  router.get('/', asyncHandler(c.getDashboard));

  return router;
}
