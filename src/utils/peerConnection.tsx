import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import mqtt from 'mqtt';

// ─── Short room code generator ────────────────────────────────────────────────
const CONSONANTS = 'BCDFGHJKLMNPRSTVWXYZ';
const DIGITS = '0123456789';

function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) code += CONSONANTS[Math.floor(Math.random() * CONSONANTS.length)];
  for (let i = 0; i < 2; i++) code += DIGITS[Math.floor(Math.random() * DIGITS.length)];
  return code;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type GameEvent =
  | { type: 'SYNC_NAMES'; payload: { name: string } }
  | { type: 'SELECT_GAME'; payload: { gameId: string | null } }
  | { type: 'GAME_STATE'; payload: any }
  | { type: 'CHAT'; payload: { text: string } }
  | { type: 'JOIN_REQUEST'; payload: { name: string } }
  | { type: 'JOIN_ACCEPT'; payload: { name: string } }
  | { type: 'DISCONNECT' }
  | { type: 'PING' }
  | { type: 'PONG' };

interface PeerContextType {
  peerId: string | null;
  roomCode: string | null;
  isConnected: boolean;
  isHostReady: boolean;
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

  const clientRef = useRef<any>(null);
  const playerNameRef = useRef(playerName);
  const roleRef = useRef(role);
  const roomCodeRef = useRef(roomCode);
  const connectTimeoutRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const lastActiveRef = useRef<number>(Date.now());

