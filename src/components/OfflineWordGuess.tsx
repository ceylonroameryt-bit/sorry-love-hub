import React, { useState, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Heart, HelpCircle, Sparkles } from 'lucide-react';

interface WordEntry { word: string; hint: string; }

const WORD_BANK: Record<string, WordEntry[]> = {
  '💜 Love & Affection': [
    { word: 'FOREVER', hint: 'How long I want to be with you' },
    { word: 'SWEETHEART', hint: 'A loving nickname 💕' },
    { word: 'DEVOTION', hint: 'Deep love and loyalty' },
    { word: 'DARLING', hint: 'A word of endearment' },
    { word: 'CHERISH', hint: 'To hold something dearly' },
    { word: 'ADORE', hint: 'To love intensely' },
    { word: 'ROMANCE', hint: 'Love with butterflies ✨' },
    { word: 'TENDER', hint: 'Gentle and loving touch' },
  ],
  '🐾 Cute Animals': [
    { word: 'KITTEN', hint: 'A baby cat 🐱' },
    { word: 'PUPPY', hint: 'A baby dog 🐶' },
    { word: 'PANDA', hint: 'Black and white bear that loves bamboo' },
    { word: 'BUNNY', hint: 'Fluffy ears and a cottontail 🐰' },
    { word: 'KOALA', hint: 'Australian tree-hugger 🌿' },
    { word: 'PENGUIN', hint: 'Tuxedo bird from the south pole 🐧' },
    { word: 'HAMSTER', hint: 'Chubby cheeks, loves wheels 🐹' },
    { word: 'DUCKLING', hint: 'A baby duck who follows mama 🐥' },
  ],
  '🍓 Sweet Treats': [
    { word: 'CHOCOLATE', hint: 'Sweet, dark, and melts in your mouth 🍫' },
    { word: 'CUPCAKE', hint: 'A tiny frosted cake 🧁' },
    { word: 'STRAWBERRY', hint: 'Red heart-shaped fruit 🍓' },
    { word: 'HONEY', hint: 'Sweet stuff bees make 🍯' },
    { word: 'CARAMEL', hint: 'Sticky golden sweetness' },
    { word: 'MOCHI', hint: 'Soft Japanese sweet rice cake' },
    { word: 'TRUFFLE', hint: 'Fancy chocolate ball 🍬' },
    { word: 'MACARON', hint: 'Colourful French sandwich cookie' },
  ],
  '🌟 Dreams & Memories': [
    { word: 'LAUGHTER', hint: 'The best sound in the world 😂' },
    { word: 'FUTURE', hint: 'Where we are going together ✨' },
    { word: 'ADVENTURE', hint: 'An exciting journey together 🗺️' },
    { word: 'SUNRISE', hint: 'A beautiful beginning 🌅' },
    { word: 'JOURNEY', hint: 'Life is one big one 🛤️' },
    { word: 'MEMORY', hint: 'A moment kept in your heart 💭' },
    { word: 'MAGIC', hint: 'What we have together ✨' },
    { word: 'WONDER', hint: 'The feeling of awe and amazement' },
  ],
};

const ALL_CATEGORIES = Object.keys(WORD_BANK);
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MAX_STRIKES = 6;

function pickRandom(category: string): WordEntry {
  const arr = WORD_BANK[category];
  return arr[Math.floor(Math.random() * arr.length)];
}

interface Props { onBack: () => void; }

