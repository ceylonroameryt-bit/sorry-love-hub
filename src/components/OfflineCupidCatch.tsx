import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Play, Trophy } from 'lucide-react';

interface FallingItem {
  id: string;
  x: number;   // percentage
  y: number;   // percentage (0-100)
  type: 'heart' | 'star' | 'cupcake' | 'bomb';
  vy: number;  // velocity in %/sec
}

const EMOJI_MAP: Record<string, string> = { heart: '💖', star: '🌟', cupcake: '🧁', bomb: '💣' };
const POINTS: Record<string, number> = { heart: 1, star: 2, cupcake: 3, bomb: -5 };
const GAME_DURATION = 45;

interface Props { onBack: () => void; }

export const OfflineCupidCatch: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [bestScore, setBestScore] = useState(() => parseInt(localStorage.getItem('cupid_best') ?? '0'));

  // All game positions tracked via refs — never trigger React render per frame
  const itemsRef = useRef<FallingItem[]>([]);
  const scoreRef = useRef(0);
  const basketXRef = useRef(50);
  const phaseRef = useRef<'idle' | 'playing' | 'ended'>('idle');
  const lastTsRef = useRef<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const spawnRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const renderRef = useRef<HTMLDivElement>(null); // container for emoji divs

  // Caught popups (only updated when item is caught – low frequency)
  const [caught, setCaught] = useState<{ id: string; emoji: string; pts: number; x: number }[]>([]);

  const clearAll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  /** Imperatively update the DOM emoji elements — no React setState per frame */
  const flushDOM = useCallback(() => {
    const container = renderRef.current;
    if (!container) return;
    const items = itemsRef.current;

    // Build a map of existing divs by id
    const existing: Record<string, HTMLElement> = {};
    for (const el of Array.from(container.children) as HTMLElement[]) {
      existing[el.dataset.id!] = el;
    }
    const seen = new Set<string>();

    items.forEach(item => {
      seen.add(item.id);
      let el = existing[item.id];
      if (!el) {
        el = document.createElement('div');
        el.dataset.id = item.id;
        el.style.cssText = `
          position:absolute;pointer-events:none;user-select:none;
          font-size:1.7rem;transform:translate(-50%,-50%);
          filter:drop-shadow(0 2px 4px rgba(0,0,0,0.12));
          will-change:top;
        `;
        el.textContent = EMOJI_MAP[item.type];
        container.appendChild(el);
      }
      el.style.left = `${item.x}%`;
      el.style.top = `${item.y}%`;
    });

    // Remove stale
    for (const [id, el] of Object.entries(existing)) {
      if (!seen.has(id)) el.remove();
    }
  }, []);

  /** Also imperatively update basket position */
  const basketRef = useRef<HTMLDivElement>(null);
  const updateBasketDOM = useCallback(() => {
    if (basketRef.current) {
      basketRef.current.style.left = `${basketXRef.current}%`;
    }
  }, []);

  const startGame = useCallback(() => {
    clearAll();
    itemsRef.current = [];
    scoreRef.current = 0;
    basketXRef.current = 50;
    lastTsRef.current = 0;
    phaseRef.current = 'playing';
    setScore(0);
    setCaught([]);
    setTimeLeft(GAME_DURATION);
    setPhase('playing');

    // Spawn items every 750ms
    spawnRef.current = window.setInterval(() => {
      const types: FallingItem['type'][] = ['heart', 'heart', 'star', 'cupcake', 'bomb'];
      itemsRef.current.push({
        id: Math.random().toString(36).slice(2),
        x: Math.random() * 80 + 10,
        y: -5,
        type: types[Math.floor(Math.random() * types.length)],
        vy: 8 + Math.random() * 8, // %/sec
      });
    }, 750);

    // Countdown
    timerRef.current = window.setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearAll();
          phaseRef.current = 'ended';
          setPhase('ended');
          setBestScore(prev => {
            const next = Math.max(prev, scoreRef.current);
            localStorage.setItem('cupid_best', String(next));
            return next;
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    const BASKET_Y_PCT = 83;
    const CATCH_RADIUS_X = 9;  // percentage

    const tick = (ts: number) => {
      if (phaseRef.current !== 'playing') return;

      const dt = lastTsRef.current === 0 ? 0 : Math.min((ts - lastTsRef.current) / 1000, 0.1);
      lastTsRef.current = ts;

      const bx = basketXRef.current;
      let pts = scoreRef.current;
      const newCaught: { id: string; emoji: string; pts: number; x: number }[] = [];

      if (dt > 0) {
        itemsRef.current = itemsRef.current
          .map(item => ({ ...item, y: item.y + item.vy * dt }))
          .filter(item => {
            if (item.y > 100) return false;
            // Catch detection
            if (
              item.y >= BASKET_Y_PCT - 4 &&
              item.y <= BASKET_Y_PCT + 7 &&
              Math.abs(item.x - bx) < CATCH_RADIUS_X
            ) {
              const p = POINTS[item.type];
              pts = Math.max(0, pts + p);
              newCaught.push({ id: item.id, emoji: EMOJI_MAP[item.type], pts: p, x: item.x });
              return false;
            }
            return true;
          });

        scoreRef.current = pts;
        // Only update React state for score (low frequency via caught items)
        if (newCaught.length > 0) {
          setScore(pts);
          setCaught(prev => [...prev.slice(-6), ...newCaught]);
        }
      }

      flushDOM();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [clearAll, flushDOM]);

  useEffect(() => () => clearAll(), [clearAll]);

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    if (clientX == null) return;
    basketXRef.current = Math.max(7, Math.min(93, ((clientX - rect.left) / rect.width) * 100));
    updateBasketDOM();
  }, [updateBasketDOM]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phaseRef.current !== 'playing') return;
      const step = 3.5;
      if (e.key === 'ArrowLeft') { basketXRef.current = Math.max(7, basketXRef.current - step); updateBasketDOM(); }
      if (e.key === 'ArrowRight') { basketXRef.current = Math.min(93, basketXRef.current + step); updateBasketDOM(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [updateBasketDOM]);

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
              Dodge the <strong>💣 Bombs</strong> (−5)! Use <kbd style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '4px', padding: '1px 5px' }}>←</kbd> <kbd style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '4px', padding: '1px 5px' }}>→</kbd> or move your mouse/finger.
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

            {/* Game arena — pure DOM, no React re-render per frame */}
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
                  touchAction: 'none',
                }}
              >
                {/* Decorative stars */}
                {['8%', '25%', '50%', '72%', '88%'].map((l, i) => (
                  <div key={i} style={{ position: 'absolute', left: l, top: `${10 + i * 7}%`, fontSize: '0.65rem', opacity: 0.25, animation: `float ${2 + i}s ease-in-out infinite`, animationDelay: `${i * 0.4}s` }}>⭐</div>
                ))}

                {/* Imperatively rendered emoji items */}
                <div ref={renderRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

                {/* Score popups (low frequency React state) */}
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

                {/* Basket (imperatively moved) */}
                <div
                  ref={basketRef}
                  style={{
                    position: 'absolute', left: '50%', bottom: '10%',
                    transform: 'translateX(-50%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    pointerEvents: 'none', willChange: 'left',
                    transition: 'left 0.03s linear',
                  }}
                >
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
