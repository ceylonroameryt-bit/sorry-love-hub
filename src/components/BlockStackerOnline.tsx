import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw, Play, ArrowLeft, ArrowRight, ArrowDown, RotateCw } from 'lucide-react';
import { GameHeader } from './GameHeader';

const COLS = 8;
const ROWS = 14;

const TETROMINOES = [
  { shape: [[1,1,1,1]], color: '#06b6d4' },
  { shape: [[1,1],[1,1]], color: '#eab308' },
  { shape: [[0,1,0],[1,1,1]], color: '#a855f7' },
  { shape: [[1,0,0],[1,1,1]], color: '#f97316' },
  { shape: [[0,0,1],[1,1,1]], color: '#3b82f6' },
  { shape: [[0,1,1],[1,1,0]], color: '#22c55e' },
  { shape: [[1,1,0],[0,1,1]], color: '#ef4444' },
];

type Grid = (string | null)[][];

function emptyGrid(): Grid {
  return Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
}

function rotatePiece(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  return Array(cols).fill(null).map((_, r) =>
    Array(rows).fill(null).map((_, c) => shape[rows - 1 - c][r])
  );
}

function isValid(grid: Grid, shape: number[][], pr: number, pc: number): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[0].length; c++) {
      if (shape[r][c]) {
        const nr = pr + r; const nc = pc + c;
        if (nr >= ROWS || nc < 0 || nc >= COLS || (nr >= 0 && grid[nr][nc])) return false;
      }
    }
  }
  return true;
}

function placePiece(grid: Grid, shape: number[][], pr: number, pc: number, color: string): Grid {
  const newGrid = grid.map(row => [...row]);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[0].length; c++) {
      if (shape[r][c] && pr + r >= 0) {
        newGrid[pr + r][pc + c] = color;
      }
    }
  }
  return newGrid;
}

function clearLines(grid: Grid): { grid: Grid; linesCleared: number } {
  const newGrid = grid.filter(row => row.some(cell => cell === null));
  const linesCleared = ROWS - newGrid.length;
  while (newGrid.length < ROWS) {
    newGrid.unshift(Array(COLS).fill(null));
  }
  return { grid: newGrid, linesCleared };
}

interface BlockState {
  phase: 'idle' | 'playing' | 'ended';
  hostLines: number;
  guestLines: number;
  timeLeft: number;
  winner: 'host' | 'guest' | 'draw' | null;
}

const INITIAL: BlockState = {
  phase: 'idle',
  hostLines: 0,
  guestLines: 0,
  timeLeft: 45,
  winner: null,
};

