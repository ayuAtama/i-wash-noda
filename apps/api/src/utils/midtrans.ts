import midtransClient from "midtrans-client";
import "dotenv/config";
import {
  MidtransParameterType,
  MidtransUUIDType,
} from "@/types/midtransPrameters";
import dayjs from "dayjs";
import { HttpError } from "./httpError";
import * as crypto from "crypto";

export class MidtransClients extends midtransClient.Snap {
  constructor(options: Partial<midtransClient.MidtransClientOptions> = {}) {
    super({
      isProduction: process.env.NODE_ENV! === "production",
      serverKey: process.env.MIDTRANS_SERVER_KEY!,
      clientKey: process.env.MIDTRANS_CLIENT_KEY!,
      ...options,
    });
  }

  async create(prameter: MidtransParameterType) {
    try {
      const payload = {
        ...prameter,
        credit_card: {
          secure: true,
        },
      };
      const transaction = await this.createTransaction(payload);
      return transaction;
    } catch (error) {
      const err = error as MidtransError;
      throw new HttpError(err.httpStatusCode || 400, err.message);
    }
  }

  async cancel(transactionId: MidtransUUIDType) {
    try {
      const serverKey = Buffer.from(
        `${process.env.MIDTRANS_SERVER_KEY}:`,
      ).toString("base64");
      const url = `https://api.sandbox.midtrans.com/v2/${transactionId}/expire`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${serverKey}`,
        },
      });

      return res.json();
    } catch (error) {
      const err = error as MidtransError;
      throw new HttpError(err.httpStatusCode || 400, err.message);
    }
  }

  async checkStatus(transactionId: MidtransUUIDType) {
    try {
      const serverKey = Buffer.from(
        `${process.env.MIDTRANS_SERVER_KEY}:`,
      ).toString("base64");
      const url = `https://api.sandbox.midtrans.com/v2/${transactionId}/status`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Basic ${serverKey}`,
        },
      });

      return res.json();
    } catch (error) {
      const err = error as MidtransError;
      throw new HttpError(err.httpStatusCode || 400, err.message);
    }
  }

  async verifyResponse(params: any) {
    try {
      const { order_id, status_code, gross_amount, signature_key } = params;

      const serverKey = process.env.MIDTRANS_SERVER_KEY!;
      const hashSha512 = crypto
        .createHash("sha512")
        .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
        .digest("base64");
      if (hashSha512 !== signature_key) {
        throw new HttpError(400, "Invalid signature key");
      }
      
      return true;

      // const serverKey = process.env.MIDTRANS_SERVER_KEY!;

      // // Create raw string combination
      // const rawData = order_id + status_code + gross_amount + serverKey;

      // // Generate SHA-512 hash
      // const computedSignature = crypto
      //   .createHash("sha512")
      //   .update(rawData)
      //   .digest("hex");

      // return computedSignature === signature_key;
    } catch (error) {
      throw error;
    }
  }
}
const midtrans = new MidtransClients();
export default midtrans;

const cancel = await midtrans.cancel("UWU-1786163723353");
console.log(cancel);

// const uwu = await midtrans.create({
//   transaction_details: {
//     order_id: "Customer-6912345678",
//     gross_amount: 50000,
//   },
//   item_details: [
//     {
//       id: "Laundry Price per Kilogram",
//       price: 5000,
//       quantity: 10,
//       name: "Laundry Price per Kilogram: 5K IDR",
//     },
//   ],
//   expiry: {
//     start_time: dayjs().format("YYYY-MM-DD HH:mm:ss ZZ"),
//     unit: "hours" as const,
//     duration: 1 as const,
//   },
// });
// console.log(uwu);

// const cancel = await midtrans.cancel("Customer-6912345678");
// console.log(cancel);

// let parameter = {
//   transaction_details: {
//     order_id: "CustOrder-1021",
//     gross_amount: 13000,
//   },
//   credit_card: {
//     secure: true,
//   },
//   item_details: [
//     {
//       id: "a01",
//       price: 7000,
//       quantity: 1,
//       name: "Apple",
//     },
//     {
//       id: "b02",
//       price: 3000,
//       quantity: 2,
//       name: "Orange",
//     },
//   ],
//   customer_details: {
//     first_name: "Budi",
//     last_name: "Susanto",
//     email: "budisusanto@example.com",
//     phone: "+628123456789",
//     billing_address: {
//       first_name: "Budi",
//       last_name: "Susanto",
//       email: "budisusanto@example.com",
//       phone: "08123456789",
//       address: "Sudirman No.12",
//       city: "Jakarta",
//       postal_code: "12190",
//       country_code: "IDN",
//     },
//     shipping_address: {
//       first_name: "Budi",
//       last_name: "Susanto",
//       email: "budisusanto@example.com",
//       phone: "0812345678910",
//       address: "Sudirman",
//       city: "Jakarta",
//       postal_code: "12190",
//       country_code: "IDN",
//     },
//   },
// };

// let parameter = {
//   transaction_details: {
//     order_id: "Customer-69123456",
//     gross_amount: 50000,
//   },
//   item_details: [
//     {
//       id: "Laundry Price per Kilogram",
//       price: 5000,
//       quantity: 10,
//       name: "Laundry Price per Kilogram: 5K IDR",
//     },
//   ],
//   expiry: {
//     start_time: dayjs().format("YYYY-MM-DD HH:mm:ss ZZ"),
//     unit: "hours" as const,
//     duration: 1 as const,
//   },
// };