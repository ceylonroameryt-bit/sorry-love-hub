import React, { useState, useRef, useEffect } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw, Zap } from 'lucide-react';
import { GameHeader } from './GameHeader';

const PHRASES = [
  "The quick brown fox jumps over the lazy dog 🦊",
  "Love is patient love is kind and always honest 💕",
  "Two hearts beating together as one forever 💓",
  "A beautiful sunset with you is my favourite view 🌅",
  "Every day with you is an adventure I treasure ✨",
  "You make my heart smile in ways I cannot explain 🌟",
  "Hold my hand and let us wander the world together 🌍",
  "Happiness is having you right by my side always 💜",
  "The stars shine brighter when you are next to me 🌙",
  "Our love story is my favourite story of all time 📖",
  "Coffee tastes better when you are sitting across from me ☕",
  "You are the reason I smile even on rainy days 🌧️",
  "Dancing in the kitchen at midnight with you feels magical 🕺",
  "Sunflowers turn to face the sun just like I turn to you 🌻",
  "Life is a beautiful journey and you are my compass 🧭",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface TypeState {
  phase: 'idle' | 'countdown' | 'racing' | 'done';
  phraseIndex: number;
  phraseOrder: number[];
  startTime: number;
  hostWpm: number | null;
  guestWpm: number | null;
  hostScore: number;
  guestScore: number;
  round: number;
}

const MAX_ROUNDS = 3;

function makeInitial(): TypeState {
  const order = shuffle(PHRASES.map((_, i) => i));
  return {
    phase: 'idle',
    phraseIndex: 0,
    phraseOrder: order.slice(0, MAX_ROUNDS),
    startTime: 0,
    hostWpm: null,
    guestWpm: null,
    hostScore: 0,
    guestScore: 0,
    round: 1,
  };
}

export const EmojiTyperace: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization for fresh shuffled phrases
  useEffect(() => {
    if (role === 'host' && (!gameState || !gameState.phraseOrder)) {
      sendGameAction(makeInitial());
    }
  }, [role, gameState, sendGameAction]);

  const state: TypeState = gameState ?? makeInitial();
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const [typed, setTyped] = useState('');
  const [countdown, setCountdown] = useState(3);
  const inputRef = useRef<HTMLInputElement>(null);

  const phraseOrder = state.phraseOrder ?? PHRASES.map((_, i) => i).slice(0, MAX_ROUNDS);
  const currentPhraseIdx = phraseOrder[state.phraseIndex % phraseOrder.length] ?? 0;
  const phrase = PHRASES[currentPhraseIdx];

  const myWpm = role === 'host' ? state.hostWpm : state.guestWpm;

  // Countdown timer
  useEffect(() => {
    if (state.phase !== 'countdown') return;
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval);
          if (role === 'host') {
            sendGameAction({
              ...stateRef.current,
              phase: 'racing',
              startTime: Date.now(),
            });
          }
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.phase, role, sendGameAction]);

  useEffect(() => {
    if (state.phase === 'racing') {
      setTyped('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [state.phase]);

  const startRace = () => {
    if (role !== 'host') return;
    setTyped('');
    sendGameAction({
      ...state,
      phase: 'countdown',
      hostWpm: null,
      guestWpm: null,
    });
  };

  const handleTyping = (val: string) => {
    setTyped(val);
    if (val === phrase && myWpm === null && state.phase === 'racing') {
      const elapsedSec = Math.max((Date.now() - state.startTime) / 1000, 0.5);
      const wordCount = phrase.split(' ').length;
      const calculatedWpm = Math.round((wordCount / elapsedSec) * 60);

      const ns = { ...stateRef.current };
      if (role === 'host') ns.hostWpm = calculatedWpm;
      else ns.guestWpm = calculatedWpm;

      if (ns.hostWpm !== null && ns.guestWpm !== null) {
        ns.phase = 'done';
        if (ns.hostWpm > ns.guestWpm) ns.hostScore += 1;
        else if (ns.guestWpm > ns.hostWpm) ns.guestScore += 1;
      }
      sendGameAction(ns);
    }
  };

  const nextRound = () => {
    if (role !== 'host') return;
    setTyped('');
    if (state.round >= MAX_ROUNDS) {
      sendGameAction(makeInitial());
    } else {
      sendGameAction({
        ...state,
        phase: 'idle',
        round: state.round + 1,
        phraseIndex: state.phraseIndex + 1,
        hostWpm: null,
        guestWpm: null,
      });
    }
  };

  const resetAll = () => {
    setTyped('');
    sendGameAction(makeInitial());
  };


  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Emoji Typerace"
        emoji="⌨️"
        instructions={[
          "Host starts the 3-second countdown timer.",
          "Type the displayed romantic quote as fast and accurately as possible!",
          "Highest WPM (Words Per Minute) wins the round point!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            Round {state.round} of {MAX_ROUNDS}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>Host: {state.hostScore}</span>
            <span style={{ color: '#ec4899' }}>Guest: {state.guestScore}</span>
          </div>
        </div>

        {/* IDLE PHASE */}
        {state.phase === 'idle' && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem', animation: 'float 2.5s ease infinite' }}>⌨️⚡</div>
            <h3 className="heading-lg" style={{ fontSize: '1.4rem', color: '#059669', marginBottom: '0.6rem' }}>
              Ready to Typerace?
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              {role === 'host' ? 'Click Start Race to trigger the 3-second countdown for both players!' : `Waiting for ${opponentName || 'host'} to start the race...`}
            </p>
            {role === 'host' && (
              <button onClick={startRace} className="btn-cute btn-cute-primary" style={{ padding: '0.75rem 1.8rem', background: '#059669', borderColor: '#059669' }}>
                <Zap size={18} /> Start Race!
              </button>
            )}
          </div>
        )}

        {/* COUNTDOWN PHASE */}
        {state.phase === 'countdown' && (
          <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
            <div style={{ fontSize: '5rem', fontWeight: 900, color: '#059669', animation: 'pulse-gentle 0.5s infinite', fontFamily: 'var(--font-world)' }}>
              {countdown}
            </div>
            <p style={{ color: '#6b7280', fontWeight: 600, fontSize: '1.1rem' }}>Get your fingers ready...</p>
          </div>
        )}

        {/* RACING PHASE */}
        {state.phase === 'racing' && (
          <div>
            <div style={{
              background: '#ffffff',
              border: '2px solid #059669',
              borderRadius: '18px',
              padding: '1.2rem',
              textAlign: 'center',
              marginBottom: '1.2rem',
              boxShadow: '0 4px 14px rgba(5,150,105,0.08)'
            }}>
              <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                TYPE THIS PHRASE:
              </span>
              <p style={{ fontSize: '1.15rem', color: '#1e1b4b', fontWeight: 700, margin: 0, fontFamily: 'monospace' }}>
                {phrase}
              </p>
            </div>

            <input
              ref={inputRef}
              className="input-cute"
              placeholder="Start typing exact phrase here..."
              value={typed}
              onChange={e => handleTyping(e.target.value)}
              disabled={myWpm !== null}
              style={{
                fontSize: '1rem',
                padding: '0.85rem',
                borderRadius: '14px',
                borderColor: typed === phrase ? '#059669' : '#ddd6fe',
                background: typed === phrase ? '#dcfce7' : '#ffffff',
                marginBottom: '1rem'
              }}
            />

            <div style={{ textAlign: 'center', minHeight: '36px' }}>
              {myWpm !== null ? (
                <div style={{ color: '#059669', fontWeight: 700, fontSize: '1rem' }}>
                  ✅ Finished! Your speed: <strong>{myWpm} WPM</strong>. Waiting for {opponentName || 'partner'}...
                </div>
              ) : (
                <div style={{ color: '#6b7280', fontSize: '0.88rem' }}>Race in progress! Type fast!</div>
              )}
            </div>
          </div>
        )}

        {/* DONE PHASE */}
        {state.phase === 'done' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1.5rem',
              background: '#ffffff',
              padding: '1.2rem',
              borderRadius: '18px',
              border: '2px solid #ddd6fe',
              marginBottom: '1.5rem'
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 700 }}>👑 Host Speed</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#7c3aed', fontFamily: 'var(--font-world)' }}>
                  {state.hostWpm} <span style={{ fontSize: '0.9rem' }}>WPM</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#ec4899', fontWeight: 700 }}>🌸 Guest Speed</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ec4899', fontFamily: 'var(--font-world)' }}>
                  {state.guestWpm} <span style={{ fontSize: '0.9rem' }}>WPM</span>
                </div>
              </div>
            </div>

            {role === 'host' && (
              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
                <button onClick={nextRound} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem', background: '#059669', borderColor: '#059669' }}>
                  Next Race ➔
                </button>
                <button onClick={resetAll} className="btn-cute btn-cute-secondary" style={{ padding: '0.65rem 1rem' }}>
                  <RefreshCw size={16} /> Reset
                </button>
              </div>
            )}
            {role === 'guest' && (
              <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Waiting for host to continue...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