export const BlockStackerOnline: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INITIAL);
    }
  }, [role, gameState, sendGameAction]);

  const state: BlockState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const [grid, setGrid] = useRefState<Grid>(emptyGrid());
  const [currentPiece, setCurrentPiece] = useRefState<{ shape: number[][]; color: string; r: number; c: number } | null>(null);

  function useRefState<T>(initialValue: T): [T, (val: T | ((prev: T) => T)) => void] {
    const [val, setVal] = React.useState<T>(initialValue);
    return [val, setVal];
  }

  const spawnNewPiece = (g: Grid) => {
    const t = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
    const startC = Math.floor((COLS - t.shape[0].length) / 2);
    if (!isValid(g, t.shape, 0, startC)) {
      // Game over for local player board
      return null;
    }
    return { shape: t.shape, color: t.color, r: 0, c: startC };
  };

  const moveLeft = () => {
    if (!currentPiece || state.phase !== 'playing') return;
    if (isValid(grid, currentPiece.shape, currentPiece.r, currentPiece.c - 1)) {
      setCurrentPiece({ ...currentPiece, c: currentPiece.c - 1 });
    }
  };

  const moveRight = () => {
    if (!currentPiece || state.phase !== 'playing') return;
    if (isValid(grid, currentPiece.shape, currentPiece.r, currentPiece.c + 1)) {
      setCurrentPiece({ ...currentPiece, c: currentPiece.c + 1 });
    }
  };

  const rotate = () => {
    if (!currentPiece || state.phase !== 'playing') return;
    const rot = rotatePiece(currentPiece.shape);
    if (isValid(grid, rot, currentPiece.r, currentPiece.c)) {
      setCurrentPiece({ ...currentPiece, shape: rot });
    }
  };

  const moveDown = () => {
    if (!currentPiece || state.phase !== 'playing') return;
    if (isValid(grid, currentPiece.shape, currentPiece.r + 1, currentPiece.c)) {
      setCurrentPiece({ ...currentPiece, r: currentPiece.r + 1 });
    } else {
      // Lock piece
      const placed = placePiece(grid, currentPiece.shape, currentPiece.r, currentPiece.c, currentPiece.color);
      const { grid: cleared, linesCleared } = clearLines(placed);
      setGrid(cleared);

      if (linesCleared > 0) {
        const s = stateRef.current;
        const nextH = role === 'host' ? s.hostLines + linesCleared : s.hostLines;
        const nextG = role === 'guest' ? s.guestLines + linesCleared : s.guestLines;
        sendGameAction({ ...s, hostLines: nextH, guestLines: nextG });
      }

      const nextPiece = spawnNewPiece(cleared);
      setCurrentPiece(nextPiece);
    }
  };

  const startGame = () => {
    setGrid(emptyGrid());
    const t = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
    setCurrentPiece({ shape: t.shape, color: t.color, r: 0, c: 3 });
    sendGameAction({ ...INITIAL, phase: 'playing' });
  };

  // Tick gravity loop
  useEffect(() => {
    if (state.phase !== 'playing') return;
    const interval = setInterval(() => {
      moveDown();
    }, 700);
    return () => clearInterval(interval);
  }, [state.phase, currentPiece, grid]);

  // Host timer
  useEffect(() => {
    if (role !== 'host' || state.phase !== 'playing') return;
    const timer = setInterval(() => {
      const s = stateRef.current;
      if (s.timeLeft <= 1) {
        clearInterval(timer);
        let winner: 'host' | 'guest' | 'draw' | null = null;
        if (s.hostLines > s.guestLines) winner = 'host';
        else if (s.guestLines > s.hostLines) winner = 'guest';
        else winner = 'draw';
        sendGameAction({ ...s, phase: 'ended', winner, timeLeft: 0 });
      } else {
        sendGameAction({ ...s, timeLeft: s.timeLeft - 1 });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [role, state.phase, sendGameAction]);

  const resetAll = () => sendGameAction(INITIAL);

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Block Stacker"
        emoji="🧱"
        instructions={[
          "Stack falling blocks on your 8x14 grid board.",
          "Use arrow controls to move left, right, rotate, and drop pieces.",
          "Clear complete horizontal lines to score points!",
          "Most lines cleared in 45 seconds wins!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            ⏱️ {state.timeLeft}s left
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>Host Lines: {state.hostLines}</span>
            <span style={{ color: '#ec4899' }}>Guest Lines: {state.guestLines}</span>
          </div>
        </div>

        {/* IDLE PHASE */}
        {state.phase === 'idle' && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem', animation: 'float 2.5s ease infinite' }}>🧱⚡</div>
            <h3 className="heading-lg" style={{ fontSize: '1.4rem', color: '#7c3aed', marginBottom: '0.6rem' }}>
              Ready for Block Stacking?
            </h3>
            {role === 'host' ? (
              <button onClick={startGame} className="btn-cute btn-cute-primary" style={{ padding: '0.75rem 1.8rem' }}>
                <Play size={18} /> Start Stacking!
              </button>
            ) : (
              <p style={{ color: '#6b7280' }}>Waiting for {opponentName || 'host'} to start...</p>
            )}
          </div>
        )}

        {/* PLAYING PHASE */}
        {state.phase === 'playing' && (
          <div>
            <div className="game-board-responsive" style={{ background: '#1e1b4b', padding: '0.4rem', borderRadius: '18px', display: 'grid', gridTemplateRows: 'repeat(14, 1fr)', gap: '0.15rem', marginBottom: '1.2rem' }}>
              {grid.map((row, r) => (
                <div key={r} style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.15rem' }}>
                  {row.map((cell, c) => {
                    let cellColor = cell;
                    if (currentPiece) {
                      const { shape, color, r: pr, c: pc } = currentPiece;
                      if (r >= pr && r < pr + shape.length && c >= pc && c < pc + shape[0].length) {
                        if (shape[r - pr][c - pc]) cellColor = color;
                      }
                    }

                    return (
                      <div
                        key={c}
                        style={{
                          aspectRatio: '1 / 1',
                          background: cellColor || '#312e81',
                          borderRadius: '4px'
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
              <button onClick={moveLeft} className="btn-cute btn-cute-secondary" style={{ padding: '0.6rem 1rem' }}><ArrowLeft size={20} /></button>
              <button onClick={rotate} className="btn-cute btn-cute-primary" style={{ padding: '0.6rem 1rem' }}><RotateCw size={20} /></button>
              <button onClick={moveDown} className="btn-cute btn-cute-secondary" style={{ padding: '0.6rem 1rem' }}><ArrowDown size={20} /></button>
              <button onClick={moveRight} className="btn-cute btn-cute-secondary" style={{ padding: '0.6rem 1rem' }}><ArrowRight size={20} /></button>
            </div>
          </div>
        )}

        {/* ENDED PHASE */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <h3 style={{ fontSize: '1.4rem', color: state.winner === 'draw' ? '#ca8a04' : state.winner === role ? '#059669' : '#dc2626', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
              {state.winner === 'draw' ? "It's a Tie!" : state.winner === role ? '🎉 Block Stacker Champion!' : `💔 ${opponentName || 'Partner'} Won!`}
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
