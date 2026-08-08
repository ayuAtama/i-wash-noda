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
        .digest("hex");
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

// test midtrans signature key validation
const isValid = await midtrans.verifyResponse({
  order_id: "63f36c78-e716-4fc2-8273-479710989cdf",
  status_code: "201",
  gross_amount: "80162.00",
  signature_key:
    "5cf579069041bed0a48996763c5e7e523172e05b02b5527cdaa1c7a8a08e9ed1c5d17a22488b0fedd26e61330ebd33f890f864f0252796dea6cfae75e0b0e45b",
});
console.log(isValid);

// const rawSnap = new midtransClient.Snap({
//   isProduction: false,
//   serverKey: process.env.MIDTRANS_SERVER_KEY!,
//   clientKey: process.env.MIDTRANS_CLIENT_KEY!,
// });

// const webhook = {
//   transaction_type: "off-us",
//   transaction_time: "2026-08-08 12:10:04",
//   transaction_status: "expire",
//   transaction_id: "363c38ca-f9f4-4091-ab1c-0f11494f9545",
//   status_message: "midtrans payment notification",
//   status_code: "202",
//   payment_type: "qris",
//   order_id: "UWU-1786165763331",
//   metadata: {
//     extra_info: {
//       gross_amount_info: {
//         original_amount: "79600",
//         gross_amount: "80162",
//         customer_imposed_payment_fee: "562",
//         customer_imposed_fee_percentage: "100.00",
//       },
//     },
//   },
//   merchant_id: "M535975489",
//   gross_amount: "80162.00",
//   fraud_status: "accept",
//   expiry_time: "2026-08-08 13:09:23",
//   customer_details: { full_name: "Jolo Komlo", email: "joko.vtuber@gmail.com" },
//   currency: "IDR",
// };

// // test notification
// midtrans.transaction.notification(webhook).then((statusResponse: any) => {
//   let orderId = statusResponse.order_id;
//   let transactionStatus = statusResponse.transaction_status;
//   let fraudStatus = statusResponse.fraud_status;

//   console.log(
//     `Transaction notification received. Order ID: ${orderId}. Transaction status: ${transactionStatus}. Fraud status: ${fraudStatus}`,
//   );
// });

// canell
// const cancel = await rawSnap.transaction.cancel("Customer-69123456789");
// console.log(cancel);

// const cancel = await midtrans.cancel("Customer-6912345678");
// console.log(cancel);

// const uwu = await midtrans.create({
//   transaction_details: {
//     order_id: "Customer-69123456789",
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
