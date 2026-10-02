import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isIdentified: boolean;
  socketRoom: string | null;
  socketRole: string | null;
  reidentify: (token?: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  isIdentified: false,
  socketRoom: null,
  socketRole: null,
  reidentify: () => {},
});

const SOCKET_URL = 'http://localhost:4000';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isIdentified, setIsIdentified] = useState(false);
  const [socketRoom, setSocketRoom] = useState<string | null>(null);
  const [socketRole, setSocketRole] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const identifyWithToken = (sock: Socket, tokenStr?: string) => {
    const token = tokenStr || localStorage.getItem('shadowguard_access_token');
    if (!token) {
      console.log('[SocketProvider] No JWT token available in storage, skipping identify');
      setIsIdentified(false);
      return;
    }
    console.log('[SocketProvider] Emitting "identify" with token');
    sock.emit('identify', { token });
  };

  const reidentify = (token?: string) => {
    if (socketRef.current) {
      identifyWithToken(socketRef.current, token);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('shadowguard_access_token');

    const newSocket = io(SOCKET_URL, {
      autoConnect: true,
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[SocketProvider] Socket connected:', newSocket.id);
      setIsConnected(true);
      identifyWithToken(newSocket, token || undefined);
    });

    newSocket.on('identified', (data: { success: boolean; room: string; role: string }) => {
      console.log('[SocketProvider] Successfully identified:', data);
      setIsIdentified(true);
      setSocketRoom(data.room);
      setSocketRole(data.role);
    });

    newSocket.on('identify-error', (err: any) => {
      console.warn('[SocketProvider] Identification rejected:', err);
      setIsIdentified(false);
      setSocketRoom(null);
      setSocketRole(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[SocketProvider] Socket disconnected:', reason);
      setIsConnected(false);
      setIsIdentified(false);
      setSocketRoom(null);
      setSocketRole(null);
    });

    // Listen for storage changes (e.g. login / logout in another tab or same window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'shadowguard_access_token') {
        if (e.newValue) {
          identifyWithToken(newSocket, e.newValue);
        } else {
          setIsIdentified(false);
          setSocketRoom(null);
          setSocketRole(null);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        isIdentified,
        socketRoom,
        socketRole,
        reidentify,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
