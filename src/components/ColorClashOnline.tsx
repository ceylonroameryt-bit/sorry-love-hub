import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw } from 'lucide-react';

// Color Clash Online — Both players see a sequence of colored blocks, race to identify matching colors
// Actually: Each round, host broadcasts a target color. Both players race to click the matching color swatch.

const COLORS = [
  { name: 'RED', hex: '#ef4444' },
  { name: 'BLUE', hex: '#3b82f6' },
  { name: 'GREEN', hex: '#22c55e' },
  { name: 'YELLOW', hex: '#eab308' },
  { name: 'PURPLE', hex: '#a855f7' },
  { name: 'ORANGE', hex: '#f97316' },
  { name: 'PINK', hex: '#ec4899' },
  { name: 'CYAN', hex: '#06b6d4' },
];

interface ColorClashState {
  phase: 'waiting' | 'playing' | 'ended';
  round: number;
  totalRounds: number;
  targetColorIdx: number;
  displayColorIdx: number; // color of the text — STROOP effect
  hostChoice: number | null;
  guestChoice: number | null;
  hostPoints: number;
  guestPoints: number;
  winner: 'host' | 'guest' | 'draw' | null;
  hostScore: number;
  guestScore: number;
  options: number[]; // 4 color indices shown
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateRound(round: number): { targetColorIdx: number; displayColorIdx: number; options: number[] } {
  const rand = seededRandom(round * 7 + 42);
  const targetColorIdx = Math.floor(rand() * COLORS.length);
  let displayColorIdx = Math.floor(rand() * COLORS.length);
  while (displayColorIdx === targetColorIdx) displayColorIdx = Math.floor(rand() * COLORS.length);

  // 4 options: correct + 3 distractors
  const pool = Array.from({ length: COLORS.length }, (_, i) => i).filter(i => i !== targetColorIdx);
  const distractors: number[] = [];
  while (distractors.length < 3) {
    const pick = pool[Math.floor(rand() * pool.length)];
    if (!distractors.includes(pick)) distractors.push(pick);
  }
  const options = [targetColorIdx, ...distractors].sort(() => rand() - 0.5);
  return { targetColorIdx, displayColorIdx, options };
}

const INITIAL: ColorClashState = {
  phase: 'waiting',
  round: 0,
  totalRounds: 10,
  ...generateRound(0),
  hostChoice: null,
  guestChoice: null,
  hostPoints: 0,
  guestPoints: 0,
  winner: null,
  hostScore: 0,
  guestScore: 0,
};

export const ColorClashOnline: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName, playerName } = useGamePeer();
  const state: ColorClashState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const myChoice = role === 'host' ? state.hostChoice : state.guestChoice;
  const hasAnswered = myChoice !== null;

  const startGame = () => {
    const r = generateRound(1);
    sendGameAction({ ...INITIAL, ...r, phase: 'playing', round: 1 });
  };

  const pickColor = (idx: number) => {
    const s = stateRef.current;
    if (s.phase !== 'playing' || hasAnswered) return;
    const key = role === 'host' ? 'hostChoice' : 'guestChoice';
    const newState = { ...s, [key]: idx };

    // Check if both answered
    const hostC = role === 'host' ? idx : s.hostChoice;
    const guestC = role === 'guest' ? idx : s.guestChoice;

    if (hostC !== null && guestC !== null) {
      const hostCorrect = hostC === s.targetColorIdx;
      const guestCorrect = guestC === s.targetColorIdx;
      const newHostPts = s.hostPoints + (hostCorrect ? 1 : 0);
      const newGuestPts = s.guestPoints + (guestCorrect ? 1 : 0);
      const isLastRound = s.round >= s.totalRounds;

      if (isLastRound) {
        const winner = newHostPts > newGuestPts ? 'host' : newGuestPts > newHostPts ? 'guest' : 'draw';
        const nextHostScore = s.hostScore + (winner === 'host' ? 1 : 0);
        const nextGuestScore = s.guestScore + (winner === 'guest' ? 1 : 0);
        setTimeout(() => {
          sendGameAction({
            ...newState,
            hostChoice: hostC,
            guestChoice: guestC,
            hostPoints: newHostPts,
            guestPoints: newGuestPts,
            winner,
            phase: 'ended',
            hostScore: nextHostScore,
            guestScore: nextGuestScore,
          });
        }, 1200);
      } else {
        const nextRound = s.round + 1;
        const nextRoundData = generateRound(nextRound);
        setTimeout(() => {
          sendGameAction({
            ...s,
            ...nextRoundData,
            round: nextRound,
            hostChoice: null,
            guestChoice: null,
            hostPoints: newHostPts,
            guestPoints: newGuestPts,
          });
        }, 1200);
      }
    }

    sendGameAction({ ...newState, [key]: idx, hostChoice: hostC, guestChoice: guestC });
  };

  const resetGame = () => {
    const s = stateRef.current;
    sendGameAction({ ...INITIAL, hostScore: s.hostScore, guestScore: s.guestScore });
  };
  const fullReset = () => sendGameAction({ ...INITIAL });

  const target = COLORS[state.targetColorIdx];
  const display = COLORS[state.displayColorIdx];

  return (
    <div className="container-cute" style={{ maxWidth: '520px' }}>
      <div className="card-cute" style={{ background: '#fdf2f8', border: '1.5px solid #f9a8d4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Color Clash Online 🎨</span>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center',
          background: '#fce7f3', padding: '0.8rem', borderRadius: '15px',
          textAlign: 'center', marginBottom: '1.5rem', border: '2px solid #1e1b4b'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#9d174d' }}>{playerName}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{role === 'host' ? state.hostPoints : state.guestPoints}</div>
            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Win: {role === 'host' ? state.hostScore : state.guestScore}</div>
          </div>
          <div style={{ fontSize: '1.2rem' }}>🎨</div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#9d174d' }}>{opponentName || 'Partner'}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{role === 'host' ? state.guestPoints : state.hostPoints}</div>
            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Win: {role === 'host' ? state.guestScore : state.hostScore}</div>
          </div>
        </div>

        {state.phase === 'waiting' && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎨</div>
            <p className="font-cute" style={{ color: '#9d174d', marginBottom: '1.5rem', fontSize: '1rem' }}>
              STROOP Color Challenge — click the <strong>actual color</strong> shown, not the word!
            </p>
            {role === 'host' ? (
              <button onClick={startGame} className="btn-cute btn-cute-primary">Start Game! 🚀</button>
            ) : (
              <p style={{ color: '#a78bfa' }}>Waiting for {opponentName || 'host'} to start... ⏳</p>
            )}
          </div>
        )}

        {state.phase === 'playing' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '0.5rem', color: '#9d174d', fontSize: '0.85rem' }}>
              Round {state.round} / {state.totalRounds}
            </div>
            {/* STROOP: word is target color name, but text color is different */}
            <div style={{
              textAlign: 'center', marginBottom: '1.5rem', padding: '1.5rem',
              background: '#fff', borderRadius: '16px', border: '3px solid #1e1b4b',
              boxShadow: '4px 4px 0 #1e1b4b'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#9d174d', marginBottom: '0.5rem' }}>What <strong>COLOR</strong> is this word?</div>
              <div style={{ fontSize: '3.5rem', fontWeight: 900, color: display.hex, fontFamily: 'var(--font-cute)', lineHeight: 1 }}>
                {target.name}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
              {state.options.map(idx => {
                const c = COLORS[idx];
                const isSelected = myChoice === idx;
                const showResult = state.hostChoice !== null && state.guestChoice !== null;
                const isCorrect = idx === state.targetColorIdx;
                return (
                  <button
                    key={idx}
                    onClick={() => pickColor(idx)}
                    disabled={hasAnswered}
                    style={{
                      background: showResult ? (isCorrect ? '#22c55e' : '#ef4444') : c.hex,
                      border: `3px solid ${isSelected ? '#1e1b4b' : 'transparent'}`,
                      borderRadius: '14px', padding: '1.2rem', cursor: hasAnswered ? 'default' : 'pointer',
                      color: '#fff', fontWeight: 800, fontSize: '1rem', fontFamily: 'var(--font-cute)',
                      boxShadow: isSelected ? '4px 4px 0 #1e1b4b' : '2px 2px 0 rgba(0,0,0,0.2)',
                      transition: 'all 0.15s', transform: isSelected ? 'scale(0.97)' : 'scale(1)',
                      opacity: hasAnswered && !isSelected ? 0.7 : 1,
                    }}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>

            <div style={{ textAlign: 'center', color: '#9d174d', fontSize: '0.9rem' }}>
              {hasAnswered ? `✅ Waiting for ${opponentName || 'partner'}...` : 'Pick the correct INK color! 🎨'}
            </div>
          </div>
        )}

        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
              {state.winner === role ? '🏆' : state.winner === 'draw' ? '🤝' : '💔'}
            </div>
            <div className="font-cute" style={{ fontSize: '1.3rem', color: '#9d174d', marginBottom: '0.5rem' }}>
              {state.winner === 'draw' ? "It's a draw!" : state.winner === role ? 'You win! 🎉' : 'Partner wins!'}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              Final: You {role === 'host' ? state.hostPoints : state.guestPoints} — {opponentName || 'Partner'} {role === 'host' ? state.guestPoints : state.hostPoints}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '1rem' }}>
          {state.phase === 'ended' && <button onClick={resetGame} className="btn-cute btn-cute-primary"><RefreshCw size={15} /> Play Again</button>}
          <button onClick={fullReset} className="btn-cute btn-cute-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>Reset Scores</button>
        </div>
      </div>
    </div>
  );
};
