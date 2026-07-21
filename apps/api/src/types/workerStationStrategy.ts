// /src/types/workerStationStrategy.ts
import {
  AssignJobServiceMethodDTO,
  checkActiveJobsStrategyDTO,
  MarkDoneServiceMethodDTO,
  OutletIDPayloadDTO,
  ReInputServiceMethodPayloadDTO,
} from "@/validations/workerStation.validation";
import {
  OrderStationLog,
  StationSummary,
  WorkerStation,
} from "@/generated/prisma/client";
import { ApiResponse } from "./apiResponse";

export interface AvailableJobs {
  id: string;
  status: string;
  source: "walk_in" | "customer_app";
  customer_name: string;
}

export type AssignJobData = string;

export interface ReInputSuccessData {
  stationLog: OrderStationLog[];
  stationSummary: StationSummary[];
}

export type ReInputFailureData = {
  correct: OrderStationLog[];
  incorrect: OrderStationLog[];
  notExist: OrderStationLog[];
  lost: OrderStationLog[];
};

export type ReInputItemData = ReInputSuccessData | ReInputFailureData;

interface WorkerStationStrategy {
  checkAvailableJobs(
    outletId: OutletIDPayloadDTO["outlet_id"],
  ): Promise<ApiResponse<AvailableJobs[]>>;

  checkActiveJobs(
    data: checkActiveJobsStrategyDTO,
  ): Promise<ApiResponse<AvailableJobs[]>>;

  assignJob(
    data: AssignJobServiceMethodDTO,
  ): Promise<ApiResponse<AssignJobData>>;

  reInputItem(
    data: ReInputServiceMethodPayloadDTO,
  ): Promise<ApiResponse<ReInputItemData>>;

  markDone(data: MarkDoneServiceMethodDTO): Promise<ApiResponse<AvailableJobs>>;
}

export default WorkerStationStrategy;
