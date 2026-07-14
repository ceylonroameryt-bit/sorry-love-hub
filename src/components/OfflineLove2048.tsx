import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

// ─── Tile emoji mapping ───────────────────────────────────────────────────────
const TILE_EMOJI: Record<number, string> = {
  2: '💛', 4: '💚', 8: '💙', 16: '💜', 32: '💖',
  64: '❤️', 128: '🌹', 256: '💍', 512: '👑', 1024: '💎', 2048: '🌟',
};
const TILE_BG: Record<number, string> = {
  2: '#fef9c3', 4: '#dcfce7', 8: '#dbeafe', 16: '#ede9fe', 32: '#fce7f3',
  64: '#fee2e2', 128: '#ffe4e6', 256: '#f0f9ff', 512: '#fdf4ff', 1024: '#e0f2fe', 2048: '#fef08a',
};
const TILE_BORDER: Record<number, string> = {
  2: '#fde68a', 4: '#86efac', 8: '#93c5fd', 16: '#c4b5fd', 32: '#f9a8d4',
  64: '#fca5a5', 128: '#fda4af', 256: '#7dd3fc', 512: '#e879f9', 1024: '#38bdf8', 2048: '#facc15',
};

type Grid = (number | null)[][];

function emptyGrid(): Grid {
  return Array.from({ length: 4 }, () => Array(4).fill(null));
}

function addRandomTile(g: Grid): Grid {
  const empties: [number, number][] = [];
  g.forEach((row, r) => row.forEach((v, c) => { if (!v) empties.push([r, c]); }));
  if (!empties.length) return g;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const next = g.map(row => [...row]) as Grid;
  next[r][c] = Math.random() < 0.85 ? 2 : 4;
  return next;
}

function initGrid(): Grid {
  return addRandomTile(addRandomTile(emptyGrid()));
}

function slideRow(row: (number | null)[]): { row: (number | null)[]; gained: number } {
  const nums = row.filter(Boolean) as number[];
  let gained = 0;
  const merged: number[] = [];
  let i = 0;
  while (i < nums.length) {
    if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
      const val = nums[i] * 2;
      merged.push(val);
      gained += val;
      i += 2;
    } else {
      merged.push(nums[i]);
      i++;
    }
  }
  while (merged.length < 4) merged.push(0);
  return { row: merged.map(v => v || null), gained };
}

type Direction = 'left' | 'right' | 'up' | 'down';

function move(grid: Grid, dir: Direction): { grid: Grid; gained: number; changed: boolean } {
  let g = grid.map(row => [...row]) as Grid;
  let totalGained = 0;

  const rotate90 = (gr: Grid): Grid =>
    gr[0].map((_, c) => gr.map(row => row[c]).reverse());
  const rotate270 = (gr: Grid): Grid => rotate90(rotate90(rotate90(gr)));
  const flipH = (gr: Grid): Grid => gr.map(row => [...row].reverse());

  if (dir === 'right') g = flipH(g);
  if (dir === 'up') g = rotate270(g);
  if (dir === 'down') g = rotate90(g);

  const newG: Grid = g.map(row => {
    const { row: slid, gained } = slideRow(row);
    totalGained += gained;
    return slid;
  });

  let result: Grid = newG;
  if (dir === 'right') result = flipH(newG);
  else if (dir === 'up') result = rotate90(newG);
  else if (dir === 'down') result = rotate270(newG);
  else result = newG;

  const changed = JSON.stringify(grid) !== JSON.stringify(result);
  return { grid: result, gained: totalGained, changed };
}

function isGameOver(grid: Grid): boolean {
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      if (!grid[r][c]) return false;
      if (c < 3 && grid[r][c] === grid[r][c + 1]) return false;
      if (r < 3 && grid[r][c] === grid[r + 1][c]) return false;
    }
  return true;
}

interface Props { onBack: () => void; }

