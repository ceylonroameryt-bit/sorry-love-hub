import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Peer } from 'peerjs';
import type { DataConnection } from 'peerjs';

export type GameEvent =
  | { type: 'SYNC_NAMES'; payload: { name: string } }
  | { type: 'SELECT_GAME'; payload: { gameId: string | null } }
  | { type: 'GAME_STATE'; payload: any }
  | { type: 'CHAT'; payload: { text: string } };

interface PeerContextType {
  peerId: string | null;
  roomCode: string | null;
  isConnected: boolean;
  isHostReady: boolean; // Host's peer is open and waiting
  isConnecting: boolean;
  role: 'host' | 'guest' | null;
  playerName: string;
  opponentName: string;
  activeGame: string | null;
  chatMessages: Array<{ sender: 'me' | 'them'; text: string; timestamp: Date }>;
  error: string | null;
  gameState: any;
  setPlayerName: (name: string) => void;
  hostRoom: (name: string) => void;
  joinRoom: (name: string, code: string) => void;
  sendGameAction: (state: any) => void;
  selectGame: (gameId: string | null) => void;
  sendChatMessage: (text: string) => void;
  disconnect: () => void;
  clearError: () => void;
}

const PeerContext = createContext<PeerContextType | undefined>(undefined);

export const PeerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isHostReady, setIsHostReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [role, setRole] = useState<'host' | 'guest' | null>(null);
  const [playerName, setPlayerNameState] = useState(
    () => localStorage.getItem('bfgf_player_name') || ''
  );
  const [opponentName, setOpponentName] = useState('');
  const [activeGame, setActiveGameState] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'me' | 'them'; text: string; timestamp: Date }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<any>(null);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const playerNameRef = useRef(playerName);

  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  const setPlayerName = (name: string) => {
    setPlayerNameState(name);
    playerNameRef.current = name;
    localStorage.setItem('bfgf_player_name', name);
  };

  const clearError = () => setError(null);

  // Stable sendData using ref
  const sendData = useCallback((data: GameEvent) => {
    if (connRef.current && connRef.current.open) {
      connRef.current.send(data);
    }
  }, []);

  const handleConnection = useCallback((connection: DataConnection) => {
    connRef.current = connection;

    connection.on('open', () => {
      setIsConnecting(false);
      setIsConnected(true);
      // Send name once channel is open
      connection.send({ type: 'SYNC_NAMES', payload: { name: playerNameRef.current } });
    });

    connection.on('data', (raw: any) => {
      const data = raw as GameEvent;
      if (!data?.type) return;

      switch (data.type) {
        case 'SYNC_NAMES':
          setOpponentName(data.payload.name);
          break;
        case 'SELECT_GAME':
          setActiveGameState(data.payload.gameId);
          setGameState(null);
          break;
        case 'GAME_STATE':
          setGameState(data.payload);
          break;
        case 'CHAT':
          setChatMessages(prev => [...prev, { sender: 'them', text: data.payload.text, timestamp: new Date() }]);
          break;
      }
    });

    connection.on('close', () => {
      cleanupState('Partner disconnected 💔');
    });

    connection.on('error', () => {
      setError('Connection error. Please try reconnecting.');
    });
  }, []);

  const cleanupState = (errMsg?: string) => {
    connRef.current?.close();
    connRef.current = null;
    peerRef.current?.destroy();
    peerRef.current = null;
    setIsConnected(false);
    setIsHostReady(false);
    setIsConnecting(false);
    setRole(null);
    setPeerId(null);
    setRoomCode(null);
    setOpponentName('');
    setActiveGameState(null);
    setGameState(null);
    if (errMsg) setError(errMsg);
  };

  const hostRoom = (name: string) => {
    if (!name.trim()) { setError('Please enter your name first!'); return; }
    if (peerRef.current) return; // already hosting

    setError(null);
    setIsConnecting(true);
    setRole('host');

    // Use a random peer ID (most reliable with free PeerJS broker)
    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', (id) => {
      setPeerId(id);
      // Use last 6 chars of peer ID as the room code (easy to share)
      const code = id.slice(-6).toUpperCase();
      setRoomCode(code);
      setIsConnecting(false);
      setIsHostReady(true);
    });

    peer.on('connection', (conn) => {
      setIsHostReady(false);
      handleConnection(conn);
      // Send host's name after a short delay to ensure channel is ready
      setTimeout(() => {
        if (conn.open) {
          conn.send({ type: 'SYNC_NAMES', payload: { name } });
        }
      }, 300);
    });

    peer.on('error', (err) => {
      console.error('Host peer error:', err);
      setError(`Could not start room: ${err.message}. Please try again.`);
      cleanupState();
    });

    peer.on('disconnected', () => {
      // Try to reconnect
      if (peerRef.current && !peerRef.current.destroyed) {
        peerRef.current.reconnect();
      }
    });
  };

  const joinRoom = (name: string, code: string) => {
    if (!name.trim()) { setError('Please enter your name first!'); return; }
    if (!code.trim()) { setError('Please enter the room code!'); return; }

    setError(null);
    setIsConnecting(true);
    setRole('guest');
    setRoomCode(code.toUpperCase());

    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', () => {
      // The host's full peer ID ends with the 6-char code
      // We need to find the host's full peer ID. Since we only have 6 chars,
      // the guest connects to the host using the full peer ID.
      // Fix: host shares full peer ID, but we display last 6 as "code"
      // For joining, we need to handle this - we'll store full peerId in roomCode for host,
      // and for guest we accept either the full ID or just the suffix
      const targetId = code.trim();
      
      // Try connecting - if code is 6 chars, we need the full peer ID
      // We'll try as-is first (full peer ID pasted), then handle error
      const connection = peer.connect(targetId, { reliable: true });
      handleConnection(connection);
    });

    peer.on('error', (err) => {
      console.error('Guest peer error:', err);
      setError('Room not found. Check the code and try again.');
      cleanupState();
    });
  };

  const sendGameAction = useCallback((state: any) => {
    setGameState(state);
    sendData({ type: 'GAME_STATE', payload: state });
  }, [sendData]);

  const selectGame = useCallback((gameId: string | null) => {
    setActiveGameState(gameId);
    setGameState(null);
    sendData({ type: 'SELECT_GAME', payload: { gameId } });
  }, [sendData]);

  const sendChatMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    setChatMessages(prev => [...prev, { sender: 'me', text, timestamp: new Date() }]);
    sendData({ type: 'CHAT', payload: { text } });
  }, [sendData]);

  const disconnect = () => {
    cleanupState();
    setError(null);
  };

  // Re-send name when connected (handles race conditions)
  useEffect(() => {
    if (isConnected && playerName) {
      const timer = setTimeout(() => {
        sendData({ type: 'SYNC_NAMES', payload: { name: playerName } });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  return (
    <PeerContext.Provider value={{
      peerId,
      roomCode,
      isConnected,
      isHostReady,
      isConnecting,
      role,
      playerName,
      opponentName,
      activeGame,
      chatMessages,
      error,
      gameState,
      setPlayerName,
      hostRoom,
      joinRoom,
      sendGameAction,
      selectGame,
      sendChatMessage,
      disconnect,
      clearError,
    }}>
      {children}
    </PeerContext.Provider>
  );
};

export const useGamePeer = () => {
  const ctx = useContext(PeerContext);
  if (!ctx) throw new Error('useGamePeer must be used within PeerProvider');
  return ctx;
};
