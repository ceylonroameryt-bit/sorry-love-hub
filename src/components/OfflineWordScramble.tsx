import React, { useState, useCallback } from 'react';
import { ArrowLeft, Shuffle } from 'lucide-react';
import { WORD_BANK, ALL_CATEGORIES } from '../utils/wordBank';

function pickWord(): { word: string; hint: string; category: string } {
  const cat = ALL_CATEGORIES[Math.floor(Math.random() * ALL_CATEGORIES.length)];
  const entries = WORD_BANK[cat];
  const entry = entries[Math.floor(Math.random() * entries.length)];
  return { word: entry.word.toUpperCase(), hint: entry.hint, category: cat };
}

function scrambleWord(word: string): string[] {
  const letters = word.split('');
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  // Make sure it's not the same as original
  if (letters.join('') === word && word.length > 1) {
    [letters[0], letters[1]] = [letters[1], letters[0]];
  }
  return letters;
}

type Phase = 'playing' | 'correct' | 'gave_up';
interface Props { onBack: () => void; }

export const OfflineWordScramble: React.FC<Props> = ({ onBack }) => {
  const [{ word, hint, category }, setWordData] = useState(pickWord);
  const [letters, setLetters] = useState<string[]>(() => scrambleWord(pickWord().word));
  const [selected, setSelected] = useState<(number | null)[]>([]);
  const [phase, setPhase] = useState<Phase>('playing');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const newWord = useCallback(() => {
    const w = pickWord();
    setWordData(w);
    setLetters(scrambleWord(w.word));
    setSelected([]);
    setPhase('playing');
  }, []);

  // When component mounts, pick a word and scramble it
  const [initialized, setInitialized] = useState(false);
  if (!initialized) {
    const w = pickWord();
    setWordData(w);
    setLetters(scrambleWord(w.word));
    setInitialized(true);
  }


  const selectLetter = (idx: number) => {
    if (phase !== 'playing') return;
    if (selected.includes(idx)) return; // already selected
    const next = [...selected, idx];
    setSelected(next);
    if (next.length === word.length) {
      const guess = next.map(i => letters[i!]).join('');
      if (guess === word) {
        setPhase('correct');
        setScore(s => s + 1);
        setStreak(s => s + 1);
      } else {
        // Wrong — shake and reset selection
        setTimeout(() => setSelected([]), 400);
      }
    }
  };

  const removeLast = () => {
    if (selected.length === 0 || phase !== 'playing') return;
    setSelected(prev => prev.slice(0, -1));
  };

  const giveUp = () => {
    setPhase('gave_up');
    setStreak(0);
  };

  return (
    <div className="container-cute" style={{ maxWidth: '520px' }}>
      <div className="card-cute" style={{ background: '#faf5ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}><ArrowLeft size={14} /> Back</button>
          <span className="badge-cute">Word Scramble 🔀</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', background: '#fff', borderRadius: '14px', padding: '0.6rem', border: '1px solid #ede9fe', marginBottom: '1.2rem' }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.72rem', color: '#6b7280' }}>Score</div><div className="font-cute" style={{ fontSize: '1.3rem', color: '#7c3aed' }}>{score}</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.72rem', color: '#6b7280' }}>Streak 🔥</div><div className="font-cute" style={{ fontSize: '1.3rem', color: '#ec4899' }}>{streak}</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.72rem', color: '#6b7280' }}>Category</div><div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4c1d95', maxWidth: '80px', lineHeight: 1.2 }}>{category}</div></div>
        </div>

        {/* Hint */}
        <div style={{ background: '#fffbeb', borderRadius: '12px', padding: '0.7rem 1rem', border: '1px solid #fef3c7', marginBottom: '1.2rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 700 }}>💡 HINT: </span>
          <span style={{ fontSize: '0.85rem', color: '#92400e' }}>{hint}</span>
        </div>

        {/* Answer slots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
          {Array.from({ length: word.length }, (_, i) => (
            <div key={i} style={{
              width: '42px', height: '48px', borderRadius: '10px',
              border: `2px solid ${selected.length > i ? '#7c3aed' : '#ddd6fe'}`,
              background: selected.length > i ? '#f5f3ff' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-cute)', fontSize: '1.3rem', fontWeight: 700, color: '#4c1d95',
              transition: 'all 0.15s',
            }}>
              {selected[i] !== undefined ? letters[selected[i]!] : ''}
            </div>
          ))}
        </div>

        {/* Scrambled letters */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
          {letters.map((letter, i) => (
            <button key={i} onClick={() => selectLetter(i)} disabled={selected.includes(i) || phase !== 'playing'}
              className="btn-cute" style={{
                width: '44px', height: '44px', padding: 0, justifyContent: 'center',
                background: selected.includes(i) ? '#ede9fe' : '#fff',
                color: selected.includes(i) ? '#a78bfa' : '#4c1d95',
                border: `2px solid ${selected.includes(i) ? '#ddd6fe' : '#a78bfa'}`,
                fontFamily: 'var(--font-cute)', fontSize: '1.2rem', fontWeight: 700,
                transform: selected.includes(i) ? 'scale(0.9)' : 'scale(1)',
              }}>
              {letter}
            </button>
          ))}
        </div>

        {/* Controls */}
        {phase === 'playing' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button onClick={removeLast} className="btn-cute btn-cute-secondary" style={{ fontSize: '0.85rem' }}>⌫ Remove</button>
            <button onClick={giveUp} className="btn-cute btn-cute-secondary" style={{ fontSize: '0.85rem', color: '#dc2626' }}>Give Up 🏳️</button>
          </div>
        )}

        {/* Result */}
        {(phase === 'correct' || phase === 'gave_up') && (
          <div style={{ textAlign: 'center', animation: 'pop-in 0.3s ease' }}>
            {phase === 'correct' && <div style={{ marginBottom: '0.5rem' }}><span style={{ fontSize: '1.5rem' }}>🎉</span><span className="font-cute" style={{ fontSize: '1.3rem', color: '#059669', marginLeft: '8px' }}>Correct!</span></div>}
            {phase === 'gave_up' && <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1rem', color: '#6b7280' }}>The word was:</span>
              <div className="font-cute" style={{ fontSize: '1.8rem', color: '#7c3aed', letterSpacing: '0.1em' }}>{word}</div>
            </div>}
            <button onClick={newWord} className="btn-cute btn-cute-primary" style={{ marginTop: '0.5rem' }}><Shuffle size={14} /> Next Word</button>
          </div>
        )}
      </div>
    </div>
  );
};
