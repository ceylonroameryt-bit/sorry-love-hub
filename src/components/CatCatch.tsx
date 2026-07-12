import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, Play, Award, Sparkles } from 'lucide-react';

interface FallingItem {
  id: string;
  x: number; // 0-100%
  y: number; // 0-100%
  type: 'cat' | 'heart' | 'yarn';
  speed: number;
}

interface CatState {
  phase: 'lobby' | 'playing' | 'ended';
  items: FallingItem[];
  hostX: number;
  guestX: number;
  hostScore: number;
  guestScore: number;
  timeLeft: number;
}

const INIT: CatState = { phase: 'lobby', items: [], hostX: 50, guestX: 50, hostScore: 0, guestScore: 0, timeLeft: 45 };
const EMOJI: Record<string, string> = { cat: '🐱', heart: '💜', yarn: '🧶' };

export const CatCatch: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName, playerName } = useGamePeer();
  const state: CatState = gameState ?? INIT;

  const containerRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<number | null>(null);
  const spawnRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const stateRef = useRef(state);
  const localXRef = useRef(50);
  const oppXRef = useRef(50);

  useEffect(() => {
    stateRef.current = state;
    oppXRef.current = role === 'host' ? state.guestX : state.hostX;
  }, [state, role]);

  const handleMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (state.phase !== 'playing' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    if (!clientX) return;
    const x = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    localXRef.current = x;
    if (role === 'guest') {
      sendGameAction({ ...stateRef.current, guestX: x });
    }
  };

  const startGame = () => {
    if (role !== 'host') return;
    sendGameAction({ ...INIT, phase: 'playing' });
  };

  // Host runs all physics
  useEffect(() => {
    if (role !== 'host' || state.phase !== 'playing') {
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
      if (spawnRef.current) clearInterval(spawnRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    spawnRef.current = window.setInterval(() => {
      const types: ('cat' | 'heart' | 'yarn')[] = ['cat', 'cat', 'heart', 'yarn'];
      const newItem: FallingItem = {
        id: Math.random().toString(36).slice(2),
        x: Math.random() * 80 + 10,
        y: 0,
        type: types[Math.floor(Math.random() * types.length)],
        speed: Math.random() * 1.2 + 0.7,
      };
      sendGameAction({ ...stateRef.current, items: [...stateRef.current.items, newItem] });
    }, 900);

    timerRef.current = window.setInterval(() => {
      const next = stateRef.current.timeLeft - 1;
      sendGameAction({ ...stateRef.current, timeLeft: next, phase: next <= 0 ? 'ended' : 'playing' });
    }, 1000);

    const tick = () => {
      const s = stateRef.current;
      if (s.phase !== 'playing') return;
      const BASKET_Y = 82;
      const RADIUS = 8;
      let hScore = s.hostScore, gScore = s.guestScore;
      const remaining = s.items.map(item => ({ ...item, y: item.y + item.speed * 1.4 }))
        .filter(item => {
          if (item.y > 92) return false;
          if (item.y >= BASKET_Y - 3 && item.y <= BASKET_Y + 4) {
            const pts = item.type === 'heart' ? 2 : 1;
            if (Math.abs(item.x - localXRef.current) < RADIUS) { hScore += pts; return false; }
            if (Math.abs(item.x - oppXRef.current) < RADIUS) { gScore += pts; return false; }
          }
          return true;
        });
      sendGameAction({ ...s, items: remaining, hostX: localXRef.current, hostScore: hScore, guestScore: gScore });
      loopRef.current = requestAnimationFrame(tick);
    };
    loopRef.current = requestAnimationFrame(tick);

    return () => {
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
      if (spawnRef.current) clearInterval(spawnRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [role, state.phase]);

  const myScore = role === 'host' ? state.hostScore : state.guestScore;
  const theirScore = role === 'host' ? state.guestScore : state.hostScore;

  return (
    <div className="container-cute" style={{ maxWidth: '820px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Cat Catching 🐱</span>
        </div>

        {/* LOBBY */}
        {state.phase === 'lobby' && (
          <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'float 2s ease-in-out infinite' }}>🐱🧺</div>
            <h2 className="heading-lg">Catch Cats Together!</h2>
            <p style={{ color: '#6b7280', maxWidth: '480px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
              Move your basket left and right to catch falling kittens, hearts 💜, and yarn balls 🧶. Work together for the highest score!
            </p>
            {role === 'host' ? (
              <button onClick={startGame} className="btn-cute btn-cute-primary" style={{ padding: '0.9rem 2.5rem' }}>
                <Play size={18} /> Start Catching!
              </button>
            ) : (
              <div className="badge-cute" style={{ padding: '0.7rem 1.5rem' }}>
                Waiting for {opponentName} to start... 😸
              </div>
            )}
          </div>
        )}

        {/* SCORE BAR (Playing & Ended) */}
        {state.phase !== 'lobby' && (
          <div style={{
            display: 'flex', justifyContent: 'space-around', alignItems: 'center',
            background: '#fff', borderRadius: '14px', padding: '0.8rem 1rem',
            border: '1px solid #ede9fe', marginBottom: '1rem',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Your Basket 🧺</div>
              <div className="font-cute" style={{ fontSize: '1.5rem', color: '#7c3aed' }}>{myScore} pts</div>
            </div>
            <div style={{ textAlign: 'center', background: '#f5f3ff', padding: '0.4rem 1.2rem', borderRadius: '50px' }}>
              <div style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 700 }}>TIME</div>
              <div className="font-cute" style={{ fontSize: '1.4rem', color: '#4c1d95' }}>{state.timeLeft}s</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{opponentName}'s Basket 🧺</div>
              <div className="font-cute" style={{ fontSize: '1.5rem', color: '#8b5cf6' }}>{theirScore} pts</div>
            </div>
          </div>
        )}

        {/* GAME ARENA */}
        {state.phase === 'playing' && (
          <div
            ref={containerRef}
            onMouseMove={handleMove}
            onTouchMove={handleMove}
            style={{
              height: '380px',
              width: '100%',
              background: 'linear-gradient(180deg, #f5f3ff 0%, #ede9fe 100%)',
              borderRadius: '18px',
              border: '2px dashed #c4b5fd',
              position: 'relative',
              overflow: 'hidden',
              userSelect: 'none',
              cursor: 'none',
            }}
          >
            {/* Stars / decoration */}
            {['10%', '30%', '55%', '75%', '90%'].map((l, i) => (
              <div key={i} style={{ position: 'absolute', left: l, top: `${15 + i * 8}%`, fontSize: '0.7rem', opacity: 0.3, animation: `float ${2 + i}s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }}>⭐</div>
            ))}

            {/* Falling items */}
            {state.items.map(item => (
              <div key={item.id} style={{
                position: 'absolute',
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: 'translate(-50%,-50%)',
                fontSize: '1.8rem',
                pointerEvents: 'none',
                userSelect: 'none',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
              }}>
                {EMOJI[item.type]}
              </div>
            ))}

            {/* My basket */}
            <div style={{
              position: 'absolute',
              left: `${role === 'host' ? localXRef.current : state.guestX}%`,
              bottom: '10%',
              transform: 'translateX(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              pointerEvents: 'none',
            }}>
              <span style={{ fontSize: '0.7rem', background: '#7c3aed', color: '#fff', padding: '1px 6px', borderRadius: '4px', marginBottom: '1px' }}>Me</span>
              <span style={{ fontSize: '2.4rem' }}>🧺</span>
            </div>

            {/* Partner basket */}
            <div style={{
              position: 'absolute',
              left: `${role === 'guest' ? localXRef.current : state.hostX}%`,
              bottom: '10%',
              transform: 'translateX(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              pointerEvents: 'none',
              transition: 'left 0.08s linear',
            }}>
              <span style={{ fontSize: '0.7rem', background: '#8b5cf6', color: '#fff', padding: '1px 6px', borderRadius: '4px', marginBottom: '1px' }}>{opponentName || 'Partner'}</span>
              <span style={{ fontSize: '2.4rem' }}>🧺</span>
            </div>

            <div style={{ position: 'absolute', bottom: '2%', width: '100%', textAlign: 'center', fontSize: '0.75rem', color: '#a78bfa', pointerEvents: 'none' }}>
              Move mouse/finger to control basket
            </div>
          </div>
        )}

        {/* ENDED */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '2rem 0', animation: 'pop-in 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <Award size={56} color="#7c3aed" style={{ animation: 'float 3s ease infinite' }} />
            </div>
            <h3 className="font-cute" style={{ color: '#4c1d95', fontSize: '2rem', margin: '0 0 0.5rem' }}>Time's Up! 🏁</h3>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', margin: '1.5rem 0', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{playerName}</div>
                <div className="font-cute" style={{ fontSize: '1.8rem', color: '#7c3aed' }}>{myScore}</div>
              </div>
              <div style={{ borderLeft: '2px solid #ddd6fe' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{opponentName}</div>
                <div className="font-cute" style={{ fontSize: '1.8rem', color: '#8b5cf6' }}>{theirScore}</div>
              </div>
            </div>

            <div style={{ background: '#f5f3ff', borderRadius: '14px', padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>TEAM TOTAL</div>
              <div className="font-cute" style={{ fontSize: '2.2rem', color: '#4c1d95' }}>{myScore + theirScore} caught! 🎉</div>
              <div style={{ fontSize: '0.85rem', color: '#8b5cf6', marginTop: '4px' }}>
                {myScore + theirScore > 25 ? 'Expert cat rescuers! 🐈💜' : 'Great teamwork! 🥰'}
              </div>
            </div>

            {role === 'host' ? (
              <button onClick={startGame} className="btn-cute btn-cute-primary">
                <Sparkles size={16} /> Play Again!
              </button>
            ) : (
              <span className="badge-cute">Waiting for host to start again...</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
