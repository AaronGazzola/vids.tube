import express from "express";
import { startWorker } from "./worker.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(JSON.stringify({ action: "worker_started", port: PORT, timestamp: new Date().toISOString() }));
  startWorker();
});
