import rateLimit from "express-rate-limit";
import ms from "ms";

export const registerEndpointRateLimiter = rateLimit({
  windowMs: ms("1m"), // 1 minutes
  max: 10, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // send RateLimit-* headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: "Too many requests, please try again later." },
});

export const verifyOTPEndpointRateLimiter = rateLimit({
  windowMs: ms("1m"),
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

export const resendOTPEndpointRateLimiter = rateLimit({
  windowMs: ms("1m"),
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

export const commpleteRegisterEndpointRateLimiter = rateLimit({
  windowMs: ms("1m"),
  max: 3  ,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
