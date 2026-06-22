// apps/api/src/controllers/adminOrder.controller.ts
import { AdminOrderService } from "@/services/adminOrder.services";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";
import {
  AdminOrderInputDTO,
  AdminOrderParamsSchemaDTO,
  WalkInCustomerValidationDTO,
  KeywordWalkInCustomerSchmaDTO,
  ManualOrderInputDTO,
} from "@/validations/adminOrder.validation";

export class AdminOrderController {
  private adminOrderService: AdminOrderService;

  constructor(adminOrderService: AdminOrderService) {
    this.adminOrderService = adminOrderService;
  }

  // create new walkin customer
  createNewWalkinCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // validate the data from the request (controller)
      const data = req.validated!.body as WalkInCustomerValidationDTO;

      // call the service
      const {
        data: result,
        message,
        success,
      } = await this.adminOrderService.createNewWalkInCustomer(data);

      return res.status(200).json({
        success,
        message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // search walk-in customer id
  checkWalkinCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { keyword } = req.validated!.query as KeywordWalkInCustomerSchmaDTO;
      if (!keyword) throw new HttpError(400, "Missing keyword");
      const {
        success,
        data: result,
        message,
      } = await this.adminOrderService.checkWalkInCustomer(keyword);

      if (!success) {
        return res.status(400).json({
          success,
          message,
          data: result,
        });
      }

      return res.status(200).json({
        success,
        message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // createOrder = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     // 1. validate request body
  //     const payload = req.validated!.body as AdminOrderInputDTO;
  //     const { id } = req.validated!.params as AdminOrderParamsSchemaDTO;
  //     if (!id) throw new HttpError(400, "Missing order id");

  //     const outletId = req.context?.outlet_id;
  //     if (!outletId) throw new HttpError(401, "Outlet id not found");

  //     // 2. call service after used middleware (DTO validation)
  //     const result = await this.adminOrderService.createOrder(
  //       payload,
  //       id,
  //       outletId,
  //     );

  //     // 3. response
  //     return res.status(200).json({
  //       message: "Order created",
  //       order: result,
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  manualCreateOrderWalkIn = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (req.validated === undefined) {
        throw new HttpError(400, "Missing order data");
      }
      const body = req.validated.body as ManualOrderInputDTO;
      const context = req.context;
      if (!context) {
        throw new HttpError(401, "Outlet id not found");
      }
      const outletId = context.outlet_id;

      const data = { ...body, outlet_id: outletId };
      //console.log(outletId, worker_station);

      const result = await this.adminOrderService.manualCreateOrderWalkIn(data);
      return res.status(200).json({
        message: "Order created",
        order: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getAllOrderOnOutlet = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (req.context === undefined) {
        throw new HttpError(
          500,
          "There's something wrong but I can't proof it yet",
        );
      }
      const outletId = req.context.outlet_id;
      if (!outletId) throw new HttpError(401, "Outlet id not found");
      const orders = await this.adminOrderService.getAllOrderOnOutlet(outletId);
      return res.status(200).json({
        success: true,
        message: "Orders fetched successfully",
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  };
}
