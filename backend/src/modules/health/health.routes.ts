import { Router } from 'express';
import { getPrisma } from '../../common/db/prisma';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { HealthController } from './health.controller';
import { HealthRepository } from './health.repository';
import { HealthService } from './health.service';

const controller = new HealthController(new HealthService(new HealthRepository(getPrisma)));

export const healthRoutes = Router();

healthRoutes.get('/', controller.live);
healthRoutes.get('/ready', asyncHandler(controller.ready));
