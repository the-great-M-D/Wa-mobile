import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { existsSync } from "fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { connectBot } from "./lib/whatsapp";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve the built dashboard as static files when available (Termux / production mode).
// Resolves to artifacts/dashboard/dist/public relative to the project root.
const staticDir =
  process.env.STATIC_DIR ??
  path.resolve(process.cwd(), "../dashboard/dist/public");

if (existsSync(staticDir)) {
  logger.info({ staticDir }, "Serving dashboard static files");
  app.use(express.static(staticDir));
  // SPA fallback — all non-API routes serve index.html
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

// Start WhatsApp bot connection on server startup
connectBot().catch((err) => {
  logger.error({ err }, "Failed to start WhatsApp bot on startup");
});

export default app;
