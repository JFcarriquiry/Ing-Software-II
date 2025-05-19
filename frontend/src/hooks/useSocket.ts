import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (): Socket => {
  const socketRef = useRef<Socket>();

  if (!socketRef.current) {
    socketRef.current = io('http://localhost:3001', { 
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true
    });
    
    console.log('Socket initialized:', socketRef.current.id);
  }

  useEffect(() => {
    const socket = socketRef.current;
    
    const onConnect = () => console.log('Socket connected:', socket?.id);
    const onDisconnect = (reason: string) => console.log('Socket disconnected:', reason);
    const onError = (error: Error) => console.error('Socket error:', error);
    const onReconnect = (attempt: number) => console.log('Socket reconnected on attempt:', attempt);
    
    socket?.on('connect', onConnect);
    socket?.on('disconnect', onDisconnect);
    socket?.on('error', onError);
    socket?.on('reconnect', onReconnect);
    
    if (socket?.connected) {
      console.log('Socket already connected:', socket.id);
    }

    return () => {
      socket?.off('connect', onConnect);
      socket?.off('disconnect', onDisconnect);
      socket?.off('error', onError);
      socket?.off('reconnect', onReconnect);
    };
  }, []);

  return socketRef.current;
};
