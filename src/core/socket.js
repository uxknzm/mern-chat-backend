import { Server } from 'socket.io';

export default (server) => {
  const io = new Server(server,  {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on('connection', function (socket) {
    socket.on('DIALOGS:JOIN', (dialogId) => {
      console.log("DIALOGS:JOIN", socket.id);

      socket.dialogId = dialogId;
      socket.join(dialogId);
    });
    socket.on('DIALOGS:TYPING', (obj) => {
      socket.broadcast.emit('DIALOGS:TYPING', obj);
    });
    socket.on('APP:JOIN', (userId) => {
      console.log("APP:JOIN", userId);
      socket.join(userId);
    })
  });

  return io;
};
