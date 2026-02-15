import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const s = io(`${SOCKET_URL}/chats`, {
      transportOptions: {
        polling: {
          extraHeaders: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
      auth: {
        token: `Bearer ${token}`,
      },
    });

    socketRef.current = s;

    s.on('connect', () => {
      console.log('Socket connected:', s.id);
      setSocket(s);
    });

    s.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, []);

  return socket;
};
