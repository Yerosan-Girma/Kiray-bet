import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { getToken } from '../api/axios';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, connected: false });

const DEFAULT_BACKEND_URL = import.meta.env.PROD ? 'https://kiray-bet.onrender.com' : 'http://localhost:5000';
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || DEFAULT_BACKEND_URL;

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = getToken();

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      auth: { token: token || '' },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => setConnected(true));
    newSocket.on('disconnect', () => setConnected(false));
    newSocket.on('connect_error', (err) => {
      console.warn('Socket connect error:', err.message);
      setConnected(false);
    });

    // Automatically invalidate React Query cache when properties change live
    newSocket.on('property_rented', () => {
      queryClient.invalidateQueries({ queryKey: ['houses'] });
      queryClient.invalidateQueries({ queryKey: ['house'] });
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
    });

    newSocket.on('house_status_changed', () => {
      queryClient.invalidateQueries({ queryKey: ['houses'] });
      queryClient.invalidateQueries({ queryKey: ['house'] });
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user, queryClient]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
