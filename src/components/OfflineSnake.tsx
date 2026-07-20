import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Play, Trophy } from 'lucide-react';

// ─── Config ─────────────────────────────────────────────────────────────────
const COLS = 18;
const ROWS = 16;
const CELL = 26; // logical px per cell (actual canvas uses DPR scaling)

type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
interface Pt { x: number; y: number; }

const OPPOSITE: Record<Dir, Dir> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };

function rndPt(exclude: Pt[]): Pt {
  let p: Pt;
  do { p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }; }
  while (exclude.some(e => e.x === p.x && e.y === p.y));
  return p;
}

const INIT_SNAKE: Pt[] = [{ x: 9, y: 8 }, { x: 8, y: 8 }, { x: 7, y: 8 }];

interface Props { onBack: () => void; }

export const OfflineSnake: React.FC<Props> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snakeRef = useRef<Pt[]>(INIT_SNAKE.map(p => ({ ...p })));
  const dirRef = useRef<Dir>('RIGHT');
  const nextDirRef = useRef<Dir>('RIGHT');
  const foodRef = useRef<Pt>(rndPt(INIT_SNAKE));
  const scoreRef = useRef(0);
  const phaseRef = useRef<'idle' | 'playing' | 'dead'>('idle');
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);
  const speedRef = useRef(130);
  const dprRef = useRef(1);

  const [phase, setPhase] = useState<'idle' | 'playing' | 'dead'>('idle');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem('snake_best') ?? '0'));

  // ── Draw ─────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = COLS * CELL;
    const H = ROWS * CELL;

    // Background grid
    ctx.fillStyle = '#fdf4ff';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#f3e8ff';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke(); }
    for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke(); }

    // Food
    ctx.font = `${CELL - 2}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const f = foodRef.current;
    ctx.fillText('💖', f.x * CELL + CELL / 2, f.y * CELL + CELL / 2);

    // Snake body
    const snake = snakeRef.current;
    snake.forEach((seg, i) => {
      const t = i / snake.length;
      const r = Math.round(124 + t * 55);
      const g = Math.round(58 + t * 80);
      const b = 237;
      ctx.fillStyle = `rgba(${r},${g},${b},${i === 0 ? 1 : 0.85})`;

      // Shadow on head
      if (i === 0) {
        ctx.shadowColor = 'rgba(124,58,237,0.4)';
        ctx.shadowBlur = 8;
      } else {
        ctx.shadowBlur = 0;
      }

      const pad = i === 0 ? 1 : 2;
      const radius = i === 0 ? 7 : 5;
      const x = seg.x * CELL + pad;
      const y = seg.y * CELL + pad;
      const w = CELL - pad * 2;
      const h = CELL - pad * 2;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.arcTo(x + w, y, x + w, y + radius, radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
      ctx.lineTo(x + radius, y + h);
      ctx.arcTo(x, y + h, x, y + h - radius, radius);
      ctx.lineTo(x, y + radius);
      ctx.arcTo(x, y, x + radius, y, radius);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Head eyes
      if (i === 0) {
        ctx.fillStyle = 'white';
        ctx.fillRect(seg.x * CELL + 4, seg.y * CELL + 4, 4, 4);
        ctx.fillRect(seg.x * CELL + 14, seg.y * CELL + 4, 4, 4);
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(seg.x * CELL + 5, seg.y * CELL + 5, 2, 2);
        ctx.fillRect(seg.x * CELL + 15, seg.y * CELL + 5, 2, 2);
      }
    });
  }, []);

  // ── Game loop ────────────────────────────────────────────────────────────
  const loop = useCallback((ts: number) => {
    if (phaseRef.current !== 'playing') return;
    draw();

    if (ts - lastTickRef.current >= speedRef.current) {
      lastTickRef.current = ts;
      dirRef.current = nextDirRef.current;

      const head = snakeRef.current[0];
      const d = dirRef.current;
      const nh: Pt = {
        x: d === 'LEFT' ? head.x - 1 : d === 'RIGHT' ? head.x + 1 : head.x,
        y: d === 'UP' ? head.y - 1 : d === 'DOWN' ? head.y + 1 : head.y,
      };

      if (nh.x < 0 || nh.x >= COLS || nh.y < 0 || nh.y >= ROWS) {
        phaseRef.current = 'dead';
        setPhase('dead');
        setBest(prev => { const n = Math.max(prev, scoreRef.current); localStorage.setItem('snake_best', String(n)); return n; });
        return;
      }
      if (snakeRef.current.some(s => s.x === nh.x && s.y === nh.y)) {
        phaseRef.current = 'dead';
        setPhase('dead');
        setBest(prev => { const n = Math.max(prev, scoreRef.current); localStorage.setItem('snake_best', String(n)); return n; });
        return;
      }

      const ate = nh.x === foodRef.current.x && nh.y === foodRef.current.y;
      const newSnake = [nh, ...snakeRef.current];
      if (!ate) newSnake.pop();
      snakeRef.current = newSnake;

      if (ate) {
        const ns = scoreRef.current + 10;
        scoreRef.current = ns;
        setScore(ns);
        speedRef.current = Math.max(55, 130 - Math.floor(ns / 10) * 5);
        foodRef.current = rndPt(newSnake);
      }
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [draw]);

  const startGame = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    snakeRef.current = INIT_SNAKE.map(p => ({ ...p }));
    dirRef.current = 'RIGHT';
    nextDirRef.current = 'RIGHT';
    foodRef.current = rndPt(INIT_SNAKE);
    scoreRef.current = 0;
    speedRef.current = 130;
    lastTickRef.current = 0;
    phaseRef.current = 'playing';
    setScore(0);
    setPhase('playing');
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const changeDir = useCallback((dir: Dir) => {
    if (OPPOSITE[dir] !== dirRef.current) nextDirRef.current = dir;
  }, []);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
        w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
        W: 'UP', S: 'DOWN', A: 'LEFT', D: 'RIGHT',
      };
      if (map[e.key]) { e.preventDefault(); changeDir(map[e.key]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [changeDir]);

  // HiDPI canvas setup on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;
    const W = COLS * CELL;
    const H = ROWS * CELL;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    draw();
  }, [draw]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const W = COLS * CELL;
  const H = ROWS * CELL;

  return (
    <div className="container-cute" style={{ maxWidth: '560px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Snake Love 🐍💖</span>
        </div>

        {/* Score bar */}
        <div style={{ display: 'flex', justifyContent: 'space-around', background: '#fff', borderRadius: '14px', padding: '0.6rem 1rem', border: '1px solid #ede9fe', marginBottom: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Score 💖</div>
            <div className="font-cute" style={{ fontSize: '1.3rem', color: '#7c3aed' }}>{score}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Best 🏆</div>
            <div className="font-cute" style={{ fontSize: '1.3rem', color: '#d97706' }}>{best}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Speed 🏃</div>
            <div className="font-cute" style={{ fontSize: '1.3rem', color: '#059669' }}>{phase === 'playing' ? `${Math.round((130 - speedRef.current) / 7.5 + 1)}x` : '—'}</div>
          </div>
        </div>

        {/* Canvas */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.8rem' }}>
          <div style={{ position: 'relative', border: '3px solid #a78bfa', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(124,58,237,0.2)' }}>
            <canvas
              ref={canvasRef}
              style={{ display: 'block', width: `${W}px`, height: `${H}px`, maxWidth: '100%' }}
            />

            {phase !== 'playing' && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(245,243,255,0.93)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.8rem',
              }}>
                {phase === 'dead' && (
                  <>
                    <div style={{ fontSize: '3rem' }}>💔</div>
                    <h3 className="font-cute" style={{ color: '#dc2626', fontSize: '1.8rem', margin: 0 }}>Game Over!</h3>
                    <p style={{ color: '#6b7280', margin: 0 }}>You scored <strong style={{ color: '#7c3aed' }}>{score}</strong> points</p>
                    {score > 0 && score === best && <p style={{ color: '#d97706', fontWeight: 700, margin: 0 }}>🏆 New Best!</p>}
                  </>
                )}
                {phase === 'idle' && (
                  <>
                    <div style={{ fontSize: '3rem', animation: 'float 2s ease infinite' }}>🐍💖</div>
                    <h3 className="font-cute" style={{ color: '#7c3aed', fontSize: '1.8rem', margin: 0 }}>Snake Love!</h3>
                    <p style={{ color: '#6b7280', margin: '0 1.5rem', textAlign: 'center', fontSize: '0.88rem' }}>
                      Eat the hearts 💖 to grow. Avoid walls and yourself!<br />
                      <span style={{ fontSize: '0.78rem', color: '#a78bfa' }}>Arrow keys or WASD to move</span>
                    </p>
                  </>
                )}
                <button onClick={startGame} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', padding: '0.75rem 2rem' }}>
                  <Play size={16} /> {phase === 'dead' ? 'Try Again' : 'Start!'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* D-pad for mobile */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <button onPointerDown={() => changeDir('UP')} className="btn-cute btn-cute-secondary" style={{ width: '48px', height: '38px', padding: 0, justifyContent: 'center', fontSize: '1.1rem' }}>▲</button>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onPointerDown={() => changeDir('LEFT')} className="btn-cute btn-cute-secondary" style={{ width: '48px', height: '38px', padding: 0, justifyContent: 'center', fontSize: '1.1rem' }}>◀</button>
            <button onPointerDown={() => changeDir('DOWN')} className="btn-cute btn-cute-secondary" style={{ width: '48px', height: '38px', padding: 0, justifyContent: 'center', fontSize: '1.1rem' }}>▼</button>
            <button onPointerDown={() => changeDir('RIGHT')} className="btn-cute btn-cute-secondary" style={{ width: '48px', height: '38px', padding: 0, justifyContent: 'center', fontSize: '1.1rem' }}>▶</button>
          </div>
        </div>

        {best > 0 && (
          <div style={{ textAlign: 'center', marginTop: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', color: '#d97706', fontSize: '0.85rem', fontWeight: 600 }}>
            <Trophy size={15} /> All-time best: {best} pts
          </div>
        )}
      </div>
    </div>
  );
};
