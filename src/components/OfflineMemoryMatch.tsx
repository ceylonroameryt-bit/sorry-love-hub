import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

const EMOJIS = ['💖', '🐱', '🍓', '🧸', '💌', '🍦', '🍩', '🐼', '🌸', '🦋', '🍭', '🐰'];

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type GridSize = 4 | 6;

interface Props { onBack: () => void; }

export const OfflineMemoryMatch: React.FC<Props> = ({ onBack }) => {
  const [gridSize, setGridSize] = useState<GridSize | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [locked, setLocked] = useState(false);
  const [phase, setPhase] = useState<'pick' | 'playing' | 'won'>('pick');
  const [bestMoves, setBestMoves] = useState<Record<number, number>>(() => {
    try { return JSON.parse(localStorage.getItem('mem_best') || '{}'); } catch { return {}; }
  });

  const totalPairs = gridSize ? (gridSize * gridSize) / 2 : 0;

  const initGame = useCallback((size: GridSize) => {
    const pairs = size === 4 ? 8 : 18;
    const pool = shuffle(EMOJIS).slice(0, pairs);
    const doubled = shuffle([...pool, ...pool]);
    setCards(doubled.map((emoji, id) => ({ id, emoji, flipped: false, matched: false })));
    setSelected([]);
    setMoves(0);
    setMatches(0);
    setLocked(false);
    setPhase('playing');
    setGridSize(size);
  }, []);

  const flip = useCallback((id: number) => {
    if (locked || phase !== 'playing') return;
    setCards(prev => {
      const card = prev[id];
      if (card.flipped || card.matched) return prev;
      return prev.map((c, i) => i === id ? { ...c, flipped: true } : c);
    });
    setSelected(prev => {
      if (prev.length === 1 && prev[0] === id) return prev;
      return [...prev, id];
    });
  }, [locked, phase]);

  // Check for match when 2 cards selected
  useEffect(() => {
    if (selected.length !== 2) return;
    const [a, b] = selected;
    const ca = cards[a], cb = cards[b];
    if (!ca || !cb) return;
    setLocked(true);
    setMoves(m => m + 1);

    if (ca.emoji === cb.emoji) {
      setCards(prev => prev.map((c, i) => (i === a || i === b) ? { ...c, matched: true } : c));
      setMatches(m => {
        const next = m + 1;
        if (next === totalPairs) {
          const finalMoves = moves + 1;
          setTimeout(() => {
            setPhase('won');
            confetti({ particleCount: 100, spread: 100, colors: ['#7c3aed', '#a78bfa', '#ddd6fe'] });
            setBestMoves(prev => {
              const key = gridSize!;
              const updated = { ...prev, [key]: Math.min(prev[key] ?? Infinity, finalMoves) };
              localStorage.setItem('mem_best', JSON.stringify(updated));
              return updated;
            });
          }, 400);
        }
        return next;
      });
      setSelected([]);
      setLocked(false);
    } else {
      setTimeout(() => {
        setCards(prev => prev.map((c, i) => (i === a || i === b) ? { ...c, flipped: false } : c));
        setSelected([]);
        setLocked(false);
      }, 900);
    }
  }, [selected]);

  const cols = gridSize === 4 ? 4 : 6;

  return (
    <div className="container-cute" style={{ maxWidth: '820px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Memory Match 🃏</span>
        </div>

        {/* SIZE PICK */}
        {phase === 'pick' && (
          <div style={{ textAlign: 'center' }}>
            <h2 className="heading-lg">Memory Match 🃏</h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Flip cards to find matching pairs. Find all pairs with the fewest moves!</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              {([4, 6] as GridSize[]).map(size => (
                <button
                  key={size}
                  onClick={() => initGame(size)}
                  style={{
                    background: '#fff', border: '2.5px solid #ddd6fe', borderRadius: '20px',
                    padding: '2rem 2.5rem', cursor: 'pointer', textAlign: 'center',
                    transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                    boxShadow: '0 2px 10px rgba(124,58,237,0.08)',
                  }}
                  onMouseEnter={e => { const t = e.currentTarget; t.style.transform = 'translateY(-5px) scale(1.04)'; t.style.borderColor = '#a78bfa'; }}
                  onMouseLeave={e => { const t = e.currentTarget; t.style.transform = ''; t.style.borderColor = '#ddd6fe'; }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{size === 4 ? '🐣' : '🦋'}</div>
                  <div className="font-cute" style={{ color: '#4c1d95', fontSize: '1.2rem', fontWeight: 700 }}>{size}×{size}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    {size === 4 ? 'Easy — 8 pairs' : 'Hard — 18 pairs'}
                  </div>
                  {bestMoves[size] && (
                    <div style={{ color: '#a78bfa', fontSize: '0.8rem', marginTop: '0.4rem' }}>
                      🏆 Best: {bestMoves[size]} moves
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PLAYING */}
        {(phase === 'playing' || phase === 'won') && (
          <div>
            {/* Stats bar */}
            <div style={{ display: 'flex', justifyContent: 'space-around', background: '#fff', borderRadius: '14px', padding: '0.8rem', border: '1px solid #ede9fe', marginBottom: '1.5rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Moves</div>
                <div className="font-cute" style={{ fontSize: '1.5rem', color: '#7c3aed' }}>{moves}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Matches</div>
                <div className="font-cute" style={{ fontSize: '1.5rem', color: '#059669' }}>{matches}/{totalPairs}</div>
              </div>
              {bestMoves[gridSize!] && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Best</div>
                  <div className="font-cute" style={{ fontSize: '1.5rem', color: '#f59e0b' }}>🏆 {bestMoves[gridSize!]}</div>
                </div>
              )}
            </div>

            {/* Win Banner */}
            {phase === 'won' && (
              <div style={{ textAlign: 'center', marginBottom: '1.5rem', animation: 'pop-in 0.4s ease' }}>
                <Award size={52} color="#7c3aed" style={{ animation: 'float 2s ease infinite' }} />
                <h3 className="font-cute" style={{ color: '#7c3aed', fontSize: '2rem', margin: '0.5rem 0 0.3rem' }}>You Won! 🎉</h3>
                <p style={{ color: '#6b7280' }}>Completed in <strong style={{ color: '#4c1d95' }}>{moves}</strong> moves!</p>
                {bestMoves[gridSize!] === moves && <p style={{ color: '#f59e0b', fontWeight: 700 }}>🏆 New Best Score!</p>}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <button onClick={() => initGame(gridSize!)} className="btn-cute btn-cute-primary"><RefreshCw size={15} /> Play Again</button>
                  <button onClick={() => setPhase('pick')} className="btn-cute btn-cute-secondary">Change Size</button>
                </div>
              </div>
            )}

            {/* Card Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gap: '10px',
              maxWidth: gridSize === 4 ? '420px' : '600px',
              margin: '0 auto',
            }}>
              {cards.map((card, i) => (
                <div
                  key={card.id}
                  onClick={() => flip(i)}
                  style={{
                    aspectRatio: '1',
                    perspective: '600px',
                    cursor: card.matched || card.flipped || locked ? 'default' : 'pointer',
                  }}
                >
                  <div style={{
                    width: '100%', height: '100%',
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    transform: card.flipped || card.matched ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transition: 'transform 0.38s ease',
                  }}>
                    {/* Back */}
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: '14px',
                      background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                      backfaceVisibility: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.5rem', boxShadow: '0 3px 10px rgba(124,58,237,0.18)',
                    }}>❓</div>
                    {/* Front */}
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: '14px',
                      background: card.matched ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : '#fff',
                      border: card.matched ? '2px solid #10b981' : '2px solid #ddd6fe',
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: gridSize === 4 ? '2rem' : '1.5rem',
                      boxShadow: card.matched ? '0 4px 12px rgba(16,185,129,0.2)' : '0 2px 6px rgba(0,0,0,0.06)',
                    }}>
                      {card.emoji}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {phase === 'playing' && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                <button onClick={() => initGame(gridSize!)} className="btn-cute btn-cute-secondary" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
                  <RefreshCw size={14} /> Restart
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
