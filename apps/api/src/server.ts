//src/server.ts

// express only
// import { App } from "./app";

// const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// const app = new App();
// app.listen(PORT);

// express + socket.io
import http from "http";
import listEndpoints from "express-list-endpoints";

import { App } from "./app";
import { socketService } from "./socket";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = new App();

// Create HTTP server
const server = http.createServer(app.app);

// Attach Socket.IO
socketService.init(server);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Docs at http://localhost:${PORT}/docs`);

  console.log("\n=== Registered Endpoints ===");
  console.log(listEndpoints(app.app));
  console.log("===========================\n");
});
