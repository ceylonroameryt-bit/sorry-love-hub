import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Play, Trophy } from 'lucide-react';

interface FallingItem {
  id: string;
  x: number;
  y: number;
  type: 'heart' | 'star' | 'cupcake' | 'bomb';
  speed: number;
}

const EMOJI_MAP: Record<string, string> = { heart: '💖', star: '🌟', cupcake: '🧁', bomb: '💣' };
const POINTS: Record<string, number> = { heart: 1, star: 2, cupcake: 3, bomb: -5 };
const GAME_DURATION = 45;

interface Props { onBack: () => void; }

export const OfflineCupidCatch: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [items, setItems] = useState<FallingItem[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [basketX, setBasketX] = useState(50);
  const [caught, setCaught] = useState<{ id: string; emoji: string; pts: number; x: number }[]>([]);
  const [bestScore, setBestScore] = useState(() => parseInt(localStorage.getItem('cupid_best') ?? '0'));

  const containerRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<number | null>(null);
  const spawnRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const stateRef = useRef({ items, score: 0, basketX: 50, phase: 'idle' as string });
  const basketXRef = useRef(50);

  const clearAll = () => {
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startGame = useCallback(() => {
    clearAll();
    stateRef.current = { items: [], score: 0, basketX: 50, phase: 'playing' };
    basketXRef.current = 50;
    setItems([]);
    setScore(0);
    setCaught([]);
    setTimeLeft(GAME_DURATION);
    setBasketX(50);
    setPhase('playing');

    spawnRef.current = window.setInterval(() => {
      const types: FallingItem['type'][] = ['heart', 'heart', 'star', 'cupcake', 'bomb'];
      const item: FallingItem = {
        id: Math.random().toString(36).slice(2),
        x: Math.random() * 80 + 10,
        y: 0,
        type: types[Math.floor(Math.random() * types.length)],
        speed: 0.8 + Math.random() * 1.4,
      };
      stateRef.current.items = [...stateRef.current.items, item];
      setItems([...stateRef.current.items]);
    }, 800);

    timerRef.current = window.setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearAll();
          stateRef.current.phase = 'ended';
          setPhase('ended');
          setBestScore(prev => {
            const next = Math.max(prev, stateRef.current.score);
            localStorage.setItem('cupid_best', String(next));
            return next;
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    const BASKET_Y = 82;
    const RADIUS = 9;

    const tick = () => {
      if (stateRef.current.phase !== 'playing') return;
      const bx = basketXRef.current;
      let pts = stateRef.current.score;
      const newCaught: typeof caught = [];

      stateRef.current.items = stateRef.current.items
        .map(item => ({ ...item, y: item.y + item.speed * 1.6 }))
        .filter(item => {
          if (item.y > 95) return false;
          if (item.y >= BASKET_Y - 3 && item.y <= BASKET_Y + 6 && Math.abs(item.x - bx) < RADIUS) {
            const p = POINTS[item.type];
            pts = Math.max(0, pts + p);
            newCaught.push({ id: item.id, emoji: EMOJI_MAP[item.type], pts: p, x: item.x });
            return false;
          }
          return true;
        });

      stateRef.current.score = pts;
      setItems([...stateRef.current.items]);
      setScore(pts);
      if (newCaught.length > 0) {
        setCaught(prev => [...prev.slice(-6), ...newCaught]);
      }
      loopRef.current = requestAnimationFrame(tick);
    };
    loopRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => () => clearAll(), []);

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    if (!clientX) return;
    const x = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    basketXRef.current = x;
    stateRef.current.basketX = x;
    setBasketX(x);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'playing') return;
      const step = 4;
      if (e.key === 'ArrowLeft') { basketXRef.current = Math.max(5, basketXRef.current - step); setBasketX(basketXRef.current); }
      if (e.key === 'ArrowRight') { basketXRef.current = Math.min(95, basketXRef.current + step); setBasketX(basketXRef.current); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  const timerPct = (timeLeft / GAME_DURATION) * 100;

  return (
    <div className="container-cute" style={{ maxWidth: '820px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Cupid's Catch 💖</span>
        </div>

        {/* IDLE */}
        {phase === 'idle' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'float 2s ease infinite' }}>💖🧺</div>
            <h2 className="heading-lg">Cupid's Catch!</h2>
            <p style={{ color: '#6b7280', maxWidth: '480px', margin: '0 auto 1rem', lineHeight: 1.7 }}>
              Move your basket to catch falling <strong>💖 Hearts</strong> (+1), <strong>🌟 Stars</strong> (+2), and <strong>🧁 Cupcakes</strong> (+3)!<br />
              Dodge the <strong>💣 Bombs</strong> (−5)! Use <kbd style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '4px', padding: '1px 5px' }}>←</kbd> <kbd style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '4px', padding: '1px 5px' }}>→</kbd> or move your mouse.
            </p>
            {bestScore > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef9c3', border: '1px solid #fde68a', borderRadius: '50px', padding: '0.4rem 1.1rem', marginBottom: '1.5rem', color: '#92400e', fontWeight: 700 }}>
                <Trophy size={16} /> Best Score: {bestScore} pts
              </div>
            )}
            <br />
            <button onClick={startGame} className="btn-cute btn-cute-primary" style={{ fontSize: '1.1rem', padding: '0.9rem 2.5rem' }}>
              <Play size={18} /> Start Catching!
            </button>
          </div>
        )}

        {/* PLAYING & ENDED */}
        {(phase === 'playing' || phase === 'ended') && (
          <div>
            {/* Stats bar */}
            <div style={{ display: 'flex', justifyContent: 'space-around', background: '#fff', borderRadius: '14px', padding: '0.8rem', border: '1px solid #ede9fe', marginBottom: '0.8rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Score 💜</div>
                <div className="font-cute" style={{ fontSize: '1.6rem', color: '#7c3aed' }}>{score}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Time ⏱️</div>
                <div className="font-cute" style={{ fontSize: '1.6rem', color: timerPct < 30 ? '#dc2626' : '#4c1d95' }}>{timeLeft}s</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Best 🏆</div>
                <div className="font-cute" style={{ fontSize: '1.6rem', color: '#f59e0b' }}>{bestScore}</div>
              </div>
            </div>

            {/* Timer bar */}
            <div style={{ height: '7px', background: '#ede9fe', borderRadius: '99px', overflow: 'hidden', marginBottom: '0.8rem' }}>
              <div style={{ height: '100%', width: `${timerPct}%`, background: timerPct < 30 ? '#dc2626' : 'linear-gradient(90deg,#7c3aed,#a78bfa)', borderRadius: '99px', transition: 'width 1s linear' }} />
            </div>

            {/* Game arena */}
            {phase === 'playing' && (
              <div
                ref={containerRef}
                onMouseMove={handleMove}
                onTouchMove={handleMove}
                style={{
                  height: '380px', width: '100%', position: 'relative',
                  background: 'linear-gradient(180deg,#f5f3ff,#ede9fe)',
                  borderRadius: '18px', border: '2px dashed #c4b5fd',
                  overflow: 'hidden', userSelect: 'none', cursor: 'none',
                }}
              >
                {/* Decorative stars */}
                {['8%', '25%', '50%', '72%', '88%'].map((l, i) => (
                  <div key={i} style={{ position: 'absolute', left: l, top: `${10 + i * 7}%`, fontSize: '0.65rem', opacity: 0.25, animation: `float ${2 + i}s ease-in-out infinite`, animationDelay: `${i * 0.4}s` }}>⭐</div>
                ))}

                {/* Floating items */}
                {items.map(item => (
                  <div key={item.id} style={{
                    position: 'absolute', left: `${item.x}%`, top: `${item.y}%`,
                    transform: 'translate(-50%,-50%)', fontSize: '1.7rem',
                    pointerEvents: 'none', userSelect: 'none',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))',
                  }}>
                    {EMOJI_MAP[item.type]}
                  </div>
                ))}

                {/* Score popups */}
                {caught.map(c => (
                  <div key={c.id} style={{
                    position: 'absolute', left: `${c.x}%`, bottom: '22%',
                    transform: 'translateX(-50%)',
                    fontFamily: 'var(--font-cute)', fontWeight: 700, fontSize: '1rem',
                    color: c.pts > 0 ? '#059669' : '#dc2626',
                    animation: 'float 0.8s ease forwards', pointerEvents: 'none',
                    textShadow: '0 1px 4px rgba(0,0,0,0.12)',
                  }}>
                    {c.pts > 0 ? `+${c.pts}` : c.pts} {c.emoji}
                  </div>
                ))}

                {/* Basket */}
                <div style={{
                  position: 'absolute', left: `${basketX}%`, bottom: '10%',
                  transform: 'translateX(-50%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  pointerEvents: 'none',
                }}>
                  <span style={{ fontSize: '2.6rem' }}>🧺</span>
                </div>

                <div style={{ position: 'absolute', bottom: '2%', width: '100%', textAlign: 'center', fontSize: '0.72rem', color: '#a78bfa', pointerEvents: 'none' }}>
                  Move mouse · Touch · Arrow keys ← →
                </div>
              </div>
            )}

            {/* ENDED */}
            {phase === 'ended' && (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', animation: 'pop-in 0.4s ease' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏁</div>
                <h3 className="font-cute" style={{ color: '#4c1d95', fontSize: '2rem', margin: '0 0 0.5rem' }}>Time's Up!</h3>
                <p style={{ color: '#374151', fontSize: '1.2rem' }}>
                  Final Score: <strong style={{ color: '#7c3aed', fontSize: '1.5rem' }}>{score}</strong> pts
                </p>
                {score >= bestScore && score > 0 && <p style={{ color: '#f59e0b', fontWeight: 700, fontSize: '1.1rem' }}>🏆 New Best Score!</p>}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                  <button onClick={startGame} className="btn-cute btn-cute-primary">Play Again!</button>
                  <button onClick={() => setPhase('idle')} className="btn-cute btn-cute-secondary">Back to Menu</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
