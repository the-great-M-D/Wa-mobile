import { Router, type IRouter } from "express";
import {
  getBotInfo,
  requestPairingCode,
  logoutBot,
  addSseClient,
  removeSseClient,
} from "../lib/whatsapp";
import { randomUUID } from "crypto";
import {
  RequestPairingCodeBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/bot/status", async (_req, res): Promise<void> => {
  const info = getBotInfo();
  const uptime = info.connectedAt
    ? Math.floor((Date.now() - info.connectedAt.getTime()) / 1000)
    : null;

  res.json({
    state: info.state,
    phoneNumber: info.phoneNumber ?? null,
    deviceName: info.deviceName ?? null,
    platform: null,
    connectedAt: info.connectedAt?.toISOString() ?? null,
    uptime,
  });
});

router.post("/bot/pair", async (req, res): Promise<void> => {
  const parsed = RequestPairingCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const code = await requestPairingCode(parsed.data.phoneNumber);
  const expiresAt = new Date(Date.now() + 60 * 1000);

  res.json({ code, expiresAt: expiresAt.toISOString() });
});

router.post("/bot/logout", async (_req, res): Promise<void> => {
  await logoutBot();
  res.json({ success: true, message: "Logged out successfully" });
});

// Server-Sent Events stream for live updates
router.get("/bot/events", (req, res): void => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const clientId = randomUUID();

  const write = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  write("connected", { clientId });

  // Send current status immediately
  const info = getBotInfo();
  write("status", info);

  addSseClient({ id: clientId, write });

  // Heartbeat every 30s
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeSseClient(clientId);
  });
});

export default router;