export const OfflineLove2048: React.FC<Props> = ({ onBack }) => {
  const [grid, setGrid] = useState<Grid>(initGrid);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem('love2048_best') ?? '0'));
  const [won, setWon] = useState(false);
  const [over, setOver] = useState(false);
  const [wonDismissed, setWonDismissed] = useState(false);

  const doMove = useCallback((dir: Direction) => {
    if (over) return;
    setGrid(prev => {
      const { grid: next, gained, changed } = move(prev, dir);
      if (!changed) return prev;
      const withTile = addRandomTile(next);
      setScore(s => {
        const ns = s + gained;
        setBest(b => { const nb = Math.max(b, ns); localStorage.setItem('love2048_best', String(nb)); return nb; });
        return ns;
      });
      if (withTile.some(row => row.some(v => v === 2048))) {
        setWon(true);
        confetti({ particleCount: 150, spread: 120, colors: ['#7c3aed', '#f9a8d4', '#fde68a'] });
      }
      if (isGameOver(withTile)) setOver(true);
      return withTile;
    });
  }, [over]);

  const restart = () => {
    setGrid(initGrid());
    setScore(0);
    setWon(false);
    setOver(false);
    setWonDismissed(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
        a: 'left', d: 'right', w: 'up', s: 'down',
      };
      if (map[e.key]) { e.preventDefault(); doMove(map[e.key]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doMove]);

  // Touch swipe
  useEffect(() => {
    let sx = 0, sy = 0;
    const ts = (e: TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
    const te = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
      if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? 'right' : 'left');
      else doMove(dy > 0 ? 'down' : 'up');
    };
    window.addEventListener('touchstart', ts, { passive: true });
    window.addEventListener('touchend', te, { passive: true });
    return () => { window.removeEventListener('touchstart', ts); window.removeEventListener('touchend', te); };
  }, [doMove]);

  const maxTile = Math.max(...grid.flat().map(v => v ?? 0));

  return (
    <div className="container-cute" style={{ maxWidth: '520px' }}>
      <div className="card-cute" style={{ background: '#fdf4ff', border: '1.5px solid #ddd6fe' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Love 2048 🌟</span>
          <button onClick={restart} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Score row */}
        <div style={{ display: 'flex', justifyContent: 'space-around', background: '#fff', borderRadius: '14px', padding: '0.6rem', border: '1px solid #ede9fe', marginBottom: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Score</div>
            <div className="font-cute" style={{ fontSize: '1.3rem', color: '#7c3aed' }}>{score}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Best 🏆</div>
            <div className="font-cute" style={{ fontSize: '1.3rem', color: '#d97706' }}>{best}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Top Tile</div>
            <div style={{ fontSize: '1.3rem' }}>{TILE_EMOJI[maxTile] ?? '💛'}</div>
          </div>
        </div>

        {/* Game grid */}
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px',
            background: '#c4b5fd', padding: '8px', borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(124,58,237,0.2)',
          }}>
            {grid.flat().map((val, i) => (
              <div key={i} style={{
                aspectRatio: '1',
                background: val ? (TILE_BG[val] ?? '#fdf4ff') : 'rgba(255,255,255,0.4)',
                border: val ? `2px solid ${TILE_BORDER[val] ?? '#ddd6fe'}` : '2px solid transparent',
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: val ? (val >= 256 ? '1.6rem' : '2rem') : '1rem',
                transition: 'all 0.1s ease',
                boxShadow: val ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                animation: val ? 'pop-in 0.15s ease' : 'none',
              }}>
                {val ? (TILE_EMOJI[val] ?? '🌟') : ''}
              </div>
            ))}
          </div>

          {/* Won overlay */}
          {won && !wonDismissed && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '16px',
              background: 'rgba(245,243,255,0.94)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.8rem',
            }}>
              <div style={{ fontSize: '3rem', animation: 'float 2s ease infinite' }}>🌟</div>
              <h3 className="font-cute" style={{ color: '#7c3aed', fontSize: '2rem', margin: 0 }}>You reached 2048!</h3>
              <p style={{ color: '#6b7280', margin: 0, textAlign: 'center', fontSize: '0.9rem' }}>Your love is infinite 💜</p>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button onClick={() => setWonDismissed(true)} className="btn-cute btn-cute-primary">Keep Going!</button>
                <button onClick={restart} className="btn-cute btn-cute-secondary">New Game</button>
              </div>
            </div>
          )}

          {/* Game over overlay */}
          {over && !won && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '16px',
              background: 'rgba(245,243,255,0.94)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.8rem',
            }}>
              <div style={{ fontSize: '3rem' }}>💔</div>
              <h3 className="font-cute" style={{ color: '#dc2626', fontSize: '1.8rem', margin: 0 }}>No more moves!</h3>
              <p style={{ color: '#6b7280', margin: 0 }}>Score: <strong style={{ color: '#7c3aed' }}>{score}</strong></p>
              <button onClick={restart} className="btn-cute btn-cute-primary"><RefreshCw size={14} /> Try Again</button>
            </div>
          )}
        </div>

        {/* Emoji legend */}
        <div style={{ marginTop: '1rem', background: '#fff', borderRadius: '12px', padding: '0.7rem 1rem', border: '1px solid #ede9fe' }}>
          <p style={{ fontSize: '0.72rem', color: '#6b7280', margin: '0 0 0.4rem', textAlign: 'center' }}>
            Swipe or use arrow keys to merge tiles
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
            {Object.entries(TILE_EMOJI).map(([v, e]) => (
              <span key={v} style={{ fontSize: '0.72rem', background: TILE_BG[+v], border: `1px solid ${TILE_BORDER[+v]}`, borderRadius: '8px', padding: '2px 7px', color: '#4c1d95' }}>
                {v} {e}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
