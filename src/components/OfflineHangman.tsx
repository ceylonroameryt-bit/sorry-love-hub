import React, { useState, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Heart } from 'lucide-react';

const WORD_POOL: { word: string; category: string }[] = [
  { word: 'FOREVER', category: '💜 Love' }, { word: 'SOULMATE', category: '💜 Love' },
  { word: 'CHERISH', category: '💜 Love' }, { word: 'DEVOTION', category: '💜 Love' },
  { word: 'EMBRACE', category: '💜 Love' }, { word: 'ROMANCE', category: '💜 Love' },
  { word: 'PROMISE', category: '💜 Love' }, { word: 'DARLING', category: '💜 Love' },
  { word: 'MAGICAL', category: '💜 Love' }, { word: 'HARMONY', category: '💜 Love' },
  { word: 'KITTEN', category: '🐾 Animals' }, { word: 'PENGUIN', category: '🐾 Animals' },
  { word: 'HAMSTER', category: '🐾 Animals' }, { word: 'CAPYBARA', category: '🐾 Animals' },
  { word: 'PLATYPUS', category: '🐾 Animals' }, { word: 'FLAMINGO', category: '🐾 Animals' },
  { word: 'NARWHAL', category: '🐾 Animals' }, { word: 'HEDGEHOG', category: '🐾 Animals' },
  { word: 'CUPCAKE', category: '🍰 Treats' }, { word: 'BROWNIE', category: '🍰 Treats' },
  { word: 'MACAROON', category: '🍰 Treats' }, { word: 'CHURROS', category: '🍰 Treats' },
  { word: 'MOCHI', category: '🍰 Treats' }, { word: 'SUNDAE', category: '🍰 Treats' },
  { word: 'BUTTERFLY', category: '🌸 Nature' }, { word: 'BLOSSOM', category: '🌸 Nature' },
  { word: 'RAINBOW', category: '🌸 Nature' }, { word: 'MOONLIGHT', category: '🌸 Nature' },
  { word: 'STARDUST', category: '🌸 Nature' }, { word: 'SUNSHINE', category: '🌸 Nature' },
];

const MAX_WRONG = 6;
const HANGMAN_PARTS = ['😇', '😮', '😟', '😱', '😰', '😵', '💀'];

function pickWord() {
  return WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)];
}

interface Props { onBack: () => void; }

export const OfflineHangman: React.FC<Props> = ({ onBack }) => {
  const [{ word, category }, setWordData] = useState(pickWord);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);

  const wrong = [...guessed].filter(l => !word.includes(l));
  const wrongCount = wrong.length;
  const revealed = word.split('').map(l => guessed.has(l) ? l : '_');
  const isWon = revealed.every(l => l !== '_');
  const isLost = wrongCount >= MAX_WRONG;
  const phase = isWon ? 'won' : isLost ? 'lost' : 'playing';

  const guess = useCallback((letter: string) => {
    if (phase !== 'playing' || guessed.has(letter)) return;
    const next = new Set(guessed);
    next.add(letter);
    setGuessed(next);
    if (!word.includes(letter)) return;
    const newRevealed = word.split('').map(l => next.has(l) ? l : '_');
    if (newRevealed.every(l => l !== '_')) {
      setWins(w => w + 1);
      setScore(s => s + Math.max(10, 30 - wrongCount * 5));
    }
  }, [phase, guessed, word, wrongCount]);

  const newGame = () => {
    if (isLost) setLosses(l => l + 1);
    setWordData(pickWord());
    setGuessed(new Set());
  };

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="container-cute" style={{ maxWidth: '520px' }}>
      <div className="card-cute" style={{ background: '#faf5ff' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <span className="badge-cute">Hangman Love 💀❤️</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700 }}>W:{wins}</span>
            <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 700 }}>L:{losses}</span>
          </div>
        </div>

        {/* Score & Category */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem', fontSize: '0.82rem', color: '#6b7280' }}>
          <span>Category: <strong style={{ color: '#7c3aed' }}>{category}</strong></span>
          <span>Score: <strong style={{ color: '#7c3aed' }}>{score}</strong></span>
        </div>

        {/* Hangman figure */}
        <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
          <div style={{ fontSize: '5rem', lineHeight: 1, filter: isLost ? 'none' : 'grayscale(0.6)', transition: 'filter 0.3s' }}>
            {HANGMAN_PARTS[Math.min(wrongCount, HANGMAN_PARTS.length - 1)]}
          </div>
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '8px' }}>
            {Array.from({ length: MAX_WRONG }, (_, i) => (
              <div key={i} style={{ width: '20px', height: '6px', borderRadius: '3px', background: i < wrongCount ? '#dc2626' : '#ede9fe', transition: 'background 0.3s' }} />
            ))}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>{wrongCount}/{MAX_WRONG} wrong guesses</div>
        </div>

        {/* Word display */}
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {revealed.map((l, i) => (
            <div key={i} style={{ width: '32px', height: '40px', borderBottom: '3px solid #7c3aed', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '4px', fontFamily: 'monospace', fontWeight: 900, fontSize: '1.3rem', color: l !== '_' ? (isWon ? '#059669' : '#4c1d95') : 'transparent', animation: l !== '_' ? 'pop-in 0.2s ease' : 'none' }}>
              {l}
            </div>
          ))}
        </div>

        {/* Wrong letters */}
        {wrong.length > 0 && (
          <div style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '0.85rem', color: '#dc2626' }}>
            Wrong: {wrong.join(', ')}
          </div>
        )}

        {/* Phase result */}
        {phase !== 'playing' && (
          <div style={{ textAlign: 'center', padding: '1rem', background: phase === 'won' ? '#ecfdf5' : '#fef2f2', borderRadius: '16px', marginBottom: '1.2rem', animation: 'pop-in 0.4s ease' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>{phase === 'won' ? '🎉' : '💔'}</div>
            <div className="font-cute" style={{ fontSize: '1.2rem', color: phase === 'won' ? '#047857' : '#b91c1c' }}>
              {phase === 'won' ? `You got it! +${Math.max(10, 30 - wrongCount * 5)} pts 🌟` : `The word was: ${word}`}
            </div>
            <button onClick={newGame} className="btn-cute btn-cute-primary" style={{ marginTop: '1rem', background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' }}>
              <RefreshCw size={14} /> Next Word
            </button>
          </div>
        )}

        {/* Keyboard */}
        {phase === 'playing' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
            {alphabet.map(l => {
              const isGuessed = guessed.has(l);
              const isWrong = isGuessed && !word.includes(l);
              const isCorrect = isGuessed && word.includes(l);
              return (
                <button key={l} onClick={() => guess(l)} disabled={isGuessed}
                  style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1.5px solid', padding: 0, fontSize: '0.85rem', fontWeight: 700, cursor: isGuessed ? 'default' : 'pointer', transition: 'all 0.15s', background: isCorrect ? '#ecfdf5' : isWrong ? '#fef2f2' : '#fff', borderColor: isCorrect ? '#10b981' : isWrong ? '#dc2626' : '#ddd6fe', color: isCorrect ? '#047857' : isWrong ? '#b91c1c' : '#4c1d95', opacity: isGuessed ? 0.5 : 1 }}>
                  {l}
                </button>
              );
            })}
          </div>
        )}

        {/* Hint */}
        <div style={{ textAlign: 'center', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <Heart size={12} color="#a78bfa" fill="#a78bfa" />
          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Category: {category} • {word.length} letters</span>
        </div>
      </div>
    </div>
  );
};
