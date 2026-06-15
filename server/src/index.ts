import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupSocketHandlers } from './roomManager';
import 'dotenv/config';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
  },
  // --- Websocket robustness tuning ---
  // Detect dead connections reasonably fast, but tolerate short network
  // hiccups (mobile, tab backgrounding) before declaring a client gone.
  pingInterval: 25000,
  pingTimeout: 20000,
  // Seamlessly restore a client's session and replay missed events when it
  // reconnects within the window, so a brief drop never interrupts a game.
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  },
});

io.on('connection', (socket) => {
  if (socket.recovered) {
    console.log('♻️ Joueur reconnecté (session restaurée):', socket.id);
  } else {
    console.log('🕵️ Nouveau joueur connecté:', socket.id);
  }

  setupSocketHandlers(io, socket);
});

// Lightweight health endpoint (useful for container/orchestrator probes).
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Serveur Time Bomb prêt sur le port ${PORT}`);
});
