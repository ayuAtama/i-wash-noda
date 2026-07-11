// apps/api/src/controllers/adminOrder.controller.ts
import { createSession } from "better-sse";
import type { Request, Response, NextFunction } from "express";
import { sseService } from "@/services/sse.services";
import { HttpError } from "@/utils/httpError";

export class SSEController {
  //constructor(private readonly SSE: typeof sseService) {}
  private SSE: typeof sseService;

  constructor(sseservice: typeof sseService) {
    this.SSE = sseservice; // Initialize the property in the constructor
  }

  connect = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { SSE } = this;
      const session = await createSession(req, res);

      // register the incoming session to shared channel
      SSE.register(session);
      // log?
      session.push("Hello world!", "message");
    } catch (error) {
      next(error);
    }
  };

  sendData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query.data;
      // const session = await createSession(req, res);
      // const channel = createChannel();
      // channel.register(session);
      // channel.broadcast(query, "query");

      // 3. Broadcast to the shared channel.
      // Do NOT create a new session here.
      this.SSE.broadcast(query, "item:deleted");

      res.json({
        success: true,
        message: "Data sent successfully",
        data: query,
      });
    } catch (error) {
      next(error);
    }
  };
}
