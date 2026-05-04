import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupSocketHandlers } from './roomManager';
// import { GameState } from '@timebomb/shared';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' } // À restreindre en prod
});

io.on('connection', (socket) => {
  console.log('🕵️ Nouveau joueur connecté:', socket.id);

  setupSocketHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log('💨 Joueur déconnecté:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Serveur Time Bomb prêt sur le port ${PORT}`);
});
