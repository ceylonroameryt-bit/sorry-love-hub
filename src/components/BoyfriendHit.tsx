import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, Play, RefreshCw, Star } from 'lucide-react';

interface WhackState {
  phase: 'setup' | 'playing' | 'ended';
  bfRole: 'host' | 'guest' | null;
  gfRole: 'host' | 'guest' | null;
  bfHole: number | null;
  bonked: boolean;
  gfScore: number;
  bfScore: number;
  timeLeft: number;
}

const INIT: WhackState = {
  phase: 'setup', bfRole: null, gfRole: null,
  bfHole: null, bonked: false, gfScore: 0, bfScore: 0, timeLeft: 30,
};

export const BoyfriendHit: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame } = useGamePeer();
  const state: WhackState = gameState ?? INIT;

  const timerRef = useRef<number | null>(null);
  const dodgeRef = useRef<number | null>(null);
  const stateRef = useRef(state);

  useEffect(() => { stateRef.current = state; }, [state]);

  const isBF = (role === 'host' && state.bfRole === 'host') || (role === 'guest' && state.bfRole === 'guest');
  const isGF = !isBF && state.gfRole !== null;

  const pickRoles = (myRole: 'bf' | 'gf') => {
    const isHost = role === 'host';
    sendGameAction({
      ...INIT,
      bfRole: myRole === 'bf' ? (isHost ? 'host' : 'guest') : (isHost ? 'guest' : 'host'),
      gfRole: myRole === 'gf' ? (isHost ? 'host' : 'guest') : (isHost ? 'guest' : 'host'),
    });
  };

  const startGame = () => {
    sendGameAction({ ...stateRef.current, phase: 'playing', bfHole: null, bonked: false, gfScore: 0, bfScore: 0, timeLeft: 30 });
  };

  const popUp = (hole: number) => {
    if (!isBF || state.phase !== 'playing' || state.bonked) return;
    sendGameAction({ ...state, bfHole: hole, bonked: false });
  };

  const duck = () => {
    if (!isBF || state.phase !== 'playing') return;
    sendGameAction({ ...state, bfHole: null, bonked: false });
  };

  const whack = (hole: number) => {
    if (!isGF || state.phase !== 'playing' || state.bfHole !== hole || state.bonked) return;
    sendGameAction({ ...state, bonked: true, gfScore: state.gfScore + 1 });
    // Auto-duck after bonk
    setTimeout(() => {
      sendGameAction({ ...stateRef.current, bfHole: null, bonked: false });
    }, 700);
  };

  // Host manages timer + dodge points
  useEffect(() => {
    if (role !== 'host' || state.phase !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      if (dodgeRef.current) clearInterval(dodgeRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      const next = stateRef.current.timeLeft - 1;
      sendGameAction({ ...stateRef.current, timeLeft: next, bfHole: null, phase: next <= 0 ? 'ended' : 'playing' });
    }, 1000);

    dodgeRef.current = window.setInterval(() => {
      const s = stateRef.current;
      if (s.bfHole !== null && !s.bonked) {
        sendGameAction({ ...s, bfScore: s.bfScore + 1 });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (dodgeRef.current) clearInterval(dodgeRef.current);
    };
  }, [role, state.phase]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (dodgeRef.current) clearInterval(dodgeRef.current);
  }, []);

  return (
    <div className="container-cute" style={{ maxWidth: '760px' }}>
      <div className="card-cute" style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>Whack-a-BF 🔨</span>
        </div>

        {/* SETUP */}
        {state.phase === 'setup' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <h2 className="heading-lg" style={{ color: '#166534' }}>Whack-a-Boyfriend! 😂🔨</h2>
            <p style={{ color: '#6b7280', maxWidth: '480px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
              <strong>Boyfriend</strong> pops up from holes to tease. <strong>Girlfriend</strong> whacks him with a squeaky mallet! Who will win?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', maxWidth: '480px', margin: '0 auto' }}>
              <div
                onClick={() => pickRoles('bf')}
                style={{
                  background: '#fff', border: `2px solid ${isBF ? '#166534' : '#bbf7d0'}`,
                  borderRadius: '18px', padding: '1.5rem', cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.2s ease', boxShadow: isBF ? '0 4px 12px rgba(22,101,52,0.15)' : 'none',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏃‍♂️😜</div>
                <h3 className="font-cute" style={{ color: '#166534', margin: '0 0 0.4rem' }}>Play as Boyfriend</h3>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>Pop up & tease, then duck to survive!</p>
              </div>
              <div
                onClick={() => pickRoles('gf')}
                style={{
                  background: '#fff', border: `2px solid ${isGF ? '#166534' : '#bbf7d0'}`,
                  borderRadius: '18px', padding: '1.5rem', cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.2s ease', boxShadow: isGF ? '0 4px 12px rgba(22,101,52,0.15)' : 'none',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔨😈</div>
                <h3 className="font-cute" style={{ color: '#166534', margin: '0 0 0.4rem' }}>Play as Girlfriend</h3>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>Whack him every time he shows his face!</p>
              </div>
            </div>

            {state.bfRole && (
              <button onClick={startGame} className="btn-cute btn-cute-primary" style={{ marginTop: '2rem', background: 'linear-gradient(135deg,#16a34a,#22c55e)', padding: '0.9rem 2.5rem' }}>
                <Play size={18} /> Start Match!
              </button>
            )}
          </div>
        )}

        {/* PLAYING */}
        {state.phase === 'playing' && (
          <div>
            {/* Score bar */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', background: '#fff', borderRadius: '14px', padding: '0.8rem 1rem', border: '1px solid #dcfce7', marginBottom: '1.2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Girlfriend 🔨</div>
                <div className="font-cute" style={{ fontSize: '1.5rem', color: '#dc2626' }}>{state.gfScore} hits</div>
              </div>
              <div style={{ textAlign: 'center', background: '#f0fdf4', padding: '0.4rem 1.2rem', borderRadius: '50px' }}>
                <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 700 }}>TIMER</div>
                <div className="font-cute" style={{ fontSize: '1.4rem', color: '#166534' }}>{state.timeLeft}s</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Boyfriend 🏃‍♂️</div>
                <div className="font-cute" style={{ fontSize: '1.5rem', color: '#2563eb' }}>{state.bfScore} pts</div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '1rem', fontWeight: 600, color: '#374151' }}>
              {isBF
                ? '🏃‍♂️ Click a hole to pop up! Click DUCK to hide!'
                : '🔨 Click the hole when you see him pop up!'}
            </div>

            {/* Holes Grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.2rem',
              background: '#86efac', padding: '1.8rem', borderRadius: '20px',
              border: '3px solid #4ade80', maxWidth: '520px', margin: '0 auto',
              boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.1)',
            }}>
              {Array.from({ length: 6 }).map((_, idx) => {
                const hasBF = state.bfHole === idx;
                const bonked = hasBF && state.bonked;
                return (
                  <div
                    key={idx}
                    onClick={() => isGF && whack(idx)}
                    style={{
                      height: '100px',
                      background: '#3d1a00',
                      borderRadius: '50%',
                      border: '5px solid #4e2800',
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: isGF ? 'pointer' : 'default',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 8px 12px rgba(0,0,0,0.5)',
                      transition: 'transform 0.1s ease',
                    }}
                  >
                    {hasBF && (
                      <div style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2.8rem', animation: bonked ? 'wiggle 0.1s infinite' : 'pop-in 0.12s ease',
                        userSelect: 'none',
                      }}>
                        {bonked ? '🤕' : '😜'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* BF Controls */}
            {isBF && (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '1.2rem', marginTop: '1.5rem', border: '1px solid #dcfce7', maxWidth: '420px', margin: '1.5rem auto 0' }}>
                <h4 className="font-cute" style={{ color: '#166534', margin: '0 0 0.8rem', textAlign: 'center' }}>Your Controls</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '0.8rem' }}>
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => popUp(idx)}
                      disabled={state.bonked}
                      style={{
                        padding: '0.55rem', borderRadius: '8px', border: '1.5px solid #86efac',
                        background: state.bfHole === idx ? '#86efac' : '#fff',
                        color: '#166534', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                        fontFamily: 'var(--font-cute)',
                      }}
                    >
                      Hole {idx + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={duck}
                  className="btn-cute btn-cute-primary"
                  style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#dc2626,#ef4444)' }}
                >
                  🏃‍♂️ DUCK! (Hide Now)
                </button>
              </div>
            )}
          </div>
        )}

        {/* ENDED */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '2rem 0', animation: 'pop-in 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <Star fill="#fbbf24" color="#fbbf24" size={52} style={{ animation: 'float 3s ease infinite' }} />
            </div>
            <h3 className="font-cute" style={{ fontSize: '2rem', color: '#166534', margin: '0 0 0.5rem' }}>Match Over! 🏁</h3>

            <div style={{ fontSize: '1.1rem', color: '#374151', marginBottom: '1.5rem' }}>
              {state.gfScore > state.bfScore
                ? <><strong>Girlfriend wins!</strong> 🔨👑 {state.gfScore} bonks vs {state.bfScore} dodge pts</>
                : state.bfScore > state.gfScore
                ? <><strong>Boyfriend wins!</strong> 🏃‍♂️⚡ {state.bfScore} dodge pts vs {state.gfScore} bonks</>
                : <><strong>It's a Tie!</strong> 🤝 {state.gfScore} each!</>
              }
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => sendGameAction({ ...INIT })}
                className="btn-cute btn-cute-secondary"
              >
                <RefreshCw size={15} /> Change Roles
              </button>
              <button
                onClick={startGame}
                className="btn-cute btn-cute-primary"
                style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)' }}
              >
                Play Again!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
