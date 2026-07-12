import React, { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

type Cell = 'X' | 'O' | null;
type Difficulty = 'easy' | 'hard';

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],            // diagonals
];

function checkWinner(board: Cell[]): { winner: Cell; line: number[] } | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  return null;
}

function getEmpty(board: Cell[]): number[] {
  return board.reduce<number[]>((acc, c, i) => (c === null ? [...acc, i] : acc), []);
}

function minimax(board: Cell[], isMax: boolean, depth: number): number {
  const result = checkWinner(board);
  if (result?.winner === 'O') return 10 - depth;
  if (result?.winner === 'X') return depth - 10;
  const empty = getEmpty(board);
  if (empty.length === 0) return 0;

  if (isMax) {
    let best = -Infinity;
    for (const i of empty) {
      board[i] = 'O';
      best = Math.max(best, minimax(board, false, depth + 1));
      board[i] = null;
    }
    return best;
  } else {
    let best = Infinity;
    for (const i of empty) {
      board[i] = 'X';
      best = Math.min(best, minimax(board, true, depth + 1));
      board[i] = null;
    }
    return best;
  }
}

function getBotMove(board: Cell[], difficulty: Difficulty): number {
  const empty = getEmpty(board);
  if (difficulty === 'easy') return empty[Math.floor(Math.random() * empty.length)];
  let bestVal = -Infinity, bestMove = empty[0];
  for (const i of empty) {
    board[i] = 'O';
    const val = minimax(board, false, 0);
    board[i] = null;
    if (val > bestVal) { bestVal = val; bestMove = i; }
  }
  return bestMove;
}

const PLAYER_EMOJI = '❤️';
const BOT_EMOJI = '⭐';

interface Props { onBack: () => void; }

