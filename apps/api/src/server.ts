//src/server.ts
import { App } from "./app.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = new App();
app.listen(PORT);
