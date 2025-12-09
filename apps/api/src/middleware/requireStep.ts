// middleware/requireStep.ts
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@/utils/jwt";

export function requireStep(step: number) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      // read the token from cookies
      const tokenTempJwt = req.cookies.temp_jwt;
      const tokenNextStep = req.cookies.next_step;

      // Check if the token is missing
      if (!tokenNextStep || !tokenTempJwt)
        return res.status(401).json({ error: "Missing token" });

      // check if the step is correct (it's not encoded)
      if (Number(tokenNextStep) !== step) {
        return res
          .status(405)
          .json({ error: "You're not supposed to be here" });
      }

      // Decode token of temp_jwt
      const payloadTempJwt = await verifyAccessToken(tokenTempJwt);
      if (!payloadTempJwt) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      // Attach the payload (decoded token) to express' request
      req.temp_jwt = payloadTempJwt;
      req.next_step = tokenNextStep;

      next();
    } catch (error) {
      next(error);
    }
  };
}
