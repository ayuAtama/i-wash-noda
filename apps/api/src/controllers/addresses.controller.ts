// apps/api/src/controllers/addresses.controller.ts
import { AddressService } from "@/services/addresses.services";
import { HttpError } from "@/utils/httpError";
import {
  CreateAddressDto,
  ParamsAddressDto,
  UpdateAddressDto,
} from "@/validations/address.validation";
import type { Request, Response, NextFunction } from "express";
import { PaginationDTO } from "@/validations/pagination.validation";

export class AddressController {
  private addressService: AddressService;

  constructor(addressService: AddressService) {
    this.addressService = addressService;
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.access_token?.sub ?? req.user?.id;
      if (!userId) throw new HttpError(401, "Invalid user id");
      const { page, limit } = req.validated!.query as PaginationDTO;
      const result = await this.addressService.getAll(userId, page, limit);

      res.status(200).json({
        success: true,
        message: "Addresses fetched successfully",
        ...result,
      });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get the data
      //const payload = req.body;
      const payload = req.validated!.body as CreateAddressDto;
      if (!payload) {
        throw new HttpError(400, "Invalid payload");
      }
      const userId = req.access_token?.sub ?? req.user?.id;
      if (!userId) throw new HttpError(401, "Invalid user id");
      const address = await this.addressService.create(userId, payload);

      res.status(201).json({
        success: true,
        message: "Address created successfully",
        data: address,
      });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get the data
      const userId = req.access_token?.sub ?? req.user?.id;
      //const addressId = String(req.params.id);
      //const payload = req.body;
      const { id: addressId } = req.validated!.params as ParamsAddressDto;
      const payload = req.validated!.body as UpdateAddressDto;
      if (!userId) throw new HttpError(401, "Invalid user id");

      const address = await this.addressService.update(
        userId,
        addressId,
        payload,
      );

      res.status(200).json({
        success: true,
        message: "Address updated successfully",
        data: address,
      });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get the data
      //const addressId = String(req.params.id);
      const { id: addressId } = req.validated?.params as ParamsAddressDto;
      const userId = req.access_token?.sub ?? req.user?.id;
      if (!userId) throw new HttpError(401, "Invalid user id");

      await this.addressService.delete(userId, addressId);

      res.status(200).json({
        success: true,
        message: "Address deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  };

  setDefault = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.access_token?.sub ?? req.user?.id;
      //const addressId = String(req.params.id);
      const { id: addressId } = req.validated?.params as ParamsAddressDto;
      if (!userId) throw new HttpError(401, "Invalid user id");

      const defaultAddress = await this.addressService.setDefault(
        userId,
        addressId,
      );

      res.status(200).json({
        success: true,
        message: "Default address updated successfully",
        data: defaultAddress,
      });
    } catch (error) {
      next(error);
    }
  };

  idNotFound = (_req: Request, _res: Response, next: NextFunction) => {
    next(new HttpError(404, "Please, input a valid address id"));
  };
}
