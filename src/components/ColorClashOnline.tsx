import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw } from 'lucide-react';
import { GameHeader } from './GameHeader';

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
  phase: 'playing' | 'ended';
  round: number;
  totalRounds: number;
  targetColorIdx: number;
  displayColorIdx: number;
  hostChoice: number | null;
  guestChoice: number | null;
  hostPoints: number;
  guestPoints: number;
  winner: 'host' | 'guest' | 'draw' | null;
  hostScore: number;
  guestScore: number;
  options: number[];
}

function generateRound(): { targetColorIdx: number; displayColorIdx: number; options: number[] } {
  const targetColorIdx = Math.floor(Math.random() * COLORS.length);
  let displayColorIdx = Math.floor(Math.random() * COLORS.length);
  while (displayColorIdx === targetColorIdx) displayColorIdx = Math.floor(Math.random() * COLORS.length);

  const pool = Array.from({ length: COLORS.length }, (_, i) => i).filter(i => i !== targetColorIdx);
  const distractors: number[] = [];
  while (distractors.length < 3) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (!distractors.includes(pick)) distractors.push(pick);
  }
  const options = [targetColorIdx, ...distractors].sort(() => Math.random() - 0.5);
  return { targetColorIdx, displayColorIdx, options };
}

function makeInitial(): ColorClashState {
  const rData = generateRound();
  return {
    phase: 'playing',
    round: 1,
    totalRounds: 8,
    targetColorIdx: rData.targetColorIdx,
    displayColorIdx: rData.displayColorIdx,
    hostChoice: null,
    guestChoice: null,
    hostPoints: 0,
    guestPoints: 0,
    winner: null,
    hostScore: 0,
    guestScore: 0,
    options: rData.options,
  };
}

export const ColorClashOnline: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(makeInitial());
    }
  }, [role, gameState, sendGameAction]);

  const state: ColorClashState = gameState ?? makeInitial();
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const myChoice = role === 'host' ? state.hostChoice : state.guestChoice;

  const handlePick = (idx: number) => {
    if (myChoice !== null || state.phase !== 'playing') return;

    const s = stateRef.current;
    const isHost = role === 'host';
    const nextState: ColorClashState = isHost
      ? { ...s, hostChoice: idx }
      : { ...s, guestChoice: idx };

    if (nextState.hostChoice !== null && nextState.guestChoice !== null) {
      let hPts = nextState.hostPoints;
      let gPts = nextState.guestPoints;

      if (nextState.hostChoice === nextState.displayColorIdx) hPts++;
      if (nextState.guestChoice === nextState.displayColorIdx) gPts++;

      const isEnded = nextState.round >= nextState.totalRounds;
      let winner: 'host' | 'guest' | 'draw' | null = null;
      let hScore = nextState.hostScore;
      let gScore = nextState.guestScore;

      if (isEnded) {
        if (hPts > gPts) { winner = 'host'; hScore++; }
        else if (gPts > hPts) { winner = 'guest'; gScore++; }
        else winner = 'draw';
      }

      nextState.hostPoints = hPts;
      nextState.guestPoints = gPts;
      nextState.winner = winner;
      nextState.phase = isEnded ? 'ended' : 'playing';
    }

    sendGameAction(nextState);
  };

  const nextRound = () => {
    if (role !== 'host') return;
    const rData = generateRound();
    sendGameAction({
      ...state,
      round: state.round + 1,
      targetColorIdx: rData.targetColorIdx,
      displayColorIdx: rData.displayColorIdx,
      options: rData.options,
      hostChoice: null,
      guestChoice: null,
      phase: 'playing',
    });
  };

  const resetAll = () => sendGameAction(makeInitial());

  const wordName = COLORS[state.targetColorIdx]?.name || 'COLOR';
  const inkHex = COLORS[state.displayColorIdx]?.hex || '#ef4444';

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Color Clash"
        emoji="🎨"
        instructions={[
          "Stroop Test Challenge! Read the text word carefully.",
          "Identify the INK COLOR of the displayed text, NOT what the word says!",
          "Tap the matching color swatch as fast as you can. Highest score wins!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            Round {state.round} of {state.totalRounds}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>Host: {state.hostPoints}</span>
            <span style={{ color: '#ec4899' }}>Guest: {state.guestPoints}</span>
          </div>
        </div>

        {/* Stroop Word Header */}
        <div style={{
          background: '#ffffff',
          border: '2px solid #ddd6fe',
          borderRadius: '20px',
          padding: '1.5rem',
          textAlign: 'center',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 14px rgba(124,58,237,0.06)'
        }}>
          <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase' }}>
            TAP THE INK COLOR:
          </span>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: inkHex, fontFamily: 'var(--font-world)', marginTop: '0.4rem' }}>
            {wordName}
          </div>
        </div>

        {/* Color Swatch Options */}
        {state.phase === 'playing' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem', marginBottom: '1.5rem' }}>
            {state.options.map((colIdx) => {
              const col = COLORS[colIdx];
              const isSelected = myChoice === colIdx;
              return (
                <button
                  key={colIdx}
                  onClick={() => handlePick(colIdx)}
                  disabled={myChoice !== null}
                  style={{
                    background: col.hex,
                    border: isSelected ? '3px solid #ffffff' : 'none',
                    borderRadius: '16px',
                    padding: '1.2rem 0.5rem',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '1.1rem',
                    cursor: myChoice === null ? 'pointer' : 'default',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    fontFamily: 'var(--font-cute)'
                  }}
                >
                  {col.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Reveal or Next controls */}
        {state.hostChoice !== null && state.guestChoice !== null && state.phase === 'playing' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#059669', fontWeight: 700, fontSize: '1rem', marginBottom: '0.8rem' }}>
              Both choices locked in!
            </div>
            {role === 'host' && (
              <button onClick={nextRound} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem' }}>
                Next Round ➔
              </button>
            )}
          </div>
        )}

        {/* Winner Banner */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.4rem', color: state.winner === 'draw' ? '#ca8a04' : state.winner === role ? '#059669' : '#dc2626', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
              {state.winner === 'draw' ? "It's a Tie!" : state.winner === role ? '🎉 Stroop Champion!' : `💔 ${opponentName || 'Partner'} Won!`}
            </h3>
            {role === 'host' && (
              <button onClick={resetAll} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem' }}>
                <RefreshCw size={16} /> Play Again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