export const OfflineTicTacToe: React.FC<Props> = ({ onBack }) => {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [phase, setPhase] = useState<'pick' | 'playing' | 'ended'>('pick');
  const [result, setResult] = useState<'win' | 'lose' | 'draw' | null>(null);
  const [winLine, setWinLine] = useState<number[]>([]);
  const [scores, setScores] = useState({ wins: 0, losses: 0, draws: 0 });
  const [botThinking, setBotThinking] = useState(false);

  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setPhase('playing');
    setResult(null);
    setWinLine([]);
    setBotThinking(false);
  }, []);

  const endGame = useCallback((res: 'win' | 'lose' | 'draw', line: number[]) => {
    setResult(res);
    setWinLine(line);
    setPhase('ended');
    setScores(s => ({
      wins: s.wins + (res === 'win' ? 1 : 0),
      losses: s.losses + (res === 'lose' ? 1 : 0),
      draws: s.draws + (res === 'draw' ? 1 : 0),
    }));
    if (res === 'win') {
      confetti({ particleCount: 80, spread: 100, colors: ['#7c3aed', '#a78bfa', '#ddd6fe', '#ec4899'] });
    }
  }, []);

  const playerMove = useCallback((idx: number) => {
    if (!isPlayerTurn || board[idx] !== null || phase !== 'playing' || botThinking) return;
    const next = [...board];
    next[idx] = 'X';
    setBoard(next);
    const winner = checkWinner(next);
    if (winner) { endGame('win', winner.line); return; }
    if (getEmpty(next).length === 0) { endGame('draw', []); return; }
    setIsPlayerTurn(false);
    setBotThinking(true);
  }, [board, isPlayerTurn, phase, botThinking, endGame]);

  // Bot move with delay
  useEffect(() => {
    if (!botThinking || !difficulty || phase !== 'playing') return;
    const id = setTimeout(() => {
      const next = [...board];
      const botIdx = getBotMove([...next], difficulty);
      if (botIdx === undefined) return;
      next[botIdx] = 'O';
      setBoard(next);
      const winner = checkWinner(next);
      if (winner) { endGame('lose', winner.line); setBotThinking(false); return; }
      if (getEmpty(next).length === 0) { endGame('draw', []); setBotThinking(false); return; }
      setIsPlayerTurn(true);
      setBotThinking(false);
    }, difficulty === 'easy' ? 400 : 700);
    return () => clearTimeout(id);
  }, [botThinking, board, difficulty, phase, endGame]);

  const replay = () => { if (difficulty) startGame(difficulty); };

  const CELL_EMOJI = (cell: Cell) => cell === 'X' ? PLAYER_EMOJI : cell === 'O' ? BOT_EMOJI : null;

  return (
    <div className="container-cute" style={{ maxWidth: '680px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Tic-Tac-Love 🎮</span>
        </div>

        {/* PICK DIFFICULTY */}
        {phase === 'pick' && (
          <div style={{ textAlign: 'center' }}>
            <h2 className="heading-lg">Tic-Tac-Love 💕</h2>
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
              You play as {PLAYER_EMOJI} vs the AI bot {BOT_EMOJI}
            </p>
            <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '0.9rem' }}>Pick your difficulty:</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              {(['easy', 'hard'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => startGame(d)}
                  style={{
                    background: '#fff', border: '2.5px solid #ddd6fe', borderRadius: '20px',
                    padding: '2rem 2.5rem', cursor: 'pointer', textAlign: 'center',
                    transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                    boxShadow: '0 2px 10px rgba(124,58,237,0.08)',
                  }}
                  onMouseEnter={e => { const t = e.currentTarget; t.style.transform = 'translateY(-5px) scale(1.04)'; t.style.borderColor = '#a78bfa'; }}
                  onMouseLeave={e => { const t = e.currentTarget; t.style.transform = ''; t.style.borderColor = '#ddd6fe'; }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{d === 'easy' ? '🌸' : '🧠'}</div>
                  <div className="font-cute" style={{ color: '#4c1d95', fontSize: '1.3rem' }}>{d === 'easy' ? 'Easy' : 'Hard'}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.82rem', marginTop: '0.3rem' }}>
                    {d === 'easy' ? 'AI plays randomly' : 'AI plays perfectly'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PLAYING & ENDED */}
        {(phase === 'playing' || phase === 'ended') && (
          <div style={{ textAlign: 'center' }}>
            {/* Score strip */}
            <div style={{ display: 'flex', justifyContent: 'space-around', background: '#fff', borderRadius: '14px', padding: '0.7rem', border: '1px solid #ede9fe', marginBottom: '1.2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>You {PLAYER_EMOJI}</div>
                <div className="font-cute" style={{ fontSize: '1.5rem', color: '#059669' }}>{scores.wins}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Draws</div>
                <div className="font-cute" style={{ fontSize: '1.5rem', color: '#6b7280' }}>{scores.draws}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Bot {BOT_EMOJI}</div>
                <div className="font-cute" style={{ fontSize: '1.5rem', color: '#dc2626' }}>{scores.losses}</div>
              </div>
            </div>

            {/* Turn indicator */}
            {phase === 'playing' && (
              <div style={{ marginBottom: '1rem', fontFamily: 'var(--font-cute)', fontSize: '1.1rem', color: '#4c1d95', minHeight: '28px' }}>
                {botThinking ? `Bot ${BOT_EMOJI} is thinking...` : `Your turn ${PLAYER_EMOJI}`}
              </div>
            )}

            {/* Result banner */}
            {phase === 'ended' && (
              <div style={{ marginBottom: '1.2rem', animation: 'pop-in 0.4s ease' }}>
                {result === 'win' && <><div style={{ fontSize: '2rem' }}>🎉</div><h3 className="font-cute" style={{ color: '#059669', fontSize: '1.8rem', margin: '0.2rem 0' }}>You Won! 🎉</h3></>}
                {result === 'lose' && <><div style={{ fontSize: '2rem' }}>😅</div><h3 className="font-cute" style={{ color: '#dc2626', fontSize: '1.8rem', margin: '0.2rem 0' }}>Bot Won! Try Again!</h3></>}
                {result === 'draw' && <><div style={{ fontSize: '2rem' }}>🤝</div><h3 className="font-cute" style={{ color: '#d97706', fontSize: '1.8rem', margin: '0.2rem 0' }}>It's a Draw!</h3></>}
              </div>
            )}

            {/* Board */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
              maxWidth: '320px', margin: '0 auto 1.5rem',
            }}>
              {board.map((cell, idx) => {
                const isWinCell = winLine.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => playerMove(idx)}
                    style={{
                      aspectRatio: '1', borderRadius: '16px',
                      background: isWinCell ? (result === 'win' ? '#d1fae5' : '#fef2f2') : (cell ? '#f5f3ff' : '#fff'),
                      border: isWinCell ? `3px solid ${result === 'win' ? '#10b981' : '#fca5a5'}` : '2.5px solid #ddd6fe',
                      fontSize: '2.4rem', cursor: !cell && phase === 'playing' && isPlayerTurn && !botThinking ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                      boxShadow: isWinCell ? '0 4px 14px rgba(16,185,129,0.2)' : '0 2px 6px rgba(0,0,0,0.06)',
                      transform: isWinCell ? 'scale(1.06)' : 'scale(1)',
                    }}
                    onMouseEnter={e => { if (!cell && phase === 'playing' && isPlayerTurn && !botThinking) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.borderColor = '#a78bfa'; } }}
                    onMouseLeave={e => { if (!isWinCell) { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = '#ddd6fe'; } }}
                  >
                    {CELL_EMOJI(cell) && <span style={{ animation: 'pop-in 0.25s ease' }}>{CELL_EMOJI(cell)}</span>}
                  </button>
                );
              })}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={replay} className="btn-cute btn-cute-primary">
                <RefreshCw size={15} /> {phase === 'ended' ? 'Play Again' : 'Restart'}
              </button>
              <button onClick={() => { setPhase('pick'); setDifficulty(null); }} className="btn-cute btn-cute-secondary">
                Change Difficulty
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
