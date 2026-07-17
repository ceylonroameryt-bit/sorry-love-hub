import React, { useState } from 'react';
import { ArrowLeft, Award } from 'lucide-react';

const ITEMS: { name: string; emoji: string; price: number }[] = [
  { name: 'Cup of coffee ☕', emoji: '☕', price: 4 },
  { name: 'Movie ticket 🎬', emoji: '🎬', price: 15 },
  { name: 'Pizza (large) 🍕', emoji: '🍕', price: 18 },
  { name: 'Gym membership/month 💪', emoji: '💪', price: 40 },
  { name: 'New novel 📖', emoji: '📖', price: 12 },
  { name: 'Airpods Pro 🎧', emoji: '🎧', price: 249 },
  { name: 'iPhone 15 Pro 📱', emoji: '📱', price: 1099 },
  { name: 'Nike Air Max 👟', emoji: '👟', price: 130 },
  { name: 'LEGO set (large) 🧱', emoji: '🧱', price: 200 },
  { name: 'Hot chocolate ☕', emoji: '🍫', price: 5 },
  { name: 'Bus day pass 🚌', emoji: '🚌', price: 6 },
  { name: 'Average rent/month 🏠 (UK)', emoji: '🏠', price: 1200 },
  { name: 'Pint of beer 🍺 (UK pub)', emoji: '🍺', price: 5 },
  { name: 'Sushi dinner for 2 🍣', emoji: '🍣', price: 80 },
  { name: 'Taylor Swift concert 🎤', emoji: '🎤', price: 250 },
  { name: 'New laptop 💻', emoji: '💻', price: 900 },
  { name: 'Car service 🚗', emoji: '🚗', price: 250 },
  { name: 'Weekly groceries 🛒 (UK avg)', emoji: '🛒', price: 60 },
  { name: 'Disney+ subscription/month', emoji: '🎭', price: 8 },
  { name: 'Flight to Paris ✈️ (UK)', emoji: '✈️', price: 120 },
  { name: 'Spotify Premium/month 🎵', emoji: '🎵', price: 11 },
  { name: 'Nintendo Switch 🎮', emoji: '🎮', price: 299 },
  { name: 'Bouquet of roses 🌹', emoji: '🌹', price: 35 },
  { name: 'Luxury watch ⌚', emoji: '⌚', price: 5000 },
  { name: 'Chocolate bar 🍫', emoji: '🍫', price: 2 },
];

function shuffle<T>(a: T[]) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

interface Props { onBack: () => void; }

export const OfflineGuessPrize: React.FC<Props> = ({ onBack }) => {
  const [items] = useState(() => shuffle(ITEMS));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'guessing' | 'revealed'>('guessing');
  const [guess, setGuess] = useState('');
  const [error, setError] = useState('');

  const current = items[idx];
  const guessNum = parseInt(guess.replace(/[^0-9]/g, ''), 10);

  const handleGuess = () => {
    if (isNaN(guessNum) || guessNum <= 0) { setError('Enter a valid price!'); return; }
    setError('');
    setPhase('revealed');
    const diff = Math.abs(guessNum - current.price);
    const pct = diff / current.price;
    const pts = pct <= 0.05 ? 100 : pct <= 0.15 ? 75 : pct <= 0.30 ? 50 : pct <= 0.50 ? 25 : 0;
    setScore(s => s + pts);
  };

  const next = () => {
    setIdx(i => i + 1);
    setGuess('');
    setError('');
    setPhase('guessing');
  };

  const done = idx >= items.length;
  const maxScore = items.length * 100;

  return (
    <div className="container-cute" style={{ maxWidth: '500px' }}>
      <div className="card-cute" style={{ background: '#faf5ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <span className="badge-cute">Guess the Price 💰</span>
          <span style={{ fontSize: '0.85rem', color: '#7c3aed', fontWeight: 700 }}>£{score}/{maxScore}</span>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <Award size={60} color="#7c3aed" style={{ margin: '0 auto 1rem', animation: 'float 3s ease infinite' }} />
            <h2 className="font-cute" style={{ fontSize: '2rem', color: '#4c1d95', marginBottom: '0.5rem' }}>All Done! 🎉</h2>
            <div style={{ fontSize: '1.1rem', color: '#374151', marginBottom: '2rem' }}>
              Final Score: <strong style={{ color: '#7c3aed', fontSize: '1.5rem' }}>{score}</strong> / {maxScore}<br />
              <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>{score >= 1500 ? '🌟 You\'re a price wizard!' : score >= 1000 ? '👍 Great intuition!' : '💸 Money is tricky!'}</span>
            </div>
            <button onClick={onBack} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' }}>Back to Games</button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.3rem' }}>Item {idx + 1} of {items.length}</div>
              <div style={{ height: '6px', background: '#ede9fe', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${((idx) / items.length) * 100}%`, background: 'linear-gradient(to right, #7c3aed, #a78bfa)', borderRadius: '99px', transition: 'width 0.4s' }} />
              </div>
            </div>

            <div style={{ textAlign: 'center', background: '#fff', border: '2px solid #ddd6fe', borderRadius: '24px', padding: '2.5rem 2rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '5rem', marginBottom: '0.8rem' }}>{current.emoji}</div>
              <h3 className="font-cute" style={{ fontSize: '1.4rem', color: '#4c1d95', margin: 0 }}>{current.name}</h3>
            </div>

            {phase === 'guessing' ? (
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: '#6b7280', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Your Price Guess (£):
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: error ? '0.3rem' : '1rem' }}>
                  <input type="number" value={guess} onChange={e => setGuess(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGuess()}
                    placeholder="e.g. 25"
                    className="input-cute"
                    style={{ flex: 1, fontSize: '1.2rem', textAlign: 'center', fontWeight: 700 }} />
                  <button onClick={handleGuess} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', padding: '0.6rem 1.2rem' }}>
                    Guess! 💰
                  </button>
                </div>
                {error && <div style={{ color: '#dc2626', fontSize: '0.82rem', marginBottom: '0.8rem' }}>{error}</div>}

                {/* Quick hint buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                  {[1, 5, 10, 25, 50, 100, 250, 500, 1000].map(v => (
                    <button key={v} onClick={() => setGuess(String(v))} className="btn-cute btn-cute-secondary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', color: '#7c3aed', borderColor: '#ddd6fe' }}>
                      £{v}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', animation: 'pop-in 0.3s ease' }}>
                <div style={{ background: '#f5f3ff', border: '2px solid #ddd6fe', borderRadius: '18px', padding: '1.2rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Actual Price</div>
                  <div className="font-cute" style={{ fontSize: '2rem', color: '#4c1d95' }}>£{current.price}</div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>Your guess: £{guessNum}</div>
                </div>
                {(() => {
                  const diff = Math.abs(guessNum - current.price);
                  const pct = diff / current.price;
                  const pts = pct <= 0.05 ? 100 : pct <= 0.15 ? 75 : pct <= 0.30 ? 50 : pct <= 0.50 ? 25 : 0;
                  return (
                    <div style={{ marginBottom: '1.2rem' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{pts === 100 ? '🎯 Perfect!' : pts >= 75 ? '🔥 Very close!' : pts >= 50 ? '👍 Not bad!' : pts > 0 ? '😅 Warm...' : '❌ Way off!'}</div>
                      <div style={{ color: '#7c3aed', fontWeight: 700 }}>+{pts} points</div>
                    </div>
                  );
                })()}
                {idx + 1 < items.length ? (
                  <button onClick={next} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' }}>Next Item ➡️</button>
                ) : (
                  <button onClick={next} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' }}>See Results 🏆</button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
