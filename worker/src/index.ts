import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), "../.env") });

import express from "express";
import { startWorker } from "./worker.js";
import { setupCookies } from "./startup.js";

const app = express();
const PORT = process.env.PORT || 3001;

await setupCookies();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(JSON.stringify({ action: "worker_started", port: PORT, timestamp: new Date().toISOString() }));
  startWorker();
});
