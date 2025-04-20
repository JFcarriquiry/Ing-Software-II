import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (): Socket => {
  const socketRef = useRef<Socket>();

  if (!socketRef.current) {
    socketRef.current = io('http://localhost:3001', { transports: ['websocket'] });
  }

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return socketRef.current;
};
