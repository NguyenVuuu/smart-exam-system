import type { Request, Response } from "express";
import { z } from "zod";
import { sendSuccess as send } from "../../../utils/httpResponse";
import * as courseService from "../services/course-offering.service";
import * as departmentService from "../services/department.service";
import * as semesterService from "../services/semester.service";
import * as subjectService from "../services/subject.service";
import {
  courseOfferingBodySchema,
  courseOfferingQuerySchema,
  departmentBodySchema,
  departmentHeadSchema,
  departmentQuerySchema,
  semesterBodySchema,
  semesterQuerySchema,
  subjectBodySchema,
  subjectQuerySchema,
} from "../validators/academic.validator";

const idParam = z.object({ id: z.string().min(1) });
export const listSemesters = async (req: Request, res: Response) =>
  send(res, await semesterService.list(semesterQuerySchema.parse(req.query)));
export const createSemester = async (req: Request, res: Response) =>
  send(
    res,
    await semesterService.create(semesterBodySchema.parse(req.body)),
    201,
  );
export const updateSemester = async (req: Request, res: Response) =>
  send(
    res,
    await semesterService.update(
      idParam.parse(req.params).id,
      semesterBodySchema.parse(req.body),
    ),
  );
export const activateSemester = async (req: Request, res: Response) =>
  send(res, await semesterService.activate(idParam.parse(req.params).id));

export const listDepartments = async (req: Request, res: Response) =>
  send(
    res,
    await departmentService.list(departmentQuerySchema.parse(req.query)),
  );
export const createDepartment = async (req: Request, res: Response) =>
  send(
    res,
    await departmentService.create(departmentBodySchema.parse(req.body)),
    201,
  );
export const updateDepartment = async (req: Request, res: Response) =>
  send(
    res,
    await departmentService.update(
      idParam.parse(req.params).id,
      departmentBodySchema.parse(req.body),
    ),
  );
export const assignDepartmentHead = async (req: Request, res: Response) =>
  send(
    res,
    await departmentService.assignHead(
      idParam.parse(req.params).id,
      departmentHeadSchema.parse(req.body).teacherId,
    ),
  );

export const listSubjects = async (req: Request, res: Response) =>
  send(res, await subjectService.list(subjectQuerySchema.parse(req.query)));
export const createSubject = async (req: Request, res: Response) =>
  send(
    res,
    await subjectService.create(subjectBodySchema.parse(req.body)),
    201,
  );
export const updateSubject = async (req: Request, res: Response) =>
  send(
    res,
    await subjectService.update(
      idParam.parse(req.params).id,
      subjectBodySchema.parse(req.body),
    ),
  );

export const listCourseOfferings = async (req: Request, res: Response) =>
  send(
    res,
    await courseService.list(courseOfferingQuerySchema.parse(req.query)),
  );
export const createCourseOffering = async (req: Request, res: Response) =>
  send(
    res,
    await courseService.create(courseOfferingBodySchema.parse(req.body)),
    201,
  );
export const updateCourseOffering = async (req: Request, res: Response) =>
  send(
    res,
    await courseService.update(
      idParam.parse(req.params).id,
      courseOfferingBodySchema.parse(req.body),
    ),
  );
