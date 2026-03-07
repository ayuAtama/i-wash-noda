// ../apps/api/src/index.ts vercel serverless
import { App } from "./app";

const app = new App().app;

// export the express app
export default app;
