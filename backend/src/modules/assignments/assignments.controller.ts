import type { Request, Response } from 'express';
import { sendCreated, sendSuccess } from '../../common/utils/response';
import type { AssignmentsService } from './assignments.service';

export class AssignmentsController {
  constructor(private readonly service: AssignmentsService) {}

  listAssignments = async (req: Request, res: Response) => {
    const allocationId = typeof req.query.allocationId === 'string' ? req.query.allocationId : undefined;
    const facultyId = typeof req.query.facultyId === 'string' ? req.query.facultyId : undefined;
    const sectionId = typeof req.query.sectionId === 'string' ? req.query.sectionId : undefined;
    const upcoming = req.query.upcoming === 'true';

    const data = await this.service.listAssignments(
      { allocationId, facultyId, sectionId, upcoming },
      req.user!.id,
      req.user!.role,
    );
    return sendSuccess(res, data);
  };

  getAssignment = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.getAssignmentById(id);
    return sendSuccess(res, data);
  };

  createAssignment = async (req: Request, res: Response) => {
    const data = await this.service.createAssignment(
      req.body,
      req.user!.id,
      req.user!.role,
      req.ip,
    );
    return sendCreated(res, data);
  };

  updateAssignment = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.updateAssignment(
      id,
      req.body,
      req.user!.id,
      req.user!.role,
      req.ip,
    );
    return sendSuccess(res, data);
  };

  deleteAssignment = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await this.service.deleteAssignment(
      id,
      req.user!.id,
      req.user!.role,
      req.ip,
    );
    return sendSuccess(res, data);
  };

  submitAssignment = async (req: Request, res: Response) => {
    const assignmentId = req.params.id as string;
    const data = await this.service.submitAssignment(
      assignmentId,
      req.body,
      req.user!.id,
      req.ip,
    );
    return sendCreated(res, data);
  };

  gradeSubmission = async (req: Request, res: Response) => {
    const submissionId = req.params.id as string;
    const data = await this.service.gradeSubmission(
      submissionId,
      req.body,
      req.user!.id,
      req.user!.role,
      req.ip,
    );
    return sendSuccess(res, data);
  };
}
