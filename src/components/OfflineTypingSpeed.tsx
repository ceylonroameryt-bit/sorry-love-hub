import React, { useState, useRef, useCallback } from 'react';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';

const QUOTES = [
  "You are my sunshine my only sunshine",
  "Every love story is beautiful but ours is my favourite",
  "I love you to the moon and back",
  "You make my heart smile every single day",
  "Together is my favourite place to be",
  "In a world full of people I choose you",
  "You are the best thing that ever happened to me",
  "Distance means so little when someone means so much",
  "My heart is and always will be yours forever",
  "Every moment with you is a moment I treasure",
  "You are my today and all of my tomorrows",
  "I fell in love with the way you fall in love",
  "You are the reason I believe in love",
  "Being deeply loved by someone gives you strength",
  "The best thing to hold onto in life is each other",
];

type Phase = 'idle' | 'countdown' | 'typing' | 'done';

interface Props { onBack: () => void; }
export const OfflineTypingSpeed: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [quote, setQuote] = useState('');
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [bestWpm, setBestWpm] = useState(() => parseInt(localStorage.getItem('typing_best') || '0'));
  const [countdown, setCountdown] = useState(3);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickQuote = useCallback(() => {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)].toUpperCase();
  }, []);

  const startGame = useCallback(() => {
    const q = pickQuote();
    setQuote(q);
    setTyped('');
    setWpm(0);
    setCountdown(3);
    setPhase('countdown');
    let c = 3;
    const tick = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(tick);
        setStartTime(Date.now());
        setPhase('typing');
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }, 1000);
  }, [pickQuote]);

  const handleType = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setTyped(val);
    if (val === quote) {
      const elapsed = (Date.now() - startTime) / 60000;
      const words = quote.split(' ').length;
      const calcWpm = Math.round(words / elapsed);
      const correct = val.split('').filter((ch, i) => ch === quote[i]).length;
      const calcAccuracy = Math.round((correct / quote.length) * 100);
      setWpm(calcWpm);
      setAccuracy(calcAccuracy);
      setPhase('done');
      setBestWpm(prev => { const n = Math.max(prev, calcWpm); localStorage.setItem('typing_best', String(n)); return n; });
    }
  };

  // colour each typed character
  const renderQuote = () => (
    <div style={{ fontFamily: 'monospace', fontSize: '1.05rem', lineHeight: 2, letterSpacing: '0.05em', wordBreak: 'break-word' }}>
      {quote.split('').map((ch, i) => {
        let color = '#c4b5fd';
        if (i < typed.length) color = typed[i] === ch ? '#059669' : '#dc2626';
        const isCursor = i === typed.length;
        return (
          <span key={i} style={{ color, position: 'relative', borderBottom: isCursor ? '2px solid #7c3aed' : 'none', fontWeight: i < typed.length ? 700 : 400 }}>{ch}</span>
        );
      })}
    </div>
  );

  return (
    <div className="container-cute" style={{ maxWidth: '600px' }}>
      <div className="card-cute" style={{ background: '#faf5ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}><ArrowLeft size={14} /> Back</button>
          <span className="badge-cute">Typing Speed ⌨️</span>
        </div>

        {phase === 'idle' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '3rem', animation: 'float 2s ease infinite', marginBottom: '0.8rem' }}>⌨️💕</div>
            <h2 className="heading-lg">Typing Challenge!</h2>
            <p style={{ color: '#6b7280', margin: '0 0 0.5rem', fontSize: '0.9rem' }}>Type the love quote as fast as you can!</p>
            <p style={{ color: '#a78bfa', fontWeight: 600, marginBottom: '1.5rem', fontSize: '0.85rem' }}>Best: {bestWpm} WPM 🏆</p>
            <button onClick={startGame} className="btn-cute btn-cute-primary"><Play size={14} /> Start Typing!</button>
          </div>
        )}

        {phase === 'countdown' && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div className="font-cute" style={{ fontSize: '6rem', color: '#7c3aed', animation: 'pop-in 0.5s ease' }}>{countdown}</div>
            <p style={{ color: '#6b7280' }}>Get ready...</p>
          </div>
        )}

        {phase === 'typing' && (
          <div>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '1.2rem 1.5rem', border: '1.5px solid #ddd6fe', marginBottom: '1rem', minHeight: '80px' }}>
              {renderQuote()}
            </div>
            <input
              ref={inputRef}
              value={typed}
              onChange={handleType}
              placeholder="Start typing..."
              className="input-cute"
              style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '0.05em' }}
              autoComplete="off" autoCorrect="off" spellCheck={false}
            />
            <p style={{ color: '#a78bfa', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.5rem' }}>
              {typed.length}/{quote.length} characters
            </p>
          </div>
        )}

        {phase === 'done' && (
          <div style={{ textAlign: 'center', animation: 'pop-in 0.4s ease' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
            <h2 className="font-cute" style={{ color: '#7c3aed', fontSize: '2rem', margin: '0 0 1rem' }}>Done!</h2>
            <div style={{ display: 'flex', justifyContent: 'space-around', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', background: '#f5f3ff', borderRadius: '16px', padding: '1rem 1.5rem', border: '1px solid #ddd6fe' }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Speed ⚡</div>
                <div className="font-cute" style={{ fontSize: '2rem', color: '#7c3aed' }}>{wpm}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>WPM</div>
              </div>
              <div style={{ textAlign: 'center', background: '#f0fdf4', borderRadius: '16px', padding: '1rem 1.5rem', border: '1px solid #86efac' }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Accuracy ✅</div>
                <div className="font-cute" style={{ fontSize: '2rem', color: '#059669' }}>{accuracy}%</div>
              </div>
              <div style={{ textAlign: 'center', background: '#fffbeb', borderRadius: '16px', padding: '1rem 1.5rem', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Best 🏆</div>
                <div className="font-cute" style={{ fontSize: '2rem', color: '#d97706' }}>{bestWpm}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>WPM</div>
              </div>
            </div>
            {wpm >= bestWpm && wpm > 0 && <p style={{ color: '#d97706', fontWeight: 700 }}>🌟 New Personal Best!</p>}
            <button onClick={startGame} className="btn-cute btn-cute-primary"><RotateCcw size={14} /> Try Again</button>
          </div>
        )}
      </div>
    </div>
  );
};
