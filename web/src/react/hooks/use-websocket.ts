import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface UseWebSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onVoteUpdate?: (data: any) => void;
  onNotification?: (data: any) => void;
  onChatMessage?: (data: any) => void;
  onTyping?: (data: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('etunisia_token');
    if (!token) return;

    const socket = io(`${API_BASE}/events`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      options.onConnect?.();
      socket.emit('feed:subscribe');
      socket.emit('notif:subscribe');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      options.onDisconnect?.();
    });

    socket.on('vote:updated', (data) => {
      options.onVoteUpdate?.(data);
    });

    socket.on('notification:new', (data) => {
      options.onNotification?.(data);
    });

    socket.on('chat:message', (data) => {
      options.onChatMessage?.(data);
    });

    socket.on('chat:typing', (data) => {
      options.onTyping?.(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const emitVote = useCallback((postId: string, direction: 'up' | 'down') => {
    socketRef.current?.emit('vote', { postId, direction });
  }, []);

  const joinChat = useCallback((roomId: string) => {
    socketRef.current?.emit('chat:join', roomId);
  }, []);

  const leaveChat = useCallback((roomId: string) => {
    socketRef.current?.emit('chat:leave', roomId);
  }, []);

  const sendChatMessage = useCallback(
    (roomId: string, content: string, type?: string) => {
      socketRef.current?.emit('chat:message', { roomId, content, type });
    },
    [],
  );

  const sendTyping = useCallback((roomId: string, isTyping: boolean) => {
    socketRef.current?.emit('chat:typing', { roomId, isTyping });
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    onlineCount,
    emitVote,
    joinChat,
    leaveChat,
    sendChatMessage,
    sendTyping,
  };
}
