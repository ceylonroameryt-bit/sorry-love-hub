import React, { useState, useRef, useEffect } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import {
  Heart, Play, Users, MessageCircle, Copy, Check,
  Send, LogOut, AlertCircle, Wifi, Crown, Zap,
} from 'lucide-react';

const ONLINE_GAMES = [
  { id: 'word-guess', title: 'Word Guessing 🔠', desc: 'One sets a secret word, the other guesses letter by letter!', emoji: '🔠', color: '#7c3aed' },
  { id: 'cat-catch', title: 'Cat Catching 🐱', desc: 'Move your basket to catch falling cats, hearts & yarn balls!', emoji: '🐱', color: '#8b5cf6' },
  { id: 'boyfriend-hit', title: 'Whack-a-BF 🔨', desc: 'Boyfriend pops from holes — girlfriend smacks him with a mallet!', emoji: '🔨', color: '#6d28d9' },
  { id: 'rps', title: 'Paw Clash ✊', desc: 'Classic Rock Paper Scissors with cute cat paws!', emoji: '✊', color: '#5b21b6' },
];

const OFFLINE_GAMES = [
  { id: 'offline-word-guess', title: 'Word Guess 🔠', desc: 'Guess the hidden sweet word from categories like Love, Animals & Treats!', emoji: '🔠', color: '#7c3aed' },
  { id: 'offline-memory', title: 'Memory Match 🃏', desc: 'Flip cute emoji cards and find all matching pairs!', emoji: '🃏', color: '#8b5cf6' },
  { id: 'offline-bonk', title: 'Whack-a-BF Solo 🔨', desc: 'Bonk the boyfriend moles as fast as you can in 30 seconds!', emoji: '🔨', color: '#059669' },
  { id: 'offline-cupid', title: "Cupid's Catch 💖", desc: 'Catch falling hearts, stars & cupcakes. Dodge the bombs!', emoji: '💖', color: '#ec4899' },
  { id: 'offline-ttt', title: 'Tic-Tac-Love 💕', desc: 'Play Tic-Tac-Toe against an AI bot. Easy or unbeatable!', emoji: '💕', color: '#d97706' },
];

interface Props {
  onSelectLocalGame: (id: string) => void;
}

