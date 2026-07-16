// /src/types/workerStationStrategy.ts
import { ReInputServiceMethodPayloadDTO } from "@/validations/workerStation.validation";
import { ApiResponse } from "./apiResponse";

export interface AvailableJobs {
  id: string;
  status: string;
  source: "walk_in" | "customer_app";
  customer_name: string;
}

interface WorkerStationStrategy {
  checkAvailableJobs(outletId: string): Promise<ApiResponse<AvailableJobs[]>>;
  checkActiveJobs(data: {
    outletId: string;
    workerId: string;
  }): Promise<ApiResponse<unknown>>;
  reInputItem(
    data: ReInputServiceMethodPayloadDTO,
  ): Promise<ApiResponse<unknown>>;
}

export default WorkerStationStrategy;
