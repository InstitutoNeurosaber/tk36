import { Server } from 'socket.io';
import { createServer } from 'http';
import { onRequest } from 'firebase-functions/v2/https';

const server = createServer();
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  console.log(`Usuário conectado: ${userId}`);

  socket.on('join-ticket', (ticketId) => {
    socket.join(ticketId);
    console.log(`Usuário ${userId} entrou no ticket ${ticketId}`);
  });

  socket.on('leave-ticket', (ticketId) => {
    socket.leave(ticketId);
    console.log(`Usuário ${userId} saiu do ticket ${ticketId}`);
  });

  socket.on('new-comment', ({ ticketId, ...comment }) => {
    io.to(ticketId).emit(`comment:${ticketId}`, comment);
  });

  socket.on('typing', ({ ticketId, userId, isTyping }) => {
    socket.to(ticketId).emit(`typing:${ticketId}`, { userId, isTyping });
  });

  socket.on('disconnect', () => {
    console.log(`Usuário desconectado: ${userId}`);
  });
});

export const chat = onRequest((req, res) => {
  if (!server.listeners('request').length) {
    server.on('request', (req, res) => {
      if (req.url === '/socket.io/') {
        io.handleUpgrade(req, req.socket, Buffer.alloc(0));
      } else {
        res.writeHead(404);
        res.end();
      }
    });
  }

  server.emit('request', req, res);
});