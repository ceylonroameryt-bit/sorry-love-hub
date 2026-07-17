import React, { useState, useRef, useEffect } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw, Heart, Zap } from 'lucide-react';

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

interface TypeState {
  phase: 'idle' | 'countdown' | 'racing' | 'done';
  phraseIndex: number;
  startTime: number;
  hostWpm: number | null;
  guestWpm: number | null;
  hostScore: number;
  guestScore: number;
  round: number;
}

const INITIAL: TypeState = {
  phase: 'idle',
  phraseIndex: 0,
  startTime: 0,
  hostWpm: null,
  guestWpm: null,
  hostScore: 0,
  guestScore: 0,
  round: 1,
};

const MAX_ROUNDS = 3;

export const EmojiTyperace: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName } = useGamePeer();
  const state: TypeState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const [typed, setTyped] = useState('');
  const [countdown, setCountdown] = useState(3);
  const inputRef = useRef<HTMLInputElement>(null);

  const phrase = PHRASES[state.phraseIndex % PHRASES.length];
  const myWpm = role === 'host' ? state.hostWpm : state.guestWpm;
  const theirWpm = role === 'host' ? state.guestWpm : state.hostWpm;

  useEffect(() => {
    if (state.phase === 'countdown') {
      setCountdown(3);
      setTyped('');
      const t = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(t);
            sendGameAction({ ...stateRef.current, phase: 'racing', startTime: Date.now() });
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(t);
    }
    if (state.phase === 'racing') {
      setTyped('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [state.phase, state.round]);

  const handleType = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (state.phase !== 'racing' || myWpm !== null) return;
    const val = e.target.value;
    setTyped(val);
    if (val === phrase) {
      const elapsed = (Date.now() - state.startTime) / 1000 / 60;
      const wordCount = phrase.split(' ').length;
      const wpm = Math.round(wordCount / elapsed);
      const s = stateRef.current;
      const nextState = { ...s };
      if (role === 'host') nextState.hostWpm = wpm;
      else nextState.guestWpm = wpm;

      if (nextState.hostWpm !== null && nextState.guestWpm !== null) {
        const done = s.round >= MAX_ROUNDS;
        if (!done) {
          if (nextState.hostWpm > nextState.guestWpm) nextState.hostScore += 1;
          else if (nextState.guestWpm > nextState.hostWpm) nextState.guestScore += 1;
        }
        nextState.phase = done ? 'done' : 'done';
        // Award score for this round
        if (nextState.hostWpm > nextState.guestWpm) nextState.hostScore = s.hostScore + 1;
        else if (nextState.guestWpm > nextState.hostWpm) nextState.guestScore = s.guestScore + 1;
        nextState.phase = 'done';
      }
      sendGameAction(nextState);
    }
  };

  const startRound = () => {
    if (role !== 'host') return;
    sendGameAction({ ...state, phase: 'countdown', phraseIndex: Math.floor(Math.random() * PHRASES.length), hostWpm: null, guestWpm: null });
  };

  const nextRound = () => {
    if (role !== 'host') return;
    if (state.round >= MAX_ROUNDS) {
      sendGameAction({ ...INITIAL });
    } else {
      sendGameAction({ ...state, phase: 'countdown', round: state.round + 1, phraseIndex: Math.floor(Math.random() * PHRASES.length), hostWpm: null, guestWpm: null });
    }
  };

  const resetGame = () => sendGameAction({ ...INITIAL });

  const myScore = role === 'host' ? state.hostScore : state.guestScore;
  const theirScore = role === 'host' ? state.guestScore : state.hostScore;
  const iWon = (role === 'host' && state.hostScore > state.guestScore) || (role === 'guest' && state.guestScore > state.hostScore);



  return (
    <div className="container-cute" style={{ maxWidth: '700px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Emoji Typerace ⌨️</span>
          <button onClick={resetGame} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Scoreboard */}
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', background: '#fff', borderRadius: '14px', padding: '0.8rem 1rem', border: '1px solid #ede9fe', marginBottom: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>You</div>
            <div className="font-cute" style={{ fontSize: '1.8rem', color: '#7c3aed' }}>{myScore}</div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af' }}>Round {state.round}/{MAX_ROUNDS}</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{opponentName || 'Partner'}</div>
            <div className="font-cute" style={{ fontSize: '1.8rem', color: '#8b5cf6' }}>{theirScore}</div>
          </div>
        </div>

        {/* IDLE */}
        {state.phase === 'idle' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'float 2s ease infinite' }}>⌨️</div>
            <h2 className="font-cute" style={{ fontSize: '1.8rem', color: '#4c1d95', marginBottom: '1rem' }}>Emoji Typerace!</h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '0.95rem' }}>
              Type the phrase exactly as shown — fastest WPM wins the round!<br />
              Best of {MAX_ROUNDS} rounds.
            </p>
            {role === 'host' ? (
              <button onClick={startRound} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', padding: '1rem 2.5rem' }}>
                Start! ⌨️
              </button>
            ) : (
              <p style={{ color: '#8b5cf6' }}>Waiting for host to start...</p>
            )}
          </div>
        )}

        {/* COUNTDOWN */}
        {state.phase === 'countdown' && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div className="font-cute" style={{ fontSize: '6rem', color: '#7c3aed', animation: 'pop-in 0.3s ease' }}>{countdown}</div>
            <p style={{ color: '#6b7280' }}>Get ready to type!</p>
          </div>
        )}

        {/* RACING */}
        {state.phase === 'racing' && (
          <div>
            <div style={{ background: '#fff', border: '2px solid #ddd6fe', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.2rem', fontFamily: 'monospace', fontSize: '1.1rem', lineHeight: 2, letterSpacing: '0.03em' }}>
              {phrase.split('').map((char, i) => (
                <span key={i} style={{ color: i < typed.length ? (typed[i] === char ? '#7c3aed' : '#dc2626') : '#c4b5fd', borderBottom: i === typed.length ? '2px solid #7c3aed' : 'none', transition: 'color 0.1s' }}>
                  {char}
                </span>
              ))}
            </div>
            {myWpm === null ? (
              <input ref={inputRef} value={typed} onChange={handleType} placeholder="Start typing here..."
                className="input-cute"
                style={{ width: '100%', fontSize: '1rem', fontFamily: 'monospace', letterSpacing: '0.03em', border: typed.length > 0 && typed !== phrase.slice(0, typed.length) ? '2px solid #fca5a5' : '2px solid #ddd6fe' }} />
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem', background: '#ecfdf5', borderRadius: '14px', color: '#047857', fontWeight: 700, animation: 'pop-in 0.3s ease' }}>
                ✅ Done! {myWpm} WPM — Waiting for {opponentName || 'partner'}...
                <Heart size={14} color="#7c3aed" fill="#7c3aed" style={{ marginLeft: '6px', animation: 'pulse-gentle 1s infinite' }} />
              </div>
            )}
            {typed.length > 0 && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
                Progress: {Math.round((typed.length / phrase.length) * 100)}% • Errors: {typed.split('').filter((c, i) => c !== phrase[i]).length}
              </div>
            )}
          </div>
        )}

        {/* DONE / RESULT */}
        {state.phase === 'done' && (
          <div style={{ textAlign: 'center', animation: 'pop-in 0.4s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {[{ label: 'You', wpm: myWpm }, { label: opponentName || 'Partner', wpm: theirWpm }].map(({ label, wpm }) => (
                <div key={label} style={{ background: '#fff', border: '2px solid #ddd6fe', borderRadius: '18px', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{label}</div>
                  <div className="font-cute" style={{ fontSize: '1.8rem', color: '#7c3aed' }}>{wpm ?? '—'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>WPM</div>
                  {myWpm !== null && theirWpm !== null && (
                    <div style={{ fontSize: '1.2rem', marginTop: '4px' }}>
                      {((label === 'You' && myWpm >= theirWpm) || (label !== 'You' && theirWpm >= myWpm)) && myWpm !== theirWpm ? '🏆' : myWpm === theirWpm ? '🤝' : '🥈'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {state.round < MAX_ROUNDS ? (
              role === 'host' ? (
                <button onClick={nextRound} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', marginBottom: '1rem' }}>
                  <Zap size={15} /> Next Round ➡️
                </button>
              ) : <p style={{ color: '#8b5cf6', marginBottom: '1rem' }}>Waiting for host to continue...</p>
            ) : (
              <div>
                <div className="font-cute" style={{ fontSize: '1.5rem', color: '#4c1d95', marginBottom: '1rem' }}>
                  {myScore === theirScore ? '🤝 Perfect Tie!' : iWon ? '🏆 You Won!' : `👑 ${opponentName || 'Partner'} Won!`}
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button onClick={resetGame} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' }}>Play Again</button>
                  <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary">Back to Lobby</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
