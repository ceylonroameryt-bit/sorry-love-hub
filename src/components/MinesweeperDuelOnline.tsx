import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw } from 'lucide-react';
import { GameHeader } from './GameHeader';

const COLS = 9;
const ROWS = 9;
const TOTAL = COLS * ROWS;
const MINES = 10;

interface MinesweeperState {
  phase: 'playing' | 'ended';
  mines: number[];
  revealed: number[];
  hostPoints: number;
  guestPoints: number;
  hostScore: number;
  guestScore: number;
  winner: 'host' | 'guest' | 'draw' | null;
}

function generateMines(avoid: number = -1): number[] {
  const mines: number[] = [];
  while (mines.length < MINES) {
    const idx = Math.floor(Math.random() * TOTAL);
    if (idx !== avoid && !mines.includes(idx)) mines.push(idx);
  }
  return mines;
}

function getNeighbors(idx: number): number[] {
  const r = Math.floor(idx / COLS);
  const c = idx % COLS;
  const ns: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr; const nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) ns.push(nr * COLS + nc);
    }
  }
  return ns;
}

function countAdjacentMines(idx: number, mines: number[]): number {
  return getNeighbors(idx).filter(n => mines.includes(n)).length;
}

const INITIAL: MinesweeperState = {
  phase: 'playing',
  mines: generateMines(),
  revealed: [],
  hostPoints: 0,
  guestPoints: 0,
  hostScore: 0,
  guestScore: 0,
  winner: null,
};

export const MinesweeperDuelOnline: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INITIAL);
    }
  }, [role, gameState, sendGameAction]);

  const state: MinesweeperState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const handleCellClick = (idx: number) => {
    if (state.phase !== 'playing' || state.revealed.includes(idx)) return;
    const s = stateRef.current;
    const isMine = s.mines.includes(idx);
    const newRevealed = [...s.revealed, idx];

    let hPts = s.hostPoints;
    let gPts = s.guestPoints;

    if (isMine) {
      if (role === 'host') hPts -= 3;
      else gPts -= 3;
    } else {
      if (role === 'host') hPts += 1;
      else gPts += 1;
    }

    const isEnded = newRevealed.length >= TOTAL - MINES;
    let winner: 'host' | 'guest' | 'draw' | null = null;
    let hScore = s.hostScore;
    let gScore = s.guestScore;

    if (isEnded) {
      if (hPts > gPts) { winner = 'host'; hScore += 1; }
      else if (gPts > hPts) { winner = 'guest'; gScore += 1; }
      else winner = 'draw';
    }

    sendGameAction({
      ...s,
      revealed: newRevealed,
      hostPoints: hPts,
      guestPoints: gPts,
      hostScore: hScore,
      guestScore: gScore,
      winner,
      phase: isEnded ? 'ended' : 'playing',
    });
  };

  const resetAll = () => {
    sendGameAction({
      ...INITIAL,
      mines: generateMines(),
      hostScore: state.hostScore,
      guestScore: state.guestScore,
    });
  };

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Minesweeper Duel"
        emoji="💣"
        instructions={[
          "Tap hidden tiles on the shared 9x9 minefield grid.",
          "Every safe cell revealed awards +1 point.",
          "Hitting a mine penalty: -3 points!",
          "Player with the highest points when all safe cells are revealed wins!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>Host Pts: {state.hostPoints}</span>
            <span style={{ color: '#ec4899' }}>Guest Pts: {state.guestPoints}</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#059669' }}>Host Score: {state.hostScore}</span>
            <span style={{ color: '#ca8a04' }}>Guest Score: {state.guestScore}</span>
          </div>
        </div>

        {/* 9x9 Grid */}
        <div className="game-board-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: '0.3rem', marginBottom: '1.5rem' }}>
          {Array.from({ length: TOTAL }).map((_, idx) => {
            const isRevealed = state.revealed.includes(idx);
            const isMine = state.mines.includes(idx);
            const count = isRevealed && !isMine ? countAdjacentMines(idx, state.mines) : 0;

            return (
              <button
                key={idx}
                onClick={() => handleCellClick(idx)}
                disabled={isRevealed || state.phase === 'ended'}
                style={{
                  aspectRatio: '1 / 1',
                  background: isRevealed ? (isMine ? '#fee2e2' : '#ffffff') : '#f3e8ff',
                  border: isRevealed ? '1px solid #ddd6fe' : '1.5px solid #c084fc',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isRevealed ? 'default' : 'pointer',
                  color: count === 1 ? '#0284c7' : count === 2 ? '#059669' : count >= 3 ? '#dc2626' : '#1e1b4b',
                  fontFamily: 'monospace'
                }}
              >
                {isRevealed ? (isMine ? '💣' : count > 0 ? count : '') : '❓'}
              </button>
            );
          })}
        </div>

        {/* Winner Banner */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.4rem', color: state.winner === 'draw' ? '#ca8a04' : state.winner === role ? '#059669' : '#dc2626', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
              {state.winner === 'draw' ? "It's a Tie!" : state.winner === role ? '🎉 Highest Score Victory!' : `💔 ${opponentName || 'Partner'} Won!`}
            </h3>
            {role === 'host' && (
              <button onClick={resetAll} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem' }}>
                <RefreshCw size={16} /> Play Next Match
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
