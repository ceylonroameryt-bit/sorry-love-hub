import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';

interface Bubble {
  id: number;
  val: number;
  x: number; // percentage
  y: number; // percentage
  popped: boolean;
}

function generateBubbles(count: number): Bubble[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    val: i + 1,
    x: Math.floor(Math.random() * 75) + 5,  // Avoid overflow boundaries
    y: Math.floor(Math.random() * 70) + 10,
    popped: false,
  })).sort(() => Math.random() - 0.5); // Random positions
}

interface Props { onBack: () => void; }

export const OfflineBubblePop: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [nextExpected, setNextExpected] = useState(1);
  const [time, setTime] = useState(0);
  const [bestTime, setBestTime] = useState(() => parseFloat(localStorage.getItem('bubble_best') || '9999'));

  const startGame = () => {
    setBubbles(generateBubbles(5));
    setNextExpected(1);
    setTime(0);
    setPhase('playing');
  };

  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = setInterval(() => setTime(t => +(t + 0.1).toFixed(1)), 100);
    return () => clearInterval(interval);
  }, [phase]);

  const handlePop = (b: Bubble) => {
    if (b.val !== nextExpected) {
      // Wrong bubble tapped: flash red/shake or add time penalty
      setTime(t => +(t + 2.0).toFixed(1));
      return;
    }

    // Pop the bubble
    setBubbles(prev =>
      prev.map(item => (item.id === b.id ? { ...item, popped: true } : item))
    );

    const nextVal = nextExpected + 1;
    if (nextVal > 5) {
      setPhase('ended');
      if (time < bestTime) {
        setBestTime(time);
        localStorage.setItem('bubble_best', String(time));
      }
    } else {
      setNextExpected(nextVal);
    }
  };

  return (
    <div className="container-cute" style={{ maxWidth: '500px' }}>
      <div className="card-cute" style={{ background: '#faf5ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <span className="badge-cute">Bubble Pop 🫧</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', background: '#fff', borderRadius: '14px', padding: '0.6rem', border: '1px solid #ede9fe', marginBottom: '1.2rem' }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.72rem', color: '#6b7280' }}>Time</div><div className="font-cute" style={{ fontSize: '1.3rem', color: '#7c3aed' }}>{time}s</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.72rem', color: '#6b7280' }}>Best</div><div className="font-cute" style={{ fontSize: '1.3rem', color: '#ec4899' }}>{bestTime === 9999 ? '—' : `${bestTime}s`}</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.72rem', color: '#6b7280' }}>Next Target</div><div className="font-cute" style={{ fontSize: '1.3rem', color: '#059669' }}>{nextExpected <= 5 ? nextExpected : 'Done'}</div></div>
        </div>

        {phase === 'idle' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '3rem', animation: 'float 2s ease infinite', marginBottom: '0.8rem' }}>🫧🎯</div>
            <h2 className="heading-lg">Bubble Pop!</h2>
            <p style={{ color: '#6b7280', margin: '0 0 1.5rem', fontSize: '0.9rem' }}>
              Pop the bubbles in order: <strong style={{ color: '#7c3aed' }}>1 → 2 → 3 → 4 → 5</strong> as fast as you can!
            </p>
            <button onClick={startGame} className="btn-cute btn-cute-primary">
              <Play size={14} /> Start Pop!
            </button>
          </div>
        )}

        {phase === 'playing' && (
          <div style={{
            height: '320px',
            border: '2px solid #ddd6fe',
            borderRadius: '16px',
            background: 'linear-gradient(to bottom, #fdf4ff, #fae8ff)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {bubbles.map(b => (
              <button
                key={b.id}
                onClick={() => handlePop(b)}
                style={{
                  position: 'absolute',
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  border: '2px solid #fff',
                  background: b.popped
                    ? 'transparent'
                    : 'radial-gradient(circle, #f472b6 0%, #ec4899 80%)',
                  boxShadow: b.popped
                    ? 'none'
                    : '0 8px 16px rgba(236,72,153,0.3), inset 0 -4px 8px rgba(0,0,0,0.15)',
                  color: '#fff',
                  fontFamily: 'var(--font-cute)',
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: b.popped ? 'scale(0)' : 'scale(1)',
                  opacity: b.popped ? 0 : 1,
                  transition: 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s',
                  pointerEvents: b.popped ? 'none' : 'auto',
                }}
              >
                {b.val}
              </button>
            ))}
          </div>
        )}

        {phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🫧👑</div>
            <h2 className="font-cute" style={{ color: '#7c3aed', fontSize: '2.2rem', margin: '0 0 0.5rem' }}>Splendid!</h2>
            <p style={{ color: '#6b7280', fontSize: '1rem', marginBottom: '1.5rem' }}>
              All bubbles popped in <strong style={{ color: '#ec4899', fontSize: '1.4rem' }}>{time}s</strong>!
            </p>
            {time <= bestTime && (
              <p style={{ color: '#d97706', fontWeight: 700, marginBottom: '1rem' }}>🎉 New Best Time Record!</p>
            )}
            <button onClick={startGame} className="btn-cute btn-cute-primary">
              <RotateCcw size={14} /> Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
