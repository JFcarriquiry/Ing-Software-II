import { Server, Socket } from 'socket.io';
export let io: Server;

export function registerOccupancySocket(ioInstance: Server) {
  io = ioInstance;
  
  io.on('connection', (socket: Socket) => {
    console.log('Client connected', socket.id);
    
    // Emitir mensaje de bienvenida al cliente (para confirmar conexión)
    socket.emit('connection_established', { message: 'Connected to server', socketId: socket.id });

    // Manejar unión a salas de restaurantes
    socket.on('join_restaurant_room', (restaurantId: number) => {
      if (!restaurantId) {
        console.error('Invalid restaurantId:', restaurantId);
        return;
      }
      
      const roomName = `restaurant_${restaurantId}`;
      socket.join(roomName);
      console.log(`Client ${socket.id} joined restaurant room ${restaurantId}`);
      
      // Confirmar al cliente que se unió a la sala
      socket.emit('joined_room', { room: roomName, restaurantId });
    });

    // Manejar errores de socket
    socket.on('error', (error) => {
      console.error('Socket error:', error, 'Socket ID:', socket.id);
    });

    // Manejar desconexiones
    socket.on('disconnect', (reason) => {
      console.log('Client disconnected', socket.id, 'Reason:', reason);
    });
  });

  // Manejar errores en el servidor socket.io
  io.engine.on('connection_error', (err) => {
    console.error('Connection error:', err);
  });
  
  console.log('WebSocket server initialized and ready for connections');
}
