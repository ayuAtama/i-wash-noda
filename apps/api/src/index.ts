// src/index.ts — Vercel serverless entry point
import { Server } from "./server";

const server = new Server();
export default server.getApp();
