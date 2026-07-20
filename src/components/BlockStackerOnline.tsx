import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw } from 'lucide-react';

// Block Stacker Online — Tetris-inspired racing game
// Each player independently plays Tetris-like stacking, aiming for the most lines cleared
// They each play their own 10×20 board, score synced to race

const COLS = 8;
const ROWS = 16;

const TETROMINOES = [
  { shape: [[1,1,1,1]], color: '#06b6d4' },           // I
  { shape: [[1,1],[1,1]], color: '#eab308' },          // O
  { shape: [[0,1,0],[1,1,1]], color: '#a855f7' },      // T
  { shape: [[1,0,0],[1,1,1]], color: '#f97316' },      // L
  { shape: [[0,0,1],[1,1,1]], color: '#3b82f6' },      // J
  { shape: [[0,1,1],[1,1,0]], color: '#22c55e' },      // S
  { shape: [[1,1,0],[0,1,1]], color: '#ef4444' },      // Z
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
  const cleared = grid.filter(row => row.some(cell => !cell));
  const linesCleared = ROWS - cleared.length;
  const empty = Array(linesCleared).fill(null).map(() => Array(COLS).fill(null));
  return { grid: [...empty, ...cleared], linesCleared };
}

interface TetrisPlayerState {
  grid: Grid;
  piece: { shape: number[][]; color: string; row: number; col: number } | null;
  score: number;
  lines: number;
  gameOver: boolean;
}

function newPlayerState(): TetrisPlayerState {
  const tetIdx = Math.floor(Math.random() * TETROMINOES.length);
  const tet = TETROMINOES[tetIdx];
  return {
    grid: emptyGrid(),
    piece: { shape: tet.shape, color: tet.color, row: -2, col: Math.floor((COLS - tet.shape[0].length) / 2) },
    score: 0,
    lines: 0,
    gameOver: false,
  };
}

interface BlockStackerState {
  phase: 'waiting' | 'playing' | 'ended';
  hostState: TetrisPlayerState;
  guestState: TetrisPlayerState;
  winner: 'host' | 'guest' | 'draw' | null;
  hostScore: number;
  guestScore: number;
}

const INITIAL: BlockStackerState = {
  phase: 'waiting',
  hostState: newPlayerState(),
  guestState: newPlayerState(),
  winner: null,
  hostScore: 0,
  guestScore: 0,
};

