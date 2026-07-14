import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';

interface Question {
  text: string;
  answer: number;
  options: number[];
}

function generateQuestion(): Question {
  const ops = ['+', '-', '*'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = 0, b = 0, ans = 0;

  if (op === '+') {
    a = Math.floor(Math.random() * 89) + 10;
    b = Math.floor(Math.random() * 89) + 10;
    ans = a + b;
  } else if (op === '-') {
    a = Math.floor(Math.random() * 89) + 10;
    b = Math.floor(Math.random() * (a - 9)) + 10; // Positive result
    ans = a - b;
  } else {
    a = Math.floor(Math.random() * 11) + 2;
    b = Math.floor(Math.random() * 11) + 2;
    ans = a * b;
  }

  // Generate 4 unique options
  const opts = new Set<number>([ans]);
  while (opts.size < 4) {
    const dev = Math.floor(Math.random() * 15) - 7;
    const optVal = ans + dev;
    if (optVal > 0) opts.add(optVal);
  }

  return {
    text: `${a} ${op} ${b} = ?`,
    answer: ans,
    options: Array.from(opts).sort(() => Math.random() - 0.5),
  };
}

const DURATION = 30;
interface Props { onBack: () => void; }

export const OfflineQuickMath: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [curr, setCurr] = useState<Question>(generateQuestion);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem('math_best') || '0'));
  const timerRef = useRef<number | null>(null);

  const startNewGame = useCallback(() => {
    setScore(0);
    setTimeLeft(DURATION);
    setCurr(generateQuestion());
    setPhase('playing');
  }, []);

  const handleAnswer = (val: number) => {
    if (phase !== 'playing') return;
    if (val === curr.answer) {
      setScore(s => s + 1);
    } else {
      // Small time penalty for wrong answers to make it challenging
      setTimeLeft(t => Math.max(0, t - 3));
    }
    setCurr(generateQuestion());
  };

  useEffect(() => {
    if (phase !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setPhase('ended');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === 'ended') {
      if (score > best) {
        setBest(score);
        localStorage.setItem('math_best', String(score));
      }
    }
  }, [phase, score, best]);

  return (
    <div className="container-cute" style={{ maxWidth: '480px' }}>
      <div className="card-cute" style={{ background: '#faf5ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <span className="badge-cute">Quick Math ⚡</span>
        </div>

        {phase === 'idle' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '3rem', animation: 'float 2s ease infinite', marginBottom: '0.8rem' }}>🔢⚡</div>
            <h2 className="heading-lg">Quick Math!</h2>
            <p style={{ color: '#6b7280', margin: '0 0 0.5rem', fontSize: '0.9rem' }}>Solve as many questions as you can in 30 seconds!</p>
            <p style={{ color: '#a78bfa', fontWeight: 600, marginBottom: '1.5rem', fontSize: '0.85rem' }}>Best Score: {best} 🏆</p>
            <button onClick={startNewGame} className="btn-cute btn-cute-primary">
              <Play size={14} /> Start Solve
            </button>
          </div>
        )}

        {phase === 'playing' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', background: '#fff', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #ede9fe' }}>
              <span style={{ fontWeight: 700, color: '#7c3aed' }}>Score: {score}</span>
              <span style={{ fontWeight: 700, color: timeLeft <= 5 ? '#dc2626' : '#6b7280' }}>Time: {timeLeft}s ⏱️</span>
            </div>

            <div className="font-cute" style={{ fontSize: '2.5rem', color: '#4c1d95', margin: '1.5rem 0' }}>
              {curr.text}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {curr.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  className="btn-cute btn-cute-secondary"
                  style={{ justifyContent: 'center', fontSize: '1.2rem', padding: '1rem', fontWeight: 700 }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
            <h2 className="font-cute" style={{ color: '#7c3aed', fontSize: '2rem', margin: '0 0 0.5rem' }}>Time's Up!</h2>
            <p style={{ color: '#6b7280', fontSize: '1rem', marginBottom: '1.5rem' }}>
              You solved <strong style={{ color: '#7c3aed', fontSize: '1.4rem' }}>{score}</strong> equations!
            </p>
            {score >= best && score > 0 && (
              <p style={{ color: '#d97706', fontWeight: 700, marginBottom: '1rem' }}>🌟 New Personal Best!</p>
            )}
            <button onClick={startNewGame} className="btn-cute btn-cute-primary">
              <RotateCcw size={14} /> Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