export const Lobby: React.FC<Props> = ({ onSelectLocalGame }) => {
  const {
    peerId, roomCode, isConnected, isHostReady, isConnecting, role,
    playerName, opponentName, chatMessages, error,
    setPlayerName, hostRoom, joinRoom, selectGame, sendChatMessage, disconnect, clearError,
  } = useGamePeer();

  const [inputName, setInputName] = useState(playerName);
  const [inputCode, setInputCode] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [tab, setTab] = useState<'online' | 'offline'>('online');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatOpen]);

  const handleHost = () => {
    if (!inputName.trim()) return;
    setPlayerName(inputName.trim());
    hostRoom(inputName.trim());
  };

  const handleJoin = () => {
    if (!inputName.trim() || !inputCode.trim()) return;
    setPlayerName(inputName.trim());
    joinRoom(inputName.trim(), inputCode.trim());
  };

  const handleCopy = () => {
    const code = peerId || roomCode || '';
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput('');
  };

  const isWaiting = (isConnecting || isHostReady) && !isConnected;

  return (
    <div className="container-cute" style={{ maxWidth: '980px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="heading-xl lobby-title" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Heart size={32} fill="#7c3aed" color="#7c3aed" style={{ animation: 'pulse-gentle 1.5s infinite', flexShrink: 0 }} />
          Our Game Room
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1rem', margin: 0 }}>Play online together or enjoy solo offline games 💜</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={clearError} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* ── MODE TABS ── */}
      {!isConnected && !isWaiting && (
        <div style={{ display: 'flex', background: '#f5f3ff', borderRadius: '50px', padding: '4px', marginBottom: '2rem', maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto' }}>
          {(['online', 'offline'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '0.6rem 1rem', borderRadius: '50px', border: 'none',
                fontFamily: 'var(--font-cute)', fontWeight: 700, fontSize: '0.95rem',
                cursor: 'pointer', transition: 'all 0.2s ease',
                background: tab === t ? 'linear-gradient(135deg,#7c3aed,#8b5cf6)' : 'transparent',
                color: tab === t ? '#fff' : '#7c3aed',
                boxShadow: tab === t ? '0 4px 12px rgba(124,58,237,0.3)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              {t === 'online' ? <><Wifi size={15} /> Online</> : <><Zap size={15} /> Offline</>}
            </button>
          ))}
        </div>
      )}

      {/* ── OFFLINE TAB ── */}
      {!isConnected && !isWaiting && tab === 'offline' && (
        <div>
          <h2 className="heading-lg" style={{ textAlign: 'center', marginBottom: '0.4rem', fontSize: '1.6rem' }}>Solo Games 🎮</h2>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.9rem' }}>No partner? No problem! Play these anytime, anywhere.</p>
          <div className="games-grid">
            {OFFLINE_GAMES.map(g => (
              <div key={g.id} className="card-game" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '2.2rem', lineHeight: 1 }}>{g.emoji}</div>
                <h3 className="font-cute" style={{ color: '#1e1b4b', margin: 0, fontSize: '1.05rem' }}>{g.title}</h3>
                <p style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.5, margin: 0, flex: 1 }}>{g.desc}</p>
                <button
                  onClick={() => onSelectLocalGame(g.id)}
                  className="btn-cute btn-cute-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '0.4rem', background: `linear-gradient(135deg, ${g.color}, #a78bfa)`, fontSize: '0.9rem', padding: '0.6rem 1rem' }}
                >
                  <Play size={14} /> Play Now!
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PRE-CONNECTION: Name + Host/Join ── */}
      {!isConnected && !isWaiting && tab === 'online' && (
        <div style={{ display: 'grid', gap: '1.2rem', maxWidth: '640px', margin: '0 auto' }}>
          {/* Name Input */}
          <div className="card-cute" style={{ padding: '1.2rem' }}>
            <label style={{ display: 'block', fontWeight: 600, color: '#4c1d95', marginBottom: '0.5rem', fontFamily: 'var(--font-cute)', fontSize: '0.95rem' }}>
              <Users size={15} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
              Your Nickname
            </label>
            <input
              className="input-cute"
              placeholder="e.g. Baby, Princess, Hubby..."
              value={inputName}
              onChange={e => setInputName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleHost()}
              style={{ fontSize: '1rem', textAlign: 'center' }}
            />
          </div>

          {/* Host / Join */}
          <div className="host-join-grid">
            {/* Host */}
            <div className="card-cute" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <div style={{ fontSize: '1.8rem', textAlign: 'center' }}>🏠</div>
              <h3 className="font-cute" style={{ color: '#4c1d95', margin: 0, textAlign: 'center', fontSize: '1.1rem' }}>Host Room</h3>
              <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
                Create a room and share the code.
              </p>
              <button onClick={handleHost} disabled={!inputName.trim()} className="btn-cute btn-cute-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 'auto', fontSize: '0.9rem' }}>
                Host Room 🏠
              </button>
            </div>

            {/* Join */}
            <div className="card-cute" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <div style={{ fontSize: '1.8rem', textAlign: 'center' }}>🔗</div>
              <h3 className="font-cute" style={{ color: '#4c1d95', margin: 0, textAlign: 'center', fontSize: '1.1rem' }}>Join Room</h3>
              <input
                className="input-cute"
                placeholder="Paste room code..."
                value={inputCode}
                onChange={e => setInputCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                style={{ textAlign: 'center', fontSize: '0.9rem' }}
              />
              <button onClick={handleJoin} disabled={!inputName.trim() || !inputCode.trim()} className="btn-cute btn-cute-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.9rem' }}>
                Join Room 🔗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WAITING STATE ── */}
      {isWaiting && (
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          {role === 'host' && isHostReady && peerId ? (
            <div className="card-cute" style={{ textAlign: 'center', padding: '2rem 1.5rem', animation: 'pop-in 0.4s ease' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '0.8rem', animation: 'float 2s ease-in-out infinite' }}>🏠✨</div>
              <h2 className="font-cute" style={{ color: '#4c1d95', margin: '0 0 0.4rem', fontSize: '1.5rem' }}>Room is Ready!</h2>
              <p style={{ color: '#6b7280', marginBottom: '1.2rem', fontSize: '0.9rem' }}>Share this code with your partner:</p>
              <div style={{
                background: '#f5f3ff', border: '2px solid #c4b5fd', borderRadius: '14px',
                padding: '0.9rem 1.2rem', marginBottom: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem',
              }}>
                <code style={{ fontSize: '0.72rem', color: '#4c1d95', wordBreak: 'break-all', textAlign: 'left', flex: 1, fontFamily: 'monospace', fontWeight: 700 }}>
                  {peerId}
                </code>
                <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', padding: '4px', flexShrink: 0 }} title="Copy">
                  {copied ? <Check size={20} color="#10b981" /> : <Copy size={20} />}
                </button>
              </div>
              <p style={{ color: '#8b5cf6', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <span style={{ animation: 'pulse-gentle 1s infinite', display: 'inline-block' }}>💜</span>
                Waiting for partner...
              </p>
              <button onClick={disconnect} className="btn-cute btn-cute-secondary" style={{ marginTop: '1.2rem', padding: '0.45rem 1.2rem', fontSize: '0.88rem' }}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="card-cute" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '0.8rem', animation: 'pulse-gentle 1s infinite' }}>
                {role === 'guest' ? '🔗' : '⏳'}
              </div>
              <h2 className="font-cute" style={{ color: '#4c1d95', margin: '0 0 0.4rem', fontSize: '1.4rem' }}>
                {role === 'guest' ? 'Connecting...' : 'Setting up room...'}
              </h2>
              <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                {role === 'guest' ? "Reaching your partner's room, please wait." : 'Connecting to peer network...'}
              </p>
              <button onClick={disconnect} className="btn-cute btn-cute-secondary" style={{ marginTop: '1.2rem' }}>Cancel</button>
            </div>
          )}
        </div>
      )}

      {/* ── CONNECTED DASHBOARD ── */}
      {isConnected && (
        <div style={{ display: 'grid', gap: '1.2rem', animation: 'pop-in 0.4s ease' }}>
          {/* Status Strip */}
          <div className="status-strip">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span className="status-online">Connected</span>
              <span className="badge-cute" style={{ fontSize: '0.75rem' }}>
                {role === 'host' ? <Crown size={11} /> : <Wifi size={11} />}
                {role === 'host' ? 'Host' : 'Guest'}
              </span>
              <span style={{ fontWeight: 700, color: '#4c1d95', fontSize: '0.9rem' }}>{playerName}</span>
              <span style={{ color: '#a78bfa' }}>♥</span>
              <span style={{ fontWeight: 700, color: '#4c1d95', fontSize: '0.9rem' }}>{opponentName || 'Partner'}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <button onClick={() => setChatOpen(o => !o)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <MessageCircle size={15} />
                <span className="btn-label">Chat {chatMessages.length > 0 && `(${chatMessages.length})`}</span>
              </button>
              <button onClick={disconnect} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: '#dc2626', borderColor: '#fecaca' }}>
                <LogOut size={15} />
                <span className="btn-label">Leave</span>
              </button>
            </div>
          </div>

          {/* Game Selection */}
          <div>
            <h2 className="heading-lg" style={{ textAlign: 'center', marginBottom: '0.3rem', fontSize: '1.6rem' }}>
              Choose a Game 🎮
            </h2>
            {role === 'guest' && (
              <p style={{ textAlign: 'center', color: '#8b5cf6', fontSize: '0.88rem', marginBottom: '1rem' }}>
                Waiting for {opponentName || 'host'} to pick a game. Chat while you wait! 💜
              </p>
            )}
            <div className="games-grid">
              {ONLINE_GAMES.map(g => (
                <div key={g.id} className="card-game" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '2.2rem', lineHeight: 1 }}>{g.emoji}</div>
                  <h3 className="font-cute" style={{ color: '#1e1b4b', margin: 0, fontSize: '1.05rem' }}>{g.title}</h3>
                  <p style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.5, margin: 0, flex: 1 }}>{g.desc}</p>
                  <button
                    onClick={() => selectGame(g.id)}
                    disabled={role === 'guest'}
                    className="btn-cute btn-cute-primary"
                    style={{
                      width: '100%', justifyContent: 'center', marginTop: '0.4rem',
                      background: `linear-gradient(135deg, ${g.color}, #a78bfa)`,
                      opacity: role === 'guest' ? 0.5 : 1,
                      cursor: role === 'guest' ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem', padding: '0.6rem 1rem',
                    }}
                  >
                    <Play size={14} />
                    {role === 'host' ? 'Play!' : 'Host picks'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Chat ── */}
      {isConnected && chatOpen && (
        <div className="chat-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0.9rem', borderBottom: '1px solid #ede9fe' }}>
            <span className="font-cute" style={{ color: '#4c1d95', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.95rem' }}>
              <MessageCircle size={15} /> Love Chat
            </span>
            <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '1.2rem', lineHeight: 1, padding: '2px 6px' }}>×</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {chatMessages.length === 0 ? (
              <p style={{ color: '#c4b5fd', textAlign: 'center', margin: 'auto', fontSize: '0.88rem' }}>Say something sweet! 💜</p>
            ) : chatMessages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.sender === 'me' ? 'flex-end' : 'flex-start',
                maxWidth: '82%', background: m.sender === 'me' ? 'linear-gradient(135deg,#7c3aed,#8b5cf6)' : '#f5f3ff',
                color: m.sender === 'me' ? '#fff' : '#4c1d95',
                padding: '0.45rem 0.8rem', borderRadius: m.sender === 'me' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                fontSize: '0.88rem', wordBreak: 'break-word',
              }}>{m.text}</div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleChat} style={{ padding: '0.6rem', borderTop: '1px solid #ede9fe', display: 'flex', gap: '0.4rem' }}>
            <input className="input-cute" placeholder="Type..." value={chatInput} onChange={e => setChatInput(e.target.value)} style={{ padding: '0.45rem 0.65rem', fontSize: '0.88rem', borderRadius: '10px' }} />
            <button type="submit" className="btn-cute btn-cute-primary" style={{ padding: '0.45rem 0.7rem', borderRadius: '10px', minWidth: 36, justifyContent: 'center' }}>
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
