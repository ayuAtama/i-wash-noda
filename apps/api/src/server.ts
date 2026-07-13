//src/server.ts
import { App } from "./app";
import { startAutoCloseJob } from "./jobs/autoClose.job";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = new App();
startAutoCloseJob();
app.listen(PORT);