export const OfflineWordGuess: React.FC<Props> = ({ onBack }) => {
  const [category, setCategory] = useState<string | null>(null);
  const [entry, setEntry] = useState<WordEntry | null>(null);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [strikes, setStrikes] = useState(0);
  const [phase, setPhase] = useState<'pick' | 'playing' | 'won' | 'lost'>('pick');

  const startGame = useCallback((cat: string) => {
    setCategory(cat);
    setEntry(pickRandom(cat));
    setGuessed([]);
    setStrikes(0);
    setPhase('playing');
  }, []);

  const guess = useCallback((letter: string) => {
    if (!entry || phase !== 'playing' || guessed.includes(letter)) return;
    const next = [...guessed, letter];
    const newStrikes = entry.word.includes(letter) ? strikes : strikes + 1;
    const won = entry.word.split('').every(c => c === ' ' || next.includes(c));
    const lost = newStrikes >= MAX_STRIKES;
    setGuessed(next);
    setStrikes(newStrikes);
    if (won) setPhase('won');
    else if (lost) setPhase('lost');
  }, [entry, guessed, strikes, phase]);

  const reset = () => { setPhase('pick'); setCategory(null); setEntry(null); };
  const replay = () => { if (category) startGame(category); };

  return (
    <div className="container-cute" style={{ maxWidth: '720px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Offline Word Guess 🔠</span>
        </div>

        {/* CATEGORY PICK */}
        {phase === 'pick' && (
          <div style={{ textAlign: 'center' }}>
            <h2 className="heading-lg">Choose a Category 🎯</h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Pick a theme and guess the hidden word!</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {ALL_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => startGame(cat)}
                  style={{
                    background: '#fff', border: '2px solid #ddd6fe', borderRadius: '18px',
                    padding: '1.4rem 1rem', cursor: 'pointer', textAlign: 'center',
                    fontSize: '1.1rem', fontFamily: 'var(--font-cute)', color: '#4c1d95',
                    transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                    boxShadow: '0 2px 8px rgba(124,58,237,0.08)',
                  }}
                  onMouseEnter={e => { const t = e.currentTarget; t.style.transform = 'translateY(-4px) scale(1.03)'; t.style.borderColor = '#a78bfa'; t.style.boxShadow = '0 8px 20px rgba(124,58,237,0.18)'; }}
                  onMouseLeave={e => { const t = e.currentTarget; t.style.transform = ''; t.style.borderColor = '#ddd6fe'; t.style.boxShadow = '0 2px 8px rgba(124,58,237,0.08)'; }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PLAYING / WON / LOST */}
        {(phase === 'playing' || phase === 'won' || phase === 'lost') && entry && (
          <div style={{ textAlign: 'center' }}>
            {/* Category badge & hint */}
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span className="badge-cute">{category}</span>
              {entry.hint && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f5f3ff', padding: '0.3rem 0.9rem', borderRadius: '50px', color: '#7c3aed', fontWeight: 600, fontSize: '0.85rem' }}>
                  <HelpCircle size={13} /> {entry.hint}
                </span>
              )}
            </div>

            {/* Word display */}
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px', margin: '1.5rem 0' }}>
              {entry.word.split('').map((char, i) => {
                const revealed = guessed.includes(char) || phase === 'lost';
                return (
                  <span key={i} style={{
                    display: 'inline-block', width: char === ' ' ? '24px' : '38px',
                    borderBottom: char === ' ' ? 'none' : '3px solid #7c3aed',
                    fontSize: '1.8rem', fontWeight: 700, height: '48px', textAlign: 'center',
                    color: revealed ? (phase === 'lost' && !guessed.includes(char) ? '#dc2626' : '#1e1b4b') : 'transparent',
                    fontFamily: 'var(--font-cute)',
                  }}>
                    {char}
                  </span>
                );
              })}
            </div>

            {/* Hearts / Lives */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '1.5rem' }}>
              {Array.from({ length: MAX_STRIKES }).map((_, i) => (
                <Heart key={i} size={28}
                  fill={i < strikes ? 'none' : '#7c3aed'}
                  color={i < strikes ? '#fecaca' : '#7c3aed'}
                  style={{ transition: 'all 0.3s' }}
                />
              ))}
            </div>

            {/* WIN / LOSE banners */}
            {phase === 'won' && (
              <div style={{ animation: 'pop-in 0.4s ease', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '2.5rem' }}>🎉✨🎉</div>
                <h3 className="font-cute" style={{ color: '#059669', fontSize: '2rem', margin: '0.3rem 0' }}>You Got It!</h3>
                <p style={{ color: '#6b7280' }}>The word was <strong style={{ color: '#4c1d95' }}>{entry.word}</strong>!</p>
              </div>
            )}
            {phase === 'lost' && (
              <div style={{ animation: 'pop-in 0.4s ease', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '2.5rem' }}>💔</div>
                <h3 className="font-cute" style={{ color: '#dc2626', fontSize: '2rem', margin: '0.3rem 0' }}>Out of Lives!</h3>
                <p style={{ color: '#6b7280' }}>The word was <strong style={{ color: '#4c1d95' }}>{entry.word}</strong></p>
              </div>
            )}

            {/* Keyboard — only show while playing */}
            {phase === 'playing' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
                {ALPHA.map(l => {
                  const used = guessed.includes(l);
                  const correct = used && entry.word.includes(l);
                  const wrong = used && !entry.word.includes(l);
                  return (
                    <button
                      key={l}
                      onClick={() => guess(l)}
                      disabled={used}
                      className="alpha-key"
                      style={{
                        padding: '0.5rem 0',
                        border: `1.5px solid ${correct ? '#10b981' : wrong ? '#fecaca' : '#ddd6fe'}`,
                        borderRadius: '8px',
                        background: correct ? '#d1fae5' : wrong ? '#fef2f2' : '#fff',
                        color: correct ? '#059669' : wrong ? '#dc2626' : '#4c1d95',
                        fontWeight: 700, fontSize: '0.95rem',
                        cursor: used ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                        fontFamily: 'var(--font-cute)',
                        minHeight: '36px',
                      }}
                    >{l}</button>
                  );
                })}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {(phase === 'won' || phase === 'lost') && (
                <>
                  <button onClick={replay} className="btn-cute btn-cute-primary">
                    <Sparkles size={15} /> Play Again
                  </button>
                  <button onClick={reset} className="btn-cute btn-cute-secondary">
                    <RefreshCw size={15} /> Change Category
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
