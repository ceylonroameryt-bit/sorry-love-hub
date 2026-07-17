import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Peer } from 'peerjs';
import type { DataConnection } from 'peerjs';

// ─── ICE / STUN / TURN config ─────────────────────────────────────────────────
// Robust cross-country config for UK ↔ Sri Lanka (different NATs, mobile data).
// We include:
//   • Multiple STUN servers (Google + Cloudflare)
//   • Multiple TURN variants: UDP port 80, TCP port 443, and TURNS (TLS) over 443
//   • TURNS (TLS) is hardest for ISPs to block since it runs on port 443
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  // UDP relay — fastest path
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  // TCP relay — bypasses UDP port blocks
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  // TURNS = TURN over TLS — runs on port 443 like HTTPS; almost never blocked
  {
    urls: 'turns:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  // Additional TCP endpoint
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

const PEER_CONFIG = {
  host: '0.peerjs.com',
  port: 443,
  path: '/',
  secure: true,
  pingInterval: 5000, // Keep socket alive with 5s pings
  // iceCandidatePoolSize tells the browser to pre-gather ICE candidates
  // before the offer is sent, which dramatically speeds up connection time.
  config: { iceServers: ICE_SERVERS, iceCandidatePoolSize: 10 },
  debug: 3, // Enable full debug logging for troubleshooting NAT/ICE issues
};


// ─── Short room code generator ────────────────────────────────────────────────
// Generates a 6-char code like "LOVE47" — this becomes the actual Peer ID,
// so guests only need to type these 6 chars to connect.
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
  | { type: 'CHAT'; payload: { text: string } };

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

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const playerNameRef = useRef(playerName);
  const connectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  const setPlayerName = (name: string) => {
    setPlayerNameState(name);
    playerNameRef.current = name;
    localStorage.setItem('bfgf_player_name', name);
  };

  const clearError = () => setError(null);

  const sendData = useCallback((data: GameEvent) => {
    if (connRef.current && connRef.current.open) {
      connRef.current.send(data);
    }
  }, []);

  const handleConnection = useCallback((connection: DataConnection) => {
    connRef.current = connection;

    const handleOpen = () => {
      // ✅ Clear the join timeout HERE — the connection is actually open now
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }
      setIsConnecting(false);
      setIsConnected(true);
      connection.send({ type: 'SYNC_NAMES', payload: { name: playerNameRef.current } });
    };

    if (connection.open) {
      handleOpen();
    } else {
      connection.on('open', handleOpen);
    }

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
      cleanupState('Partner disconnected 💔 Refresh and reconnect!');
    });

    connection.on('error', () => {
      setError('Connection error. Please try again.');
    });
  }, []);

  const cleanupState = (errMsg?: string) => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
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

  // ─── HOST ──────────────────────────────────────────────────────────────────
  // The host registers with a short custom code as the Peer ID (e.g. "STAR28").
  // If the ID is already taken on the broker, we retry with a new code.
  const hostRoom = useCallback((name: string, retryCode?: string) => {
    if (!name.trim()) { setError('Please enter your name first!'); return; }
    if (peerRef.current) return;

    setError(null);
    setIsConnecting(true);
    setRole('host');

    const code = retryCode ?? generateRoomCode();
    const peer = new Peer(code, PEER_CONFIG);
    peerRef.current = peer;

    peer.on('open', (id) => {
      setPeerId(id);
      setRoomCode(id); // ID is the code — clean & short
      setIsConnecting(false);
      setIsHostReady(true);
    });

    peer.on('connection', (conn) => {
      setIsHostReady(false);
      setIsConnecting(true); // Prevent host UI from reverting to home page during negotiation
      handleConnection(conn);
      // Send host name after a brief delay to ensure the data channel is ready
      setTimeout(() => {
        if (conn.open) {
          conn.send({ type: 'SYNC_NAMES', payload: { name } });
        }
      }, 300);
    });

    peer.on('error', (err: any) => {
      console.warn('Host peer error:', err);

      if (err.type === 'unavailable-id') {
        peer.destroy();
        peerRef.current = null;
        // ID collision on broker — silently retry with a new code
        hostRoom(name, generateRoomCode());
        return;
      }

      // If we are already connected to a partner, signaling server drops don't matter!
      if (connRef.current && connRef.current.open) {
        console.log('Ignoring signaling error since data channel is already active.');
        return;
      }

      // Handle socket/network errors by trying to reconnect rather than destroying the room
      if (err.type === 'socket-error' || err.type === 'socket-closed' || err.type === 'network') {
        console.log('Host signaling socket error. Attempting silent reconnect...');
        setTimeout(() => {
          if (peerRef.current && !peerRef.current.destroyed && peerRef.current.disconnected) {
            peerRef.current.reconnect();
          }
        }, 3000);
        return;
      }

      setError(`Could not create room: ${err.message || err.type}. Please try again.`);
      cleanupState();
    });

    peer.on('disconnected', () => {
      if (peerRef.current && !peerRef.current.destroyed) {
        peerRef.current.reconnect();
      }
    });
  }, [handleConnection]);

  // ─── JOIN ──────────────────────────────────────────────────────────────────
  // Guest connects using the 6-char code which IS the host's Peer ID.
  const joinRoom = useCallback((name: string, code: string) => {
    if (!name.trim()) { setError('Please enter your name first!'); return; }
    if (!code.trim()) { setError('Please enter the room code!'); return; }

    const normalizedCode = code.trim().toUpperCase();

    setError(null);
    setIsConnecting(true);
    setRole('guest');
    setRoomCode(normalizedCode);

    const peer = new Peer(PEER_CONFIG);
    peerRef.current = peer;

    peer.on('open', () => {
      const connection = peer.connect(normalizedCode, {
        reliable: true,
      });
      handleConnection(connection);

      // ── ICE state monitoring ──────────────────────────────────────────────
      // PeerJS wraps RTCPeerConnection — access it after a tick so it's created.
      setTimeout(() => {
        const rtc = (connection as any).peerConnection as RTCPeerConnection | undefined;
        if (!rtc) return;

        rtc.addEventListener('iceconnectionstatechange', () => {
          const state = rtc.iceConnectionState;
          console.log('[ICE] iceConnectionState →', state);

          if (state === 'failed') {
            // ICE has completely failed — no relay path found.
            if (!connRef.current?.open) {
              if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
              setError(
                '🌐 Network relay failed. Make sure both devices have a stable internet connection, ' +
                'or try switching from mobile data to WiFi and re-host the room.'
              );
              cleanupState();
            }
          }

          if (state === 'disconnected') {
            // Transient disconnect — give it 5s to recover before giving up
            setTimeout(() => {
              if (rtc.iceConnectionState === 'disconnected' || rtc.iceConnectionState === 'failed') {
                if (!connRef.current?.open) {
                  if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
                  setError('Connection lost. Please refresh and try again.');
                  cleanupState();
                }
              }
            }, 5000);
          }
        });

        // ICE gathering watchdog — if still checking after 15s, TURN isn't helping
        const gatherWatchdog = window.setTimeout(() => {
          if (rtc.iceConnectionState === 'checking' && !connRef.current?.open) {
            console.warn('[ICE] Still checking after 15s — TURN servers may be unreachable.');
          }
        }, 15000);

        // Clear the watchdog if we connect successfully
        const clearWatchdog = () => clearTimeout(gatherWatchdog);
        rtc.addEventListener('iceconnectionstatechange', () => {
          if (rtc.iceConnectionState === 'connected' || rtc.iceConnectionState === 'completed') {
            clearWatchdog();
          }
        });
      }, 100);

      // 30-second timeout — final fallback if ICE never completes or fails.
      connectTimeoutRef.current = window.setTimeout(() => {
        if (!connRef.current?.open) {
          setError(
            'Could not reach the room. Make sure the room code is correct, ' +
            'the host is waiting, and both of you are connected to the internet.'
          );
          cleanupState();
        }
      }, 30000);
    });


    peer.on('error', (err: any) => {
      console.warn('Guest peer error:', err);

      if (connRef.current && connRef.current.open) {
        console.log('Ignoring signaling error since data channel is already active.');
        return;
      }

      if (err.type === 'peer-unavailable') {
        setError('Room not found. Double-check the code and make sure your partner is hosting.');
      } else if (err.type === 'socket-error' || err.type === 'socket-closed' || err.type === 'network') {
        setError('Signaling server temporarily offline. Retrying connection...');
        setTimeout(() => {
          if (peerRef.current && !peerRef.current.destroyed && peerRef.current.disconnected) {
            peerRef.current.reconnect();
          }
        }, 3000);
        return;
      } else {
        setError('Connection failed. Check your internet and try again.');
      }
      cleanupState();
    });
  }, [handleConnection]);

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

  // Re-send name on connection (handles race conditions)
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