export const BlockStackerOnline: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName, playerName } = useGamePeer();
  const state: BlockStackerState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  const myState: TetrisPlayerState = (role === 'host' ? state.hostState : state.guestState) ?? newPlayerState();
  const opponentState: TetrisPlayerState = (role === 'host' ? state.guestState : state.hostState) ?? newPlayerState();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { stateRef.current = state; }, [state]);

  const sendMyState = (ps: TetrisPlayerState) => {
    const s = stateRef.current;
    const key = role === 'host' ? 'hostState' : 'guestState';
    const oppKey = role === 'host' ? 'guestState' : 'hostState';
    const oppState = s[oppKey];

    let winner: 'host' | 'guest' | 'draw' | null = null;
    let phase = s.phase;
    let nextHostScore = s.hostScore;
    let nextGuestScore = s.guestScore;

    if (ps.gameOver || (oppState?.gameOver)) {
      const myLines = ps.lines;
      const oppLines = oppState?.lines ?? 0;
      const myOver = ps.gameOver;
      const oppOver = oppState?.gameOver;
      if (myOver && oppOver) winner = myLines > oppLines ? role! : oppLines > myLines ? (role === 'host' ? 'guest' : 'host') : 'draw';
      else if (myOver) winner = role === 'host' ? 'guest' : 'host';
      else winner = role!;
      phase = 'ended';
      if (winner === 'host') nextHostScore = s.hostScore + 1;
      else if (winner === 'guest') nextGuestScore = s.guestScore + 1;
    }

    sendGameAction({ ...s, [key]: ps, winner, phase, hostScore: nextHostScore, guestScore: nextGuestScore });
  };

  const tick = () => {
    const ps = { ...stateRef.current[role === 'host' ? 'hostState' : 'guestState'] } as TetrisPlayerState;
    if (!ps || ps.gameOver || !ps.piece) return;
    const { shape, color, row, col } = ps.piece;
    const nextRow = row + 1;
    if (isValid(ps.grid, shape, nextRow, col)) {
      sendMyState({ ...ps, piece: { shape, color, row: nextRow, col } });
    } else {
      if (row <= 0) {
        sendMyState({ ...ps, piece: null, gameOver: true });
        return;
      }
      const placed = placePiece(ps.grid, shape, row, col, color);
      const { grid: cleared, linesCleared } = clearLines(placed);
      const score = ps.score + linesCleared * 100 + 10;
      const lines = ps.lines + linesCleared;
      const tetIdx = Math.floor(Math.random() * TETROMINOES.length);
      const tet = TETROMINOES[tetIdx];
      sendMyState({ ...ps, grid: cleared, score, lines, piece: { shape: tet.shape, color: tet.color, row: -2, col: Math.floor((COLS - tet.shape[0].length) / 2) } });
    }
  };

  useEffect(() => {
    if (state.phase !== 'playing') { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(tick, 600);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.phase, myState.gameOver]);

  const move = (dir: 'left' | 'right' | 'down' | 'rotate') => {
    const ps = stateRef.current[role === 'host' ? 'hostState' : 'guestState'] as TetrisPlayerState;
    if (!ps || ps.gameOver || !ps.piece) return;
    const { shape, color, row, col } = ps.piece;
    if (dir === 'left' && isValid(ps.grid, shape, row, col - 1)) sendMyState({ ...ps, piece: { shape, color, row, col: col - 1 } });
    else if (dir === 'right' && isValid(ps.grid, shape, row, col + 1)) sendMyState({ ...ps, piece: { shape, color, row, col: col + 1 } });
    else if (dir === 'down' && isValid(ps.grid, shape, row + 1, col)) sendMyState({ ...ps, piece: { shape, color, row: row + 1, col } });
    else if (dir === 'rotate') {
      const rot = rotatePiece(shape);
      if (isValid(ps.grid, rot, row, col)) sendMyState({ ...ps, piece: { shape: rot, color, row, col } });
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (state.phase !== 'playing') return;
      if (e.key === 'ArrowLeft') move('left');
      else if (e.key === 'ArrowRight') move('right');
      else if (e.key === 'ArrowDown') move('down');
      else if (e.key === 'ArrowUp') move('rotate');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.phase]);

  const startGame = () => sendGameAction({ ...INITIAL, phase: 'playing', hostState: newPlayerState(), guestState: newPlayerState(), hostScore: state.hostScore, guestScore: state.guestScore });
  const fullReset = () => sendGameAction({ ...INITIAL });

  const renderGrid = (ps: TetrisPlayerState, isMe: boolean) => {
    const displayGrid = ps.grid.map(row => [...row]);
    if (ps.piece) {
      const { shape, color, row: pr, col: pc } = ps.piece;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[0].length; c++) {
          if (shape[r][c] && pr + r >= 0 && pr + r < ROWS) {
            displayGrid[pr + r][pc + c] = color;
          }
        }
      }
    }
    return (
      <div style={{ display: 'inline-block' }}>
        <div style={{ textAlign: 'center', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: isMe ? '#7c3aed' : '#6b7280' }}>
          {isMe ? `${playerName} 🎮` : `${opponentName || 'Partner'} 👁️`}
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: '1px',
          background: '#1e1b4b', padding: '4px', borderRadius: '8px',
          border: `3px solid ${isMe ? '#7c3aed' : '#d1d5db'}`,
          opacity: ps.gameOver ? 0.5 : 1,
        }}>
          {displayGrid.map((row, r) =>
            row.map((cell, c) => (
              <div key={`${r}-${c}`} style={{
                width: isMe ? 22 : 14, height: isMe ? 22 : 14,
                background: cell || '#0f172a',
                borderRadius: '2px',
                boxShadow: cell ? 'inset 0 1px 2px rgba(255,255,255,0.3)' : 'none',
              }} />
            ))
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: '0.3rem', fontSize: '0.8rem', color: '#374151' }}>
          Score: {ps.score} | Lines: {ps.lines}
        </div>
      </div>
    );
  };

  return (
    <div className="container-cute" style={{ maxWidth: '680px' }}>
      <div className="card-cute" style={{ background: '#f8f5ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Block Stacker Online 🧱</span>
        </div>

        {state.phase === 'waiting' && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧱</div>
            <p className="font-cute" style={{ color: '#7c3aed', marginBottom: '1.5rem' }}>Race to stack! Most lines cleared wins! Use arrow keys ⬅➡⬆⬇</p>
            {role === 'host' ? (
              <button onClick={startGame} className="btn-cute btn-cute-primary">Start Game! 🚀</button>
            ) : (
              <p style={{ color: '#a78bfa' }}>Waiting for {opponentName || 'host'} to start... ⏳</p>
            )}
          </div>
        )}

        {state.phase === 'playing' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {renderGrid(myState, true)}
              {renderGrid(opponentState, false)}
            </div>
            {/* Mobile controls */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              {(['left', 'rotate', 'right', 'down'] as const).map(dir => (
                <button key={dir} onClick={() => move(dir)} className="btn-cute btn-cute-secondary" style={{ padding: '0.6rem 1rem', fontSize: '1.3rem', minWidth: '50px' }}>
                  {dir === 'left' ? '⬅' : dir === 'rotate' ? '🔄' : dir === 'right' ? '➡' : '⬇'}
                </button>
              ))}
            </div>
          </div>
        )}

        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{state.winner === role ? '🏆' : state.winner === 'draw' ? '🤝' : '💔'}</div>
            <div className="font-cute" style={{ fontSize: '1.2rem', color: '#7c3aed', marginBottom: '0.5rem' }}>
              {state.winner === 'draw' ? "It's a draw!" : state.winner === role ? 'You stacked better! 🎉' : 'Partner wins!'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              {renderGrid(myState, true)}
              {renderGrid(opponentState, false)}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '1.5rem' }}>
          {state.phase !== 'playing' && role === 'host' && (
            <button onClick={startGame} className="btn-cute btn-cute-primary"><RefreshCw size={15} /> {state.phase === 'ended' ? 'Play Again' : 'Start'}</button>
          )}
          <button onClick={fullReset} className="btn-cute btn-cute-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>Reset Scores</button>
        </div>
      </div>
    </div>
  );
};
