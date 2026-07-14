import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Play } from 'lucide-react';

const SOLVED = [1, 2, 3, 4, 5, 6, 7, 8, 0];

function getInversions(arr: number[]): number {
  let inv = 0;
  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] && arr[j] && arr[i] > arr[j]) inv++;
    }
  }
  return inv;
}

function generateSolvableBoard(): number[] {
  while (true) {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5);
    // Solvable 3x3 sliding puzzle has an even number of inversions
    if (getInversions(arr) % 2 === 0) {
      // Don't start solved
      if (arr.join(',') !== SOLVED.join(',')) return arr;
    }
  }
}

interface Props { onBack: () => void; }

export const OfflineSlidingPuzzle: React.FC<Props> = ({ onBack }) => {
  const [board, setBoard] = useState<number[]>(generateSolvableBoard);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);
  const [time, setTime] = useState(0);
  const [active, setActive] = useState(false);

  const startPuzzle = () => {
    setBoard(generateSolvableBoard());
    setMoves(0);
    setSolved(false);
    setTime(0);
    setActive(true);
  };

  useEffect(() => {
    if (!active || solved) return;
    const interval = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [active, solved]);

  const clickTile = (idx: number) => {
    if (solved || !active) return;
    const emptyIdx = board.indexOf(0);

    const r = Math.floor(idx / 3);
    const c = idx % 3;
    const er = Math.floor(emptyIdx / 3);
    const ec = emptyIdx % 3;

    // Check adjacency
    const dist = Math.abs(r - er) + Math.abs(c - ec);
    if (dist === 1) {
      const nextBoard = [...board];
      nextBoard[emptyIdx] = board[idx];
      nextBoard[idx] = 0;
      setBoard(nextBoard);
      setMoves(m => m + 1);

      // Check win condition
      if (nextBoard.join(',') === SOLVED.join(',')) {
        setSolved(true);
        setActive(false);
      }
    }
  };

  return (
    <div className="container-cute" style={{ maxWidth: '440px' }}>
      <div className="card-cute" style={{ background: '#faf5ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <span className="badge-cute">Slide Puzzle 🧩</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', background: '#fff', borderRadius: '14px', padding: '0.6rem', border: '1px solid #ede9fe', marginBottom: '1.2rem' }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.72rem', color: '#6b7280' }}>Moves</div><div className="font-cute" style={{ fontSize: '1.3rem', color: '#7c3aed' }}>{moves}</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.72rem', color: '#6b7280' }}>Time</div><div className="font-cute" style={{ fontSize: '1.3rem', color: '#ec4899' }}>{time}s</div></div>
        </div>

        {!active && !solved ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '3rem', animation: 'float 2s ease infinite', marginBottom: '0.8rem' }}>🧩🔢</div>
            <h2 className="heading-lg">Sliding Puzzle</h2>
            <p style={{ color: '#6b7280', margin: '0 0 1.5rem', fontSize: '0.9rem' }}>Order numbers 1 to 8 by sliding adjacent tiles!</p>
            <button onClick={startPuzzle} className="btn-cute btn-cute-primary">
              <Play size={14} /> Start Game
            </button>
          </div>
        ) : (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              background: '#ede9fe',
              padding: '8px',
              borderRadius: '16px',
              marginBottom: '1rem',
            }}>
              {board.map((val, idx) => (
                <button
                  key={idx}
                  onClick={() => clickTile(idx)}
                  disabled={val === 0 || solved}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '12px',
                    border: 'none',
                    background: val === 0 ? 'transparent' : '#fff',
                    color: '#4c1d95',
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    boxShadow: val === 0 ? 'none' : '0 4px 10px rgba(124,58,237,0.1)',
                    cursor: val === 0 ? 'default' : 'pointer',
                    transform: val === 0 ? 'none' : 'scale(1)',
                    transition: 'all 0.1s ease',
                  }}
                >
                  {val === 0 ? '' : val}
                </button>
              ))}
            </div>

            {solved && (
              <div style={{ textAlign: 'center', animation: 'pop-in 0.4s ease', padding: '1rem 0' }}>
                <div style={{ fontSize: '2.5rem' }}>🏆</div>
                <h3 className="font-cute" style={{ color: '#059669', fontSize: '1.4rem', margin: '0 0 0.5rem' }}>Puzzle Solved!</h3>
                <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Finished in {moves} moves & {time} seconds!
                </p>
                <button onClick={startPuzzle} className="btn-cute btn-cute-primary">
                  <RotateCcw size={14} /> Reset Puzzle
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
