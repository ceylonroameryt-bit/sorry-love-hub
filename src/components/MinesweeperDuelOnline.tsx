import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw } from 'lucide-react';

// Minesweeper Duel Online — Both players race to clear mines on the same board
// Each cell cleared = 1 point, hitting a mine = -3 points. Most points wins!

const COLS = 9;
const ROWS = 9;
const TOTAL = COLS * ROWS;
const MINES = 10;

interface MinesweeperState {
  phase: 'waiting' | 'playing' | 'ended';
  mines: number[];    // mine positions
  revealed: number[]; // revealed cell indices
  hostFlags: number[];
  guestFlags: number[];
  hostScore: number;
  guestScore: number;
  hostPoints: number;
  guestPoints: number;
  winner: 'host' | 'guest' | 'draw' | null;
  seed: number;
}

function generateMines(seed: number, avoid: number): number[] {
  let s = seed;
  const mines: number[] = [];
  while (mines.length < MINES) {
    s = (s * 16807) % 2147483647;
    const idx = s % TOTAL;
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

function floodReveal(startIdx: number, mines: number[], revealed: number[]): number[] {
  const newRevealed = [...revealed];
  const queue = [startIdx];
  while (queue.length > 0) {
    const idx = queue.shift()!;
    if (newRevealed.includes(idx) || mines.includes(idx)) continue;
    newRevealed.push(idx);
    if (countAdjacentMines(idx, mines) === 0) {
      for (const n of getNeighbors(idx)) {
        if (!newRevealed.includes(n)) queue.push(n);
      }
    }
  }
  return newRevealed;
}

const INITIAL: MinesweeperState = {
  phase: 'waiting',
  mines: [],
  revealed: [],
  hostFlags: [],
  guestFlags: [],
  hostScore: 0,
  guestScore: 0,
  hostPoints: 0,
  guestPoints: 0,
  winner: null,
  seed: 99991,
};

export const MinesweeperDuelOnline: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName, playerName } = useGamePeer();
  const state: MinesweeperState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const myFlags = role === 'host' ? state.hostFlags : state.guestFlags;
  const theirFlags = role === 'host' ? state.guestFlags : state.hostFlags;
  const myPoints = role === 'host' ? state.hostPoints : state.guestPoints;
  const myWins = role === 'host' ? state.hostScore : state.guestScore;

  const startGame = () => {
    const seed = Date.now() % 999983;
    const mines = generateMines(seed, -1);
    sendGameAction({ ...INITIAL, phase: 'playing', mines, seed, hostScore: state.hostScore, guestScore: state.guestScore });
  };
  const fullReset = () => sendGameAction({ ...INITIAL });

  const handleCellClick = (idx: number, rightClick = false) => {
    const s = stateRef.current;
    if (s.phase !== 'playing') return;
    if (rightClick) {
      // Toggle flag
      const key = role === 'host' ? 'hostFlags' : 'guestFlags';
      const flags = role === 'host' ? [...s.hostFlags] : [...s.guestFlags];
      const pos = flags.indexOf(idx);
      if (pos >= 0) flags.splice(pos, 1);
      else if (!s.revealed.includes(idx)) flags.push(idx);
      sendGameAction({ ...s, [key]: flags });
      return;
    }
    if (s.revealed.includes(idx)) return;

    const isMine = s.mines.includes(idx);
    const pointsKey = role === 'host' ? 'hostPoints' : 'guestPoints';

    if (isMine) {
      const newPoints = (role === 'host' ? s.hostPoints : s.guestPoints) - 3;
      const newRevealed = [...s.revealed, idx];
      // Check if all safe cells revealed
      const safeLeft = TOTAL - s.mines.length - newRevealed.filter(i => !s.mines.includes(i)).length;
      sendGameAction({
        ...s, revealed: newRevealed, [pointsKey]: Math.max(0, newPoints),
        ...(safeLeft === 0 ? evaluateEnd(s, newRevealed) : {})
      });
    } else {
      const newRevealed = floodReveal(idx, s.mines, s.revealed);
      const newCells = newRevealed.filter(i => !s.revealed.includes(i) && !s.mines.includes(i)).length;
      const newPoints = (role === 'host' ? s.hostPoints : s.guestPoints) + newCells;
      const safeLeft = TOTAL - s.mines.length - newRevealed.filter(i => !s.mines.includes(i)).length;
      sendGameAction({
        ...s, revealed: newRevealed, [pointsKey]: newPoints,
        ...(safeLeft === 0 ? evaluateEnd(s, newRevealed) : {})
      });
    }
  };

  function evaluateEnd(s: MinesweeperState, newRevealed: number[]) {
    const winner = s.hostPoints > s.guestPoints ? 'host' : s.guestPoints > s.hostPoints ? 'guest' : 'draw';
    return {
      phase: 'ended' as const, winner,
      hostScore: s.hostScore + (winner === 'host' ? 1 : 0),
      guestScore: s.guestScore + (winner === 'guest' ? 1 : 0),
      revealed: [...newRevealed, ...s.mines],
    };
  }

  const getCellContent = (idx: number): { text: string; bg: string; color: string } => {
    const isMine = state.mines.includes(idx);
    const isRevealed = state.revealed.includes(idx);
    const isMyFlag = myFlags.includes(idx);
    const isTheirFlag = theirFlags.includes(idx);
    const adj = isRevealed && !isMine ? countAdjacentMines(idx, state.mines) : 0;
    const adjColors = ['','#2563eb','#16a34a','#dc2626','#7e22ce','#b45309','#0891b2','#1f2937','#6b7280'];

    if (!isRevealed) {
      if (isMyFlag) return { text: '🚩', bg: '#fef3c7', color: '#000' };
      if (isTheirFlag) return { text: '🏴', bg: '#e0e7ff', color: '#000' };
      return { text: '', bg: '#d1d5db', color: '#000' };
    }
    if (isMine) return { text: '💣', bg: '#fee2e2', color: '#000' };
    return { text: adj > 0 ? String(adj) : '', bg: '#f9fafb', color: adjColors[adj] };
  };

  return (
    <div className="container-cute" style={{ maxWidth: '600px' }}>
      <div className="card-cute" style={{ background: '#f0fdf4', border: '1.5px solid #86efac' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Minesweeper Duel Online 💣</span>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center',
          background: '#dcfce7', padding: '0.8rem', borderRadius: '15px',
          textAlign: 'center', marginBottom: '1.5rem', border: '2px solid #1e1b4b'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#166534' }}>{playerName} 🚩</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{myPoints}</div>
            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Win: {myWins}</div>
          </div>
          <div style={{ fontSize: '1.3rem' }}>💣</div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#166534' }}>{opponentName || 'Partner'} 🏴</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{role === 'host' ? state.guestPoints : state.hostPoints}</div>
            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Win: {role === 'host' ? state.guestScore : state.hostScore}</div>
          </div>
        </div>

        {state.phase === 'waiting' && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💣</div>
            <p className="font-cute" style={{ color: '#166534', marginBottom: '1.5rem' }}>
              Race to reveal safe cells! Click to reveal, right-click/long-press to flag. Mine hit = -3 pts!
            </p>
            {role === 'host' ? (
              <button onClick={startGame} className="btn-cute btn-cute-primary">Start! 💥</button>
            ) : (
              <p style={{ color: '#a78bfa' }}>Waiting for {opponentName || 'host'}... ⏳</p>
            )}
          </div>
        )}

        {(state.phase === 'playing' || state.phase === 'ended') && (
          <div>
            {state.phase === 'ended' && (
              <div style={{ textAlign: 'center', marginBottom: '1rem', fontFamily: 'var(--font-cute)', fontSize: '1.2rem' }}>
                {state.winner === role ? '🏆 You win!' : state.winner === 'draw' ? '🤝 Draw!' : '💔 Partner wins!'}
              </div>
            )}
            <div style={{
              display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: '2px',
              background: '#166534', padding: '6px', borderRadius: '12px',
              border: '4px solid #1e1b4b', boxShadow: '4px 4px 0 #1e1b4b',
              maxWidth: '400px', margin: '0 auto',
            }}>
              {Array.from({ length: TOTAL }, (_, i) => {
                const { text, bg, color } = getCellContent(i);
                const isRevealed = state.revealed.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => handleCellClick(i)}
                    onContextMenu={e => { e.preventDefault(); handleCellClick(i, true); }}
                    disabled={isRevealed}
                    style={{
                      aspectRatio: '1', background: bg, border: '1px solid #d1d5db',
                      fontSize: '0.75rem', fontWeight: 800, color,
                      cursor: isRevealed ? 'default' : 'pointer',
                      borderRadius: '3px', transition: 'all 0.1s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {text}
                  </button>
                );
              })}
            </div>
            {state.phase === 'playing' && (
              <div style={{ textAlign: 'center', marginTop: '0.8rem', color: '#166534', fontSize: '0.85rem' }}>
                🚩 Right-click to flag | Left-click to reveal | Mines: {MINES}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '1.5rem' }}>
          {(state.phase === 'ended') && role === 'host' && <button onClick={startGame} className="btn-cute btn-cute-primary"><RefreshCw size={15} /> Play Again</button>}
          <button onClick={fullReset} className="btn-cute btn-cute-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>Reset Scores</button>
        </div>
      </div>
    </div>
  );
};
