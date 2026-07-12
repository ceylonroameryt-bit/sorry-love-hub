import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Play, RefreshCw, Trophy } from 'lucide-react';

const HOLES = 6;
const GAME_DURATION = 30;

interface HoleState {
  active: boolean;
  bonked: boolean;
}

interface Props { onBack: () => void; }

export const OfflineBoyfriendBonk: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [holes, setHoles] = useState<HoleState[]>(Array.from({ length: HOLES }, () => ({ active: false, bonked: false })));
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [bestScore, setBestScore] = useState(() => parseInt(localStorage.getItem('bonk_best') ?? '0'));

  const timerRef = useRef<number | null>(null);
  const moleTimersRef = useRef<number[]>([]);
  const scoreRef = useRef(0);

  const clearAll = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    moleTimersRef.current.forEach(clearTimeout);
    moleTimersRef.current = [];
  };

  const scheduleMole = useCallback(() => {
    const delay = 600 + Math.random() * 900;
    const id = window.setTimeout(() => {
      const hole = Math.floor(Math.random() * HOLES);
      setHoles(prev => {
        if (prev[hole].active) return prev;
        const next = [...prev];
        next[hole] = { active: true, bonked: false };
        return next;
      });
      // Auto-retract after 1.2–2s
      const retractId = window.setTimeout(() => {
        setHoles(prev => {
          const next = [...prev];
          if (!next[hole].bonked) next[hole] = { active: false, bonked: false };
          return next;
        });
        // Schedule next mole if still playing
        setPhase(p => { if (p === 'playing') scheduleMole(); return p; });
      }, 1200 + Math.random() * 800);
      moleTimersRef.current.push(retractId);
    }, delay);
    moleTimersRef.current.push(id);
  }, []);

  const startGame = useCallback(() => {
    clearAll();
    scoreRef.current = 0;
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setHoles(Array.from({ length: HOLES }, () => ({ active: false, bonked: false })));
    setPhase('playing');

    timerRef.current = window.setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearAll();
          setPhase('ended');
          setBestScore(prev => {
            const next = Math.max(prev, scoreRef.current);
            localStorage.setItem('bonk_best', String(next));
            return next;
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    // Spawn multiple moles concurrently
    for (let i = 0; i < 3; i++) scheduleMole();
  }, [scheduleMole]);

  useEffect(() => () => clearAll(), []);

  const bonk = useCallback((holeIdx: number) => {
    setHoles(prev => {
      if (!prev[holeIdx].active || prev[holeIdx].bonked) return prev;
      const next = [...prev];
      next[holeIdx] = { active: true, bonked: true };
      scoreRef.current += 1;
      setScore(s => s + 1);
      // Hide after brief bonk
      const id = window.setTimeout(() => {
        setHoles(p => {
          const n = [...p];
          n[holeIdx] = { active: false, bonked: false };
          return n;
        });
        scheduleMole();
      }, 500);
      moleTimersRef.current.push(id);
      return next;
    });
  }, [scheduleMole]);

  const timerPct = (timeLeft / GAME_DURATION) * 100;
  const timerColor = timerPct > 50 ? '#059669' : timerPct > 25 ? '#d97706' : '#dc2626';

  return (
    <div className="container-cute" style={{ maxWidth: '720px' }}>
      <div className="card-cute" style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>Whack-a-BF 🔨</span>
        </div>

        {/* IDLE */}
        {phase === 'idle' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'float 2s ease infinite' }}>🔨😜</div>
            <h2 className="heading-lg" style={{ color: '#166534' }}>Whack-a-Boyfriend! 😂</h2>
            <p style={{ color: '#6b7280', maxWidth: '440px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              The boyfriend keeps popping up from holes to tease you! Bonk him every time he appears. You have <strong>30 seconds</strong>. Go!
            </p>
            {bestScore > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef9c3', border: '1px solid #fde68a', borderRadius: '50px', padding: '0.4rem 1.1rem', marginBottom: '1.5rem', color: '#92400e', fontWeight: 700 }}>
                <Trophy size={16} /> Best Score: {bestScore} bonks
              </div>
            )}
            <br />
            <button onClick={startGame} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)', padding: '0.9rem 2.5rem', fontSize: '1.1rem' }}>
              <Play size={18} /> Start!
            </button>
          </div>
        )}

        {/* PLAYING & ENDED */}
        {(phase === 'playing' || phase === 'ended') && (
          <div>
            {/* Score bar */}
            <div style={{ display: 'flex', justifyContent: 'space-around', background: '#fff', borderRadius: '14px', padding: '0.8rem 1rem', border: '1px solid #dcfce7', marginBottom: '1.2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Score 🔨</div>
                <div className="font-cute" style={{ fontSize: '1.6rem', color: '#166534' }}>{score}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Time Left ⏱️</div>
                <div className="font-cute" style={{ fontSize: '1.6rem', color: timerColor }}>{timeLeft}s</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Best 🏆</div>
                <div className="font-cute" style={{ fontSize: '1.6rem', color: '#d97706' }}>{bestScore}</div>
              </div>
            </div>

            {/* Timer Bar */}
            <div style={{ height: '8px', background: '#dcfce7', borderRadius: '99px', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div style={{ height: '100%', width: `${timerPct}%`, background: timerColor, borderRadius: '99px', transition: 'width 1s linear, background 0.5s' }} />
            </div>

            {/* Holes Grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.2rem',
              background: '#86efac', padding: '1.8rem', borderRadius: '20px',
              border: '3px solid #4ade80', maxWidth: '480px', margin: '0 auto',
              boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.1)',
            }}>
              {holes.map((h, idx) => (
                <div
                  key={idx}
                  onClick={() => phase === 'playing' && bonk(idx)}
                  style={{
                    height: '110px', background: '#3d1a00', borderRadius: '50%',
                    border: '5px solid #4e2800', position: 'relative', overflow: 'hidden',
                    cursor: phase === 'playing' && h.active && !h.bonked ? 'pointer' : 'default',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 8px 12px rgba(0,0,0,0.5)',
                    transition: 'transform 0.1s ease',
                  }}
                >
                  {h.active && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '3rem',
                      animation: h.bonked ? 'wiggle 0.1s infinite' : 'pop-in 0.12s ease',
                      userSelect: 'none',
                    }}>
                      {h.bonked ? '🤕' : '😜'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ENDED overlay */}
            {phase === 'ended' && (
              <div style={{ textAlign: 'center', marginTop: '2rem', animation: 'pop-in 0.4s ease' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏁</div>
                <h3 className="font-cute" style={{ color: '#166534', fontSize: '2rem', margin: '0 0 0.5rem' }}>Time's Up!</h3>
                <p style={{ color: '#374151', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  You bonked <strong style={{ color: '#166534' }}>{score}</strong> times!
                  {score === bestScore && score > 0 && <span style={{ color: '#f59e0b', fontWeight: 700 }}> 🏆 New Best!</span>}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                  <button onClick={startGame} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)' }}>
                    <RefreshCw size={15} /> Play Again
                  </button>
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
