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
  UpdateOrderItemInputDTO,
  OrderIdParamsSchemaDTO,
  IDParamSchemaDTO,
  WalkInCustomerPayloadDTO,
  CheckWalkInCustomerValidationDTO,
  UpdatePayloadDTO,
  DeletePayloadDTO,
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
      const body = req.validated!.body as WalkInCustomerValidationDTO;

      // get the userid from (outlet_admin)
      const userId = req.access_token!.sub;
      if (!userId) throw new HttpError(401, "Invalid user id");

      // get the outlet_id from the request(req.context)
      const outletId = req.context!.outlet_id;
      if (!outletId)
        throw new HttpError(401, "This user is not standard user (anomaly)");

      // make the payload for passing to the service
      const data = {
        ...body,
        admin_id: userId,
        outlet_id: outletId,
      } as WalkInCustomerPayloadDTO;

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
      // fetch the user id and outlet id from the middlewere
      const userId = req.access_token!.sub;
      const outletId = req.context!.outlet_id;

      if (!userId || !outletId)
        throw new HttpError(401, "This user is not standard user (anomaly)");

      // fetch the query
      const { keyword } = req.validated!.query as KeywordWalkInCustomerSchmaDTO;
      if (!keyword) throw new HttpError(400, "Missing keyword");

      // make the payload
      const data = {
        keyword,
        outlet_id: outletId,
      } as CheckWalkInCustomerValidationDTO;

      // call the service
      const {
        success,
        data: result,
        message,
      } = await this.adminOrderService.checkWalkInCustomer(data);

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

  // update the data for the walkin customer
  updateWalkinCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const id = req.validated!.params as IDParamSchemaDTO;
      const body = req.validated!.body as WalkInCustomerValidationDTO;
      const outletId = req.context!.outlet_id;

      if (!id || !body) {
        throw new HttpError(400, "Missing id or data");
      }
      // make a payload
      const payload = {
        ...id,
        ...body,
        outlet_id: outletId,
      } as UpdatePayloadDTO;
      // call the services
      const { success, data, message } =
        await this.adminOrderService.updateWalkInCustomer(payload);
      return res.status(200).json({
        success,
        message,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  // delete the walkin customer by the id
  deleteWalkinCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // get the id from the params
      const { id } = req.validated!.params as IDParamSchemaDTO;
      if (!id) {
        throw new HttpError(400, "Missing id");
      }

      // get the outlet id from the request
      const outletId = req.context!.outlet_id;
      if (!outletId) {
        throw new HttpError(401, "Outlet id not found");
      }

      const payload = {
        id,
        outlet_id: outletId,
      } as DeletePayloadDTO;

      //call the service
      const { success, data, message } =
        await this.adminOrderService.deleteWalkinCustomer(payload);

      return res.status(200).json({
        success,
        message,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

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

  updateItemOfOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.validated) {
        throw new HttpError(400, "Missing order's item data");
      }

      // get the payload
      const body = req.validated.body as UpdateOrderItemInputDTO;
      const { orderId } = req.validated.params as OrderIdParamsSchemaDTO;
      // get the outlet_id
      if (!req.context) throw new HttpError(401, "Outlet id not found");
      const outletId = req.context.outlet_id;

      // combine the payload and call the service
      const payload = { ...body, orderId, outlet_id: outletId };
      const result = await this.adminOrderService.updateItemOfOrder(payload);

      // response
      return res.status(200).json({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  };
}
