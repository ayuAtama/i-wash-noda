// /api/src/controllers/workerStation.controller.ts
import { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";
import { WorkerStationService } from "@/services/workerStation.services";

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
      console.log(req.context);

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
      const data = req.access_token;
      if (!data) throw new HttpError(401, "User not found");
      const { sub: worker_id, role } = data;
      if (!worker_id) throw new HttpError(401, "User not found");
      const { outlet_id, worker_station } = req.context!;
      if (!outlet_id) throw new HttpError(401, "Outlet id not found");
      if (!worker_station) throw new HttpError(401, "Worker station not found");
      const activeJobs = await this.workerServices.checkActiveJobs({
        outlet_id,
        worker_station,
        worker_id,
      });
      res.status(200).json(activeJobs);
    } catch (error) {
      next(error);
    }
  };
}
