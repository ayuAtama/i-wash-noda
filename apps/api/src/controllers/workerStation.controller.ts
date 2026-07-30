// /api/src/controllers/workerStation.controller.ts
import { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";
import { WorkerStationService } from "@/services/workerStation.services";
import {
  AssigJobParamsDTO,
  AssignJobServiceStrategyDTO,
  GetCompleteJobsStrategyDTO,
  MarkDoneParamsPayloadDTO,
  MarkDoneServiceStrategyDTO,
  ReInputItemBodyPayloadDTO,
  ReInputItemParamsPayloadDTO,
  ReInputServiceStrategyPayloadDTO,
} from "@/validations/workerStation.validation";
import { WorkerStation } from "@/generated/prisma/client";

export class WorkerStationController {
  private workerServices: WorkerStationService;

  constructor(workerServices: WorkerStationService) {
    this.workerServices = workerServices;
  }

  checkAvailableJobs = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { outlet_id, worker_station } = req.context!;
      if (!outlet_id) throw new HttpError(401, "Outlet id not found");
      if (!worker_station) throw new HttpError(401, "Worker station not found");

      const availableJobs = await this.workerServices.checkAvailableJobs({
        outlet_id,
        worker_station,
      });

      // return the available jobs
      if (availableJobs.data.length === 0) {
        res.status(404).json({ success: false, message: "No available jobs" });
      } else {
        res.status(200).json(availableJobs);
      }
    } catch (error) {
      next(error);
    }
  };

  // get the active jobs
  checkActiveJobs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // check the cookies
      const data = req.access_token;
      if (!data) throw new HttpError(401, "User not found");

      // extract the user id (worker id)
      const { sub: worker_id } = data;
      if (!worker_id) throw new HttpError(401, "User not found");

      // get the outlet id and station name from resolveContext middlewere
      const { outlet_id, worker_station } = req.context!;
      if (!outlet_id) throw new HttpError(401, "Outlet id not found");
      if (!worker_station) throw new HttpError(401, "Worker station not found");

      // call the service
      const activeJobs = await this.workerServices.checkActiveJobs({
        outlet_id,
        worker_station,
        worker_id,
      });

      // return the active jobs
      res.status(200).json(activeJobs);
    } catch (error) {
      next(error);
    }
  };

  assignJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.access_token) throw new HttpError(401, "Please login first");
      const userId = req.access_token.sub;
      if (!userId) throw new HttpError(401, "Please login first");

      if (!req.context)
        throw new HttpError(500, "You forgot to use resolveContext middleware");
      const { outlet_id, worker_station } = req.context;
      if (!outlet_id) throw new HttpError(401, "Outlet id not found");
      if (!worker_station) throw new HttpError(401, "Worker station not found");

      const { orderId } = req.validated!.params as AssigJobParamsDTO;

      const payload: AssignJobServiceStrategyDTO = {
        userId,
        outletId: outlet_id,
        workerStation: worker_station,
        orderId,
      };

      const assignJob = await this.workerServices.assignJob(payload);

      res.status(200).json(assignJob);
    } catch (error) {
      next(error);
    }
  };

  // reinput the data by the worker
  reinputData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get the user id
      if (!req.access_token) throw new HttpError(401, "Please login first");
      const userId = req.access_token.sub;
      if (!userId) throw new HttpError(401, "Please login first");

      // get the outlet id and station name
      if (!req.context)
        throw new HttpError(500, "You forgot to use resolveContext middleware");
      const { outlet_id, worker_station } = req.context;
      if (!outlet_id) throw new HttpError(401, "Outlet id not found");
      if (!worker_station) throw new HttpError(401, "Worker station not found");

      // destructure the body data
      const { items } = req.validated!.body as ReInputItemBodyPayloadDTO;

      // get the order id
      const { orderId } = req.validated!.params as ReInputItemParamsPayloadDTO;

      // make the payload
      const payload: ReInputServiceStrategyPayloadDTO = {
        userId,
        outletId: outlet_id,
        workerStation: worker_station,
        orderId,
        items,
      };

      // call the service
      const reInputItem = await this.workerServices.reInputItem(payload);

      // return to the controller
      res.status(200).json(reInputItem);
    } catch (error) {
      next(error);
    }
  };

  // mark the station job as done
  markDone = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.access_token) throw new HttpError(401, "Please login first");
      const userId = req.access_token.sub;
      if (!userId) throw new HttpError(401, "Please login first");

      if (!req.context)
        throw new HttpError(500, "You forgot to use resolveContext middleware");
      const { outlet_id, worker_station } = req.context;
      if (!outlet_id) throw new HttpError(401, "Outlet id not found");
      if (!worker_station) throw new HttpError(401, "Worker station not found");

      const { orderId } = req.validated!.params as MarkDoneParamsPayloadDTO;

      const payload: MarkDoneServiceStrategyDTO = {
        userId,
        outletId: outlet_id,
        workerStation: worker_station,
        orderId,
      };

      const markDone = await this.workerServices.markDone(payload);

      res.status(200).json(markDone);
    } catch (error) {
      next(error);
    }
  };

  getCompleteJobs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.access_token) throw new HttpError(401, "Please login first");
      const userId = req.access_token.sub;
      if (!userId) throw new HttpError(401, "User not found");

      if (!req.context)
        throw new HttpError(500, "You forgot to use resolveContext middleware");
      const { outlet_id, worker_station } = req.context;
      if (!outlet_id) throw new HttpError(401, "Outlet id not found");
      if (!worker_station) throw new HttpError(401, "Worker station not found");

      const payload: GetCompleteJobsStrategyDTO = {
        outletId: outlet_id,
        workerId: userId,
        workerStation: worker_station,
      };

      const completeJobs = await this.workerServices.getCompleteJobs(payload);

      res.status(200).json(completeJobs);
    } catch (error) {
      next(error);
    }
  };
}
