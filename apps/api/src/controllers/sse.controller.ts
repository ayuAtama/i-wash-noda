import { createSession } from "better-sse";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "@/config/prisma";
import { sseService } from "@/services/sse.services";
import { isUserRole, type UserRole } from "@/types/role";

export class SSEController {
  private SSE: typeof sseService;

  constructor(sseservice: typeof sseService) {
    this.SSE = sseservice;
  }

  connect = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.access_token?.sub ?? req.user?.id;
      const role = (req.access_token?.role ?? req.user?.role) as
        | string
        | undefined;

      if (!userId || !isUserRole(role)) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      // fetch outlet_id (not available in JWT payload or Better Auth session)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { outlet_id: true },
      });

      const session = await createSession(req, res, {
        state: {
          userId,
          role: role as UserRole,
          outletId: user?.outlet_id ?? null,
        },
      });

      this.SSE.register(session);

      session.push(
        JSON.stringify({ userId, role, outletId: user?.outlet_id ?? null }),
        "connected",
      );
    } catch (error) {
      next(error);
    }
  };

  sendData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query.data;
      const eventName = req.query.eventName as string;

      this.SSE.broadcast(query, eventName);

      res.json({
        success: true,
        message: "Data sent successfully",
        data: query,
      });
    } catch (error) {
      next(error);
    }
  };

  // ── Test endpoints (no auth) ──────────────────────────────────

  testBroadcastAll = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const event = (req.query.event as string) || "TestBroadcast";
      this.SSE.broadcast({ ts: Date.now() }, event);
      res.json({
        success: true,
        message: `Broadcast to ALL connected clients [event: ${event}]`,
      });
    } catch (error) {
      next(error);
    }
  };

  testBroadcastToRole = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const role = req.query.role as string;
      if (!isUserRole(role)) {
        res.status(400).json({
          message: `Invalid role. Use: super_admin, outlet_admin, worker, driver, customer`,
        });
        return;
      }
      const event = (req.query.event as string) || "TestRole";
      this.SSE.broadcastToRole(
        { ts: Date.now(), targetedRole: role },
        event,
        role,
      );
      res.json({
        success: true,
        message: `Broadcast to role "${role}" only [event: ${event}]`,
      });
    } catch (error) {
      next(error);
    }
  };

  testBroadcastToOutlet = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const outletId = req.query.outletId as string;
      if (!outletId) {
        res.status(400).json({ message: "Missing ?outletId= param" });
        return;
      }
      const event = (req.query.event as string) || "TestOutlet";
      this.SSE.broadcastToOutlet(
        { ts: Date.now(), targetedOutlet: outletId },
        event,
        outletId,
      );
      res.json({
        success: true,
        message: `Broadcast to outlet "${outletId}" only [event: ${event}]`,
      });
    } catch (error) {
      next(error);
    }
  };

  testBroadcastToUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        res.status(400).json({ message: "Missing ?userId= param" });
        return;
      }
      const event = (req.query.event as string) || "TestUser";
      this.SSE.broadcastToUser(
        { ts: Date.now(), targetedUser: userId },
        event,
        userId,
      );
      res.json({
        success: true,
        message: `Broadcast to user "${userId}" only [event: ${event}]`,
      });
    } catch (error) {
      next(error);
    }
  };

  testBroadcastToRoles = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const raw = req.query.roles as string;
      if (!raw) {
        res
          .status(400)
          .json({ message: "Missing ?roles= param (comma-separated)" });
        return;
      }
      const roles = raw.split(",").map((r) => r.trim());
      const invalid = roles.filter((r) => !isUserRole(r));
      if (invalid.length > 0) {
        res
          .status(400)
          .json({ message: `Invalid roles: ${invalid.join(", ")}` });
        return;
      }
      const event = (req.query.event as string) || "TestRoles";
      this.SSE.broadcastToRoles(
        { ts: Date.now(), targetedRoles: roles },
        event,
        roles as UserRole[],
      );
      res.json({
        success: true,
        message: `Broadcast to roles "${roles.join(", ")}" only [event: ${event}]`,
      });
    } catch (error) {
      next(error);
    }
  };

  testBroadcastExceptUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const excludeUserId = req.query.excludeUserId as string;
      if (!excludeUserId) {
        res.status(400).json({ message: "Missing ?excludeUserId= param" });
        return;
      }
      const event = (req.query.event as string) || "TestExclude";
      this.SSE.broadcastExceptUser(
        { ts: Date.now(), excludedUser: excludeUserId },
        event,
        excludeUserId,
      );
      res.json({
        success: true,
        message: `Broadcast to ALL except user "${excludeUserId}" [event: ${event}]`,
      });
    } catch (error) {
      next(error);
    }
  };
}
