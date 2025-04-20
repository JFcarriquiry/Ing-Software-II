import { Server } from 'socket.io';
export let io: Server;

export function registerOccupancySocket(ioInstance: Server) {
  io = ioInstance;
  io.on('connection', (socket) => {
    console.log('Client connected', socket.id);

    socket.on('join_restaurant_room', (restaurantId: number) => {
      socket.join(`restaurant_${restaurantId}`);
    });

    socket.on('disconnect', () => console.log('Client disconnected', socket.id));
  });
}
