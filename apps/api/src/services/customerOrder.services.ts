import { prisma as defaultPrisma, PrismaWrapper } from "@/config/prisma";
import midtrans, { MidtransClients } from "@/utils/midtrans";
import { HttpError } from "@/utils/httpError";
import {
  CancelPaymentDTO,
  complainPayloadDTO,
  markDoneDTO,
  PayPaymentGatewayDTO,
  SetPaymentMethodDTO,
  uploadPaymentDTO,
  UserIdDTO,
} from "@/validations/customerOrder.validation";
import dayjs from "dayjs";

export class CustomerOrderService {
  constructor(
    private readonly prisma: PrismaWrapper = defaultPrisma,
    private readonly midtransInstance: MidtransClients = midtrans,
  ) {}

  async checkActiveOrderStatus(userId: UserIdDTO) {
    try {
      // check if the user is valid
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) throw new HttpError(404, "User not found");

      // find the most recent active order for this customer
      const order = await this.prisma.order.findMany({
        where: {
          customer_id: userId,
          status: {
            notIn: ["cancelled", "finished"],
          },
        },
        select: {
          id: true,
          status: true,
          paid: true,
          pickup_fee: true,
          delivery_fee: true,
          total_kilo: true,
          laundry_price: true,
          total_amount: true,
          updated_at: true,
          created_at: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      if (!order)
        throw new HttpError(404, "Currently there is no active order");

      // return the response
      return {
        success: true,
        message: "Order status fetched successfully",
        data: order,
      };
    } catch (err) {
      throw err;
    }
  }

  async checkCompletedOrderStatus(userId: UserIdDTO) {
    try {
      // check if the user is valid
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) throw new HttpError(404, "User not found");

      // find the most recent active order for this customer
      const order = await this.prisma.order.findMany({
        where: {
          customer_id: userId,
          status: { in: ["finished", "cancelled"] },
        },
        select: {
          id: true,
          status: true,
          paid: true,
          pickup_fee: true,
          delivery_fee: true,
          total_kilo: true,
          laundry_price: true,
          total_amount: true,
          updated_at: true,
          created_at: true,
          confirmed_at: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      if (!order)
        throw new HttpError(404, "Currently there is no completed order");

      // return the response
      return {
        success: true,
        message: "Order status fetched successfully",
        data: order,
      };
    } catch (err) {
      throw err;
    }
  }

  async getMyOrders(userId: UserIdDTO) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!user) throw new HttpError(404, "User not found");

      const orders = await this.prisma.order.findMany({
        where: { customer_id: userId },
        select: {
          id: true,
          status: true,
          paid: true,
          total_amount: true,
          created_at: true,
          updated_at: true,
          items: {
            select: {
              id: true,
              quantity_initial: true,
              item: { select: { name: true } },
            },
          },
        },
        orderBy: { created_at: "desc" },
      });

      const data = orders.map((order) => ({
        id: order.id,
        status: order.status,
        paid: order.paid,
        total_amount: order.total_amount,
        total_price: order.total_amount,
        created_at: order.created_at,
        updated_at: order.updated_at,
        items: order.items.map((oi) => ({
          id: oi.id,
          name: oi.item.name,
          quantity_initial: oi.quantity_initial,
        })),
      }));

      return {
        success: true,
        message: "Orders fetched successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  // set the payment method manual checking or auto checking
  async setPaymentMethod(data: SetPaymentMethodDTO) {
    try {
      const { orderId, userId, paymentMethod } = data;

      // guard rail
      const guard = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          customer_id: true,
          paid: true,
          payment_method: true,
        },
      });
      if (!guard)
        throw new HttpError(
          404,
          "Order not found, and don't be a little hacker",
        );
      if (guard.customer_id !== userId)
        throw new HttpError(403, "You're not allowed to do this");
      if (guard.paid === true)
        throw new HttpError(409, "You've already paid for this order");
      if (guard.payment_method)
        throw new HttpError(
          409,
          "To change your payment method please cancel the payment first",
        );

      const setPaymentMethod = await this.prisma.order.update({
        where: { id: guard.id, customer_id: guard.customer_id },
        data: { payment_method: paymentMethod },
        select: {
          id: true,
          payment_method: true,
        },
      });
      if (!setPaymentMethod.payment_method)
        throw new HttpError(
          404,
          "Order not found, and don't be a little hacker",
        );

      return {
        success: true,
        message: "Payment method updated successfully",
        data: setPaymentMethod,
      };
    } catch (error) {
      throw error;
    }
  }

  async uploadPaymentProof(data: uploadPaymentDTO) {
    try {
      const { orderId, userId, urlProof } = data;

      const orderData = await this.prisma.order.findFirst({
        where: {
          id: orderId,
          customer_id: userId,
        },
        select: {
          id: true,
          status: true,
          paid: true,
          payment_method: true,
          paymentProof: {
            where: { is_deleted: false },
            select: { id: true },
          },
          paymentGatewayTransactions: {
            where: {
              OR: [
                { transaction_status: "pending" },
                { transaction_status: null },
              ],
            },
            orderBy: { created_at: "desc" },
            take: 1,
            select: { id: true },
          },
        },
      });

      if (!orderData)
        throw new HttpError(
          404,
          "Order not found, and don't be a little hacker",
        );
      if (orderData.paid === true)
        throw new HttpError(409, "You've already paid for this order");
      if (
        orderData.status === "waiting_for_driver_pickup" ||
        orderData.status === "out_for_pickup" ||
        orderData.status === "in_transit_to_outlet" ||
        orderData.status === "arrived_at_outlet"
      ) {
        throw new HttpError(409, "You've not allowed to upload proof yet");
      }
      if (orderData.status === "complaint_received")
        throw new HttpError(409, "The order has been paid already");
      if (orderData.status === "finished")
        throw new HttpError(
          409,
          "The order has been paid already,Please dont be a little hacker",
        );
      if (orderData.status === "cancelled")
        throw new HttpError(
          409,
          "The order has been cancelled,Please dont be a little hacker",
        );
      if (orderData.paymentProof.length > 0)
        throw new HttpError(
          409,
          "Proof already uploaded, waiting for admin approval",
        );
      if (
        orderData.paymentGatewayTransactions.length > 0 ||
        orderData.payment_method === "payment_gateway"
      ) {
        throw new HttpError(
          409,
          "Manual payment is not available. Please complete your payment through the selected payment gateway.",
        );
      }

      const uploadProof = await this.prisma.paymentProof.create({
        data: {
          order_id: orderData.id,
          image_url: urlProof,
        },
        select: {
          id: true,
          order_id: true,
          image_url: true,
          created_at: true,
        },
      });

      return {
        success: true,
        message: "Payment proof uploaded successfully",
        data: uploadProof,
      };
    } catch (error) {
      throw error;
    }
  }

  async payWithPaymentGateway(data: PayPaymentGatewayDTO) {
    try {
      const { orderId, userId } = data;

      // guard
      // is the order id real
      const order = await this.prisma.order.findUnique({
        where: {
          id: orderId,
          customer_id: userId,
        },
        select: {
          id: true,
          status: true,
          paid: true,
          total_kilo: true,
          laundry_price: true,
          pickup_fee: true,
          delivery_fee: true,
          total_amount: true,
          total_km: true,
          payment_method: true,
          outlet: {
            select: {
              price_per_kg: true,
              price_per_km: true,
            },
          },
          customer: {
            select: {
              name: true,
              email: true,
            },
          },
          pickupAddress: {
            select: {
              address: true,
            },
          },
          // query the token from table payment_gateway_transaction
          paymentGatewayTransactions: {
            where: {
              OR: [
                { transaction_status: "pending" },
                { transaction_status: null },
              ],
            },
            orderBy: { created_at: "desc" },
            take: 1,
            select: { token: true },
          },
          paymentProof: {
            where: { is_deleted: false },
            select: { id: true },
          },
        },
      });
      if (!order)
        throw new HttpError(
          404,
          "Order not found, and not allowed to pay another customer's order",
        );
      if (
        order.status === "waiting_for_driver_pickup" ||
        order.status === "out_for_pickup" ||
        order.status === "in_transit_to_outlet" ||
        order.status === "arrived_at_outlet"
      ) {
        throw new HttpError(
          409,
          "You've not allowed to pay for this order yet",
        );
      }
      if (order.status === "finished")
        throw new HttpError(
          409,
          "You've already marked this order as finished",
        );
      if (order.status === "cancelled")
        throw new HttpError(409, "Order cancelled");
      if (order.paid === true)
        throw new HttpError(409, "You've already paid for this order");
      if (order.paymentProof.length > 0 || order.payment_method === "manual")
        throw new HttpError(
          409,
          "Auto check payment is not available. Please complete your maual transfer and upload the payment proof.",
        );

      // get the token if already made
      // const midtransToken =
      //   await this.prisma.paymentGatewayTransaction.findFirst({
      //     where: {
      //       order_id: order.id,
      //       OR: [
      //         { transaction_status: "pending" },
      //         { transaction_status: null },
      //       ],
      //     },
      //     orderBy: { created_at: "desc" },
      //     select: {
      //       token: true,
      //     },
      //   });

      // return the old token instead of making new one
      if (order.paymentGatewayTransactions.length > 0) {
        return {
          success: true,
          message: "Payment gateway token fetched successfully",
          data: {
            token: order.paymentGatewayTransactions[0].token,
          },
        };
      }

      // create the basket to received data from midtrans
      const newToken = await this.prisma.paymentGatewayTransaction.create({
        data: { order_id: order.id },
        select: { id: true, order_id: true },
      });

      // make a payload for sending it to midtrans
      const parameter = {
        transaction_details: {
          order_id: order.id,
          gross_amount: order.total_amount,
        },
        item_details: [
          {
            id: "laundry cost",
            price: order.outlet.price_per_kg,
            quantity: Number(order.total_kilo),
            name: `Laundry Cost : ${order.outlet.price_per_kg} IDR / Kilogram`,
          },
          {
            id: "pickup fee",
            price: order.outlet.price_per_km,
            quantity: Number(order.total_km),
            name: `Pickup Fee : ${order.outlet.price_per_km} IDR / Kilometer`,
          },
          {
            id: "delivery fee",
            price: order.outlet.price_per_km,
            quantity: Number(order.total_km),
            name: `Delivery Fee : ${order.outlet.price_per_km} IDR / Kilometer`,
          },
        ],
        customer_details: {
          first_name: order.customer?.name?.split(" ")[0],
          last_name: order.customer?.name?.split(" ")[1],
          email: order.customer?.email,
          shipping_address: {
            address: order.pickupAddress?.address,
          },
        },
        expiry: {
          start_time: dayjs().format("YYYY-MM-DD HH:mm:ss ZZ"),
          unit: "hours" as const,
          duration: 1 as const,
        },
        custom_field1: newToken.id,
      };

      // make a token if not available (outside transaction to avoid prisma transaction timeout (5secs))
      const snapToken = await this.midtransInstance.create(parameter);
      if (!snapToken)
        throw new HttpError(500, "Failed to create payment gateway token");

      const saveTokenToDB = await this.prisma.$transaction(async (tx) => {
        // store the token into database
        const { token } = await tx.paymentGatewayTransaction.update({
          where: { id: newToken.id, order_id: newToken.order_id },
          data: {
            token: snapToken.token,
            order: {
              update: {
                payment_method: "payment_gateway",
              },
            },
          },
          select: { token: true },
        });

        return token;
      });

      return {
        success: true,
        message: "Payment gateway token created successfully",
        data: {
          token: saveTokenToDB,
          redirect_url: snapToken.redirect_url,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async cancelPayment(data: CancelPaymentDTO) {
    try {
      const { orderId, userId } = data;

      // guard
      const order = await this.prisma.order.findUnique({
        where: { id: orderId, customer_id: userId },
        select: {
          id: true,
          status: true,
          paid: true,
          payment_method: true,
          paymentGatewayTransactions: {
            where: {
              OR: [
                { transaction_status: "pending" },
                { transaction_status: null },
              ],
            },
            take: 1,
            select: { id: true, token: true },
          },
          paymentProof: {
            where: { is_deleted: false },
            select: { id: true },
          },
        },
      });

      if (!order)
        throw new HttpError(
          404,
          "Order not found, and don't change another payment",
        );
      if (order.paid === true)
        throw new HttpError(409, "You've already paid for this order");
      if (order.payment_method === null)
        throw new HttpError(
          409,
          "No payment method selected, please select payment method first",
        );
      if (order.paymentProof.length > 0)
        throw new HttpError(
          409,
          "You can't cancel payment if you've uploaded proof of payment",
        );

      // cancel the payment midtrans
      if (order.payment_method === "payment_gateway") {
        if (order.paymentGatewayTransactions.length === 0)
          throw new HttpError(409, "Transaction error, please try again");

        const cancelPayment = await this.midtransInstance.cancel(orderId);

        if (cancelPayment.status_code != 407)
          throw new HttpError(
            Number(cancelPayment.status_code),
            `${cancelPayment.status_message} Please select payment method first before canceling payment`,
          );

        return {
          success: true,
          message: "Payment cancelled successfully",
          data: cancelPayment,
        };
      }

      // cancel the manua upload proof payment
      const cancelPayment = await this.prisma.order.update({
        where: { id: order.id },
        data: { payment_method: null },
        select: {
          id: true,
          payment_method: true,
        },
      });

      return {
        success: true,
        message: "Payment cancelled successfully",
        data: cancelPayment,
      };
    } catch (error) {
      throw error;
    }
  }

  async markDone(data: markDoneDTO) {
    try {
      const { orderId, userId } = data;

      // guard
      const order = await this.prisma.order.findUnique({
        where: { id: orderId, customer_id: userId },
        select: { id: true, status: true, paid: true },
      });

      if (!order) throw new HttpError(404, "Order not found");
      if (order.status === "finished" && order.paid === true)
        throw new HttpError(
          409,
          "You've already marked this order as finished",
        );
      if (order.status === "complaint_received")
        throw new HttpError(409, "Please wait for admin response");

      if (order.status !== "delivered")
        throw new HttpError(
          409,
          "Order not delivered yet, Please dont be a little hacker",
        );

      const markDone = await this.prisma.order.update({
        where: { id: order.id },
        data: { status: "finished", confirmed_at: new Date() },
        select: {
          id: true,
          status: true,
          outlet: {
            select: {
              name: true,
            },
          },
          total_amount: true,
          confirmed_at: true,
        },
      });

      const normalized = {
        id: markDone.id,
        outlet: markDone.outlet.name,
        total_amount: markDone.total_amount,
        confirmed_at: markDone.confirmed_at,
      };

      return {
        success: true,
        message: "Order marked as finished successfully",
        data: normalized,
      };
    } catch (error) {
      throw error;
    }
  }

  async complaint(data: complainPayloadDTO) {
    try {
      const { orderId, userId, complaintMessage, complaintImage } = data;

      // guard
      const guard = await this.prisma.complaint.findFirst({
        where: { order_id: orderId, user_id: userId, status: "pending" },
        select: { id: true, status: true },
      });
      if (!guard) {
        const result = await this.prisma.$transaction(async (tx) => {
          const complain = await tx.complaint.create({
            data: {
              order_id: orderId,
              user_id: userId,
              message: complaintMessage,
              image_url: complaintImage,
              status: "pending",
            },
            select: {
              id: true,
              order_id: true,
              message: true,
              image_url: true,
              status: true,
              created_at: true,
            },
          });

          const updateOrderStatus = await tx.order.update({
            where: { id: complain.order_id },
            data: { status: "complaint_received" },
            select: { id: true, status: true },
          });

          return { complain, updateOrderStatus };
        });

        return {
          success: true,
          message: "Complaint created successfully",
          data: result,
        };
      }

      if (guard.status !== "pending")
        throw new HttpError(409, "Admin already responded to your complain");
      if (guard) {
        throw new HttpError(409, "You've already complained about this order");
      }
    } catch (error) {
      throw error;
    }
  }
}
