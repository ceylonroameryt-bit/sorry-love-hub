import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, RotateCcw, Check, X } from 'lucide-react';

const COLOR_NAMES = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'PINK'];
const COLOR_VALUES = ['#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#7c3aed', '#db2777'];

interface StroopCard {
  text: string;
  colorValue: string;
  colorName: string;
  isMatch: boolean;
}

function generateStroopCard(): StroopCard {
  const textIdx = Math.floor(Math.random() * COLOR_NAMES.length);
  const match = Math.random() > 0.5;
  let colorIdx = textIdx;

  if (!match) {
    while (colorIdx === textIdx) {
      colorIdx = Math.floor(Math.random() * COLOR_NAMES.length);
    }
  }

  return {
    text: COLOR_NAMES[textIdx],
    colorValue: COLOR_VALUES[colorIdx],
    colorName: COLOR_NAMES[colorIdx],
    isMatch: textIdx === colorIdx,
  };
}

const TIME_LIMIT = 20;
interface Props { onBack: () => void; }

export const OfflineColorMatch: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [card, setCard] = useState<StroopCard>(generateStroopCard);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem('stroop_best') || '0'));
  const timerRef = useRef<number | null>(null);

  const startGame = () => {
    setScore(0);
    setTimeLeft(TIME_LIMIT);
    setCard(generateStroopCard());
    setPhase('playing');
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

  const handleChoice = (choice: boolean) => {
    if (phase !== 'playing') return;
    if (choice === card.isMatch) {
      setScore(s => s + 1);
    } else {
      // Penalty: deduct 1 point or shake
      setScore(s => Math.max(0, s - 1));
    }
    setCard(generateStroopCard());
  };

  useEffect(() => {
    if (phase === 'ended') {
      if (score > best) {
        setBest(score);
        localStorage.setItem('stroop_best', String(score));
      }
    }
  }, [phase, score, best]);

  return (
    <div className="container-cute" style={{ maxWidth: '460px' }}>
      <div className="card-cute" style={{ background: '#faf5ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <span className="badge-cute">Stroop Match 🔴</span>
        </div>

        {phase === 'idle' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '3rem', animation: 'float 2s ease infinite', marginBottom: '0.8rem' }}>🟢🔴</div>
            <h2 className="heading-lg">Stroop Test!</h2>
            <p style={{ color: '#6b7280', margin: '0 0 0.5rem', fontSize: '0.9rem' }}>
              Does the written word match the ink color?
            </p>
            <p style={{ color: '#6b7280', margin: '0 0 1.5rem', fontSize: '0.85rem', lineHeight: 1.4 }}>
              Example: if <strong style={{ color: '#2563eb' }}>RED</strong> is printed in blue, tap <strong style={{ color: '#dc2626' }}>NO</strong>!
            </p>
            <p style={{ color: '#a78bfa', fontWeight: 600, marginBottom: '1.5rem', fontSize: '0.85rem' }}>Best Score: {best} 🏆</p>
            <button onClick={startGame} className="btn-cute btn-cute-primary">
              <Play size={14} /> Start Game
            </button>
          </div>
        )}

        {phase === 'playing' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', background: '#fff', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #ede9fe' }}>
              <span style={{ fontWeight: 700, color: '#7c3aed' }}>Score: {score}</span>
              <span style={{ fontWeight: 700, color: timeLeft <= 5 ? '#dc2626' : '#6b7280' }}>Time: {timeLeft}s ⏱️</span>
            </div>

            <div style={{
              background: '#fff',
              border: '2px solid #ddd6fe',
              borderRadius: '20px',
              height: '180px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.02)',
            }}>
              <span className="font-cute" style={{
                fontSize: '3.5rem',
                color: card.colorValue,
                letterSpacing: '2px',
              }}>
                {card.text}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => handleChoice(true)}
                className="btn-cute btn-cute-primary"
                style={{ flex: 1, justifyContent: 'center', padding: '1rem 0', background: '#10b981', borderColor: '#10b981', fontSize: '1.2rem' }}
              >
                <Check size={20} /> YES (Match)
              </button>
              <button
                onClick={() => handleChoice(false)}
                className="btn-cute btn-cute-secondary"
                style={{ flex: 1, justifyContent: 'center', padding: '1rem 0', color: '#dc2626', borderColor: '#fecaca', fontSize: '1.2rem' }}
              >
                <X size={20} /> NO (Mismatch)
              </button>
            </div>
          </div>
        )}

        {phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🧠🏆</div>
            <h2 className="font-cute" style={{ color: '#7c3aed', fontSize: '2.2rem', margin: '0 0 0.5rem' }}>Test Finished!</h2>
            <p style={{ color: '#6b7280', fontSize: '1rem', marginBottom: '1.5rem' }}>
              Your Stroop score is <strong style={{ color: '#7c3aed', fontSize: '1.4rem' }}>{score}</strong>
            </p>
            {score >= best && score > 0 && (
              <p style={{ color: '#d97706', fontWeight: 700, marginBottom: '1rem' }}>🌟 New Stroop High Score!</p>
            )}
            <button onClick={startGame} className="btn-cute btn-cute-primary">
              <RotateCcw size={14} /> Restart Test
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