  useEffect(() => { playerNameRef.current = playerName; }, [playerName]);
  useEffect(() => { roleRef.current = role; }, [role]);
  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);

  const setPlayerName = (name: string) => {
    setPlayerNameState(name);
    playerNameRef.current = name;
    localStorage.setItem('bfgf_player_name', name);
  };

  const clearError = () => setError(null);

  const sendData = useCallback((data: GameEvent) => {
    if (clientRef.current?.connected && roomCodeRef.current) {
      const sideTopic = roleRef.current === 'host' ? 'host-to-guest' : 'guest-to-host';
      const topic = `sorry-love-hub/room/${roomCodeRef.current}/${sideTopic}`;
      clientRef.current.publish(topic, JSON.stringify(data));
    }
  }, []);

  const cleanupState = useCallback((errMsg?: string) => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (clientRef.current) {
      if (roomCodeRef.current) {
        const sideTopic = roleRef.current === 'host' ? 'host-to-guest' : 'guest-to-host';
        const topic = `sorry-love-hub/room/${roomCodeRef.current}/${sideTopic}`;
        clientRef.current.publish(topic, JSON.stringify({ type: 'DISCONNECT' }));
      }
      clientRef.current.end(true);
      clientRef.current = null;
    }
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
  }, []);

  const handleMessage = useCallback((topic: string, message: Buffer) => {
    try {
      const data = JSON.parse(message.toString()) as GameEvent;
      if (!data) return;

      lastActiveRef.current = Date.now();

      // Handle presence/handshake specifically
      if (topic.endsWith('/presence') && roleRef.current === 'host') {
        if (data.type === 'JOIN_REQUEST') {
          setOpponentName(data.payload.name);
          setIsConnected(true);
          setIsHostReady(false);
          setIsConnecting(false);
          // Accept the join request immediately
          const acceptTopic = `sorry-love-hub/room/${roomCodeRef.current}/host-to-guest`;
          clientRef.current?.publish(
            acceptTopic,
            JSON.stringify({ type: 'JOIN_ACCEPT', payload: { name: playerNameRef.current } })
          );
        }
        return;
      }

      // Handle direct messages
      switch (data.type) {
        case 'JOIN_ACCEPT':
          if (roleRef.current === 'guest') {
            if (connectTimeoutRef.current) {
              clearTimeout(connectTimeoutRef.current);
              connectTimeoutRef.current = null;
            }
            setOpponentName(data.payload.name);
            setIsConnected(true);
            setIsConnecting(false);
          }
          break;
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
        case 'DISCONNECT':
          cleanupState('Partner disconnected 💔 Refresh and reconnect!');
          break;
        case 'PING':
          sendData({ type: 'PONG' });
          break;
        case 'PONG':
          // Keepalive verified
          break;
      }
    } catch (e) {
      console.error('Error parsing MQTT message:', e);
    }
  }, [cleanupState, sendData]);

  // ─── HOST ──────────────────────────────────────────────────────────────────
  const hostRoom = useCallback((name: string) => {
    if (!name.trim()) { setError('Please enter your name first!'); return; }
    cleanupState();

    setIsConnecting(true);
    setRole('host');

    const code = generateRoomCode();
    const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
      clientId: 'sorry_love_host_' + Math.random().toString(16).substring(2, 10),
      clean: true,
      keepalive: 60,
    });
    clientRef.current = client;

    client.on('connect', () => {
      const presenceTopic = `sorry-love-hub/room/${code}/presence`;
      const guestTopic = `sorry-love-hub/room/${code}/guest-to-host`;
      
      client.subscribe([presenceTopic, guestTopic], (err) => {
        if (err) {
          setError('Failed to setup game room. Try again.');
          cleanupState();
          return;
        }
        setPeerId(code);
        setRoomCode(code);
        setIsConnecting(false);
        setIsHostReady(true);
      });
    });

    client.on('message', handleMessage);

    client.on('error', (err) => {
      console.error('Host broker error:', err);
      setError('Server connection error. Please try again.');
      cleanupState();
    });

    client.on('close', () => {
      // Clean up only if we are not actively connected/connecting
      if (!clientRef.current?.connected && isConnected) {
        cleanupState('Signaling server disconnected. Please try hosting again.');
      }
    });

  }, [cleanupState, handleMessage, isConnected]);

  // ─── JOIN ──────────────────────────────────────────────────────────────────
  const joinRoom = useCallback((name: string, code: string) => {
    if (!name.trim()) { setError('Please enter your name first!'); return; }
    if (!code.trim()) { setError('Please enter the room code!'); return; }
    cleanupState();

    const normalizedCode = code.trim().toUpperCase();
    setIsConnecting(true);
    setRole('guest');
    setRoomCode(normalizedCode);

    const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
      clientId: 'sorry_love_guest_' + Math.random().toString(16).substring(2, 10),
      clean: true,
      keepalive: 60,
    });
    clientRef.current = client;

    client.on('connect', () => {
      const hostTopic = `sorry-love-hub/room/${normalizedCode}/host-to-guest`;
      client.subscribe(hostTopic, (err) => {
        if (err) {
          setError('Failed to connect to room. Try again.');
          cleanupState();
          return;
        }

        // Send JOIN_REQUEST immediately on connect
        const presenceTopic = `sorry-love-hub/room/${normalizedCode}/presence`;
        client.publish(
          presenceTopic,
          JSON.stringify({ type: 'JOIN_REQUEST', payload: { name: playerNameRef.current } })
        );

        // Periodically resend join request in case host is still setting up (every 2s)
        const joinRetry = setInterval(() => {
          if (client.connected && !isConnected) {
            client.publish(
              presenceTopic,
              JSON.stringify({ type: 'JOIN_REQUEST', payload: { name: playerNameRef.current } })
            );
          } else {
            clearInterval(joinRetry);
          }
        }, 2000);
      });
    });

    client.on('message', handleMessage);

    client.on('error', (err) => {
      console.error('Guest broker error:', err);
      setError('Connection failed. Verify code and try again.');
      cleanupState();
    });

    client.on('close', () => {
      if (!clientRef.current?.connected && isConnected) {
        cleanupState('Broker disconnected. Reconnecting...');
      }
    });

    // 15-second timeout for join sequence
    connectTimeoutRef.current = window.setTimeout(() => {
      if (!isConnected) {
        setError(
          'Could not reach the room. Make sure the room code is correct, ' +
          'the host is waiting, and both of you are connected to the internet.'
        );
        cleanupState();
      }
    }, 15000);

  }, [cleanupState, handleMessage, isConnected]);

  // Keep-alive heartbeat to detect network/tab drops quickly (every 4s)
  useEffect(() => {
    if (isConnected) {
      lastActiveRef.current = Date.now();
      pingIntervalRef.current = window.setInterval(() => {
        // Send a ping message
        sendData({ type: 'PING' });

        // Check if the partner has timed out (no messages for 10 seconds)
        if (Date.now() - lastActiveRef.current > 10000) {
          cleanupState('Connection timed out. Partner appears offline.');
        }
      }, 4000);
    }
    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };
  }, [isConnected, sendData, cleanupState]);

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

  // Re-sync name on join
  useEffect(() => {
    if (isConnected && playerName) {
      const timer = setTimeout(() => {
        sendData({ type: 'SYNC_NAMES', payload: { name: playerName } });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, playerName, sendData]);

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
