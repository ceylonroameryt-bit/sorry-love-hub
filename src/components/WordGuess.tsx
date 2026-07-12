import React, { useState } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, HelpCircle, Heart, Sparkles } from 'lucide-react';

interface WordGameState {
  phase: 'setup' | 'choosing' | 'playing' | 'ended';
  creator: 'host' | 'guest';
  word: string;
  hint: string;
  guessedLetters: string[];
  maxStrikes: number;
  strikes: number;
  result: 'won' | 'lost' | null;
}

const INITIAL: WordGameState = {
  phase: 'setup', creator: 'host', word: '', hint: '',
  guessedLetters: [], maxStrikes: 6, strikes: 0, result: null,
};

export const WordGuess: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName } = useGamePeer();
  const state: WordGameState = gameState ?? INITIAL;

  const [inputWord, setInputWord] = useState('');
  const [inputHint, setInputHint] = useState('');

  const isCreator = (role === 'host' && state.creator === 'host') || (role === 'guest' && state.creator === 'guest');
  const isGuesser = !isCreator;
  const canGuess = state.phase === 'playing' && isGuesser && !state.result;

  const startSetup = (creator: 'host' | 'guest') => {
    sendGameAction({ ...INITIAL, phase: 'choosing', creator });
  };

  const submitWord = () => {
    if (!inputWord.trim()) return;
    sendGameAction({ ...state, phase: 'playing', word: inputWord.trim().toUpperCase(), hint: inputHint.trim() });
    setInputWord(''); setInputHint('');
  };

  const guessLetter = (letter: string) => {
    if (!canGuess || state.guessedLetters.includes(letter)) return;
    const guessed = [...state.guessedLetters, letter];
    const strikes = state.word.includes(letter) ? state.strikes : state.strikes + 1;
    const won = state.word.split('').every(c => c === ' ' || guessed.includes(c));
    const lost = strikes >= state.maxStrikes;
    sendGameAction({
      ...state,
      guessedLetters: guessed,
      strikes,
      result: won ? 'won' : lost ? 'lost' : null,
      phase: (won || lost) ? 'ended' : 'playing',
    });
  };

  const reset = () => {
    sendGameAction({ ...INITIAL, creator: state.creator === 'host' ? 'guest' : 'host' });
  };

  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="container-cute" style={{ maxWidth: '700px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Back */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Word Guessing 🔠</span>
        </div>

        {/* SETUP */}
        {state.phase === 'setup' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <h2 className="heading-lg">Who sets the secret word? 🤫</h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>One player writes a word + hint, the other guesses!</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={() => startSetup(role === 'host' ? 'host' : 'guest')} className="btn-cute btn-cute-primary">
                I'll set it! ✍️
              </button>
              <button onClick={() => startSetup(role === 'host' ? 'guest' : 'host')} className="btn-cute btn-cute-secondary">
                {opponentName || 'Partner'} sets it 👉
              </button>
            </div>
          </div>
        )}

        {/* CHOOSING */}
        {state.phase === 'choosing' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            {isCreator ? (
              <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
                <h2 className="heading-lg" style={{ textAlign: 'center' }}>Set Your Secret Word 💜</h2>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#4c1d95', marginBottom: '0.4rem' }}>Secret Word:</label>
                  <input
                    className="input-cute"
                    placeholder="e.g. HUG, FOREVER, CUTIE..."
                    value={inputWord}
                    onChange={e => setInputWord(e.target.value.replace(/[^A-Za-z ]/gi, ''))}
                    style={{ textTransform: 'uppercase', textAlign: 'center', letterSpacing: '2px', fontSize: '1.1rem' }}
                    autoFocus
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#4c1d95', marginBottom: '0.4rem' }}>Hint (optional):</label>
                  <input
                    className="input-cute"
                    placeholder="e.g. Something I give you every day..."
                    value={inputHint}
                    onChange={e => setInputHint(e.target.value)}
                  />
                </div>
                <button
                  onClick={submitWord}
                  disabled={!inputWord.trim()}
                  className="btn-cute btn-cute-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Send Word! 💌
                </button>
              </div>
            ) : (
              <div style={{ padding: '3rem 0' }}>
                <div style={{ fontSize: '3rem', animation: 'float 2s ease-in-out infinite' }}>✍️💭</div>
                <h2 className="heading-lg" style={{ marginTop: '1rem' }}>
                  {opponentName || 'Partner'} is thinking of a word...
                </h2>
                <p style={{ color: '#6b7280' }}>Get ready to guess! 🎯</p>
              </div>
            )}
          </div>
        )}

        {/* PLAYING / ENDED */}
        {(state.phase === 'playing' || state.phase === 'ended') && (
          <div style={{ textAlign: 'center' }}>
            {/* Info */}
            <div style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '0.95rem' }}>
              {isCreator
                ? <span><strong>{opponentName}</strong> is guessing your word!</span>
                : <span><strong>{opponentName}</strong> set this word for you!</span>
              }
              {state.hint && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f5f3ff', padding: '0.35rem 0.9rem', borderRadius: '50px', color: '#7c3aed', fontWeight: 600, marginLeft: '0.8rem' }}>
                  <HelpCircle size={14} /> {state.hint}
                </div>
              )}
            </div>

            {/* Word display */}
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px', margin: '1.5rem 0' }}>
              {state.word.split('').map((char, i) => {
                const revealed = state.guessedLetters.includes(char) || (state.result === 'lost');
                return (
                  <span key={i} style={{
                    display: 'inline-block',
                    width: '36px',
                    borderBottom: char === ' ' ? 'none' : '3px solid #7c3aed',
                    margin: '0 3px',
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    color: revealed ? (state.result === 'lost' && !state.guessedLetters.includes(char) ? '#dc2626' : '#1e1b4b') : 'transparent',
                    textAlign: 'center',
                    height: '44px',
                    fontFamily: 'var(--font-cute)',
                    letterSpacing: '1px',
                  }}>
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                );
              })}
            </div>

            {/* Hearts / Lives */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '1.5rem' }}>
              {Array.from({ length: state.maxStrikes }).map((_, i) => (
                <Heart key={i} size={26}
                  fill={i < state.strikes ? 'none' : '#7c3aed'}
                  color={i < state.strikes ? '#ddd6fe' : '#7c3aed'}
                  style={{ transition: 'all 0.3s' }}
                />
              ))}
            </div>

            {/* Playing state: keyboard or watcher */}
            {state.phase === 'playing' && (
              isGuesser ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', maxWidth: '480px', margin: '0 auto' }}>
                  {ALPHA.map(l => {
                    const used = state.guessedLetters.includes(l);
                    const correct = used && state.word.includes(l);
                    const wrong = used && !state.word.includes(l);
                    return (
                      <button
                        key={l}
                        onClick={() => guessLetter(l)}
                        disabled={used}
                        style={{
                          padding: '0.5rem 0',
                          border: `1.5px solid ${correct ? '#10b981' : wrong ? '#fecaca' : '#ddd6fe'}`,
                          borderRadius: '8px',
                          background: correct ? '#d1fae5' : wrong ? '#fef2f2' : '#fff',
                          color: correct ? '#059669' : wrong ? '#dc2626' : '#4c1d95',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          cursor: used ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s',
                          fontFamily: 'var(--font-cute)',
                        }}
                      >
                        {l}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ background: '#f5f3ff', borderRadius: '16px', padding: '1.2rem', display: 'inline-block' }}>
                  <p style={{ fontWeight: 600, color: '#4c1d95', marginBottom: '0.6rem' }}>Guessed so far:</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {state.guessedLetters.length === 0
                      ? <span style={{ color: '#a78bfa', fontSize: '0.9rem' }}>None yet...</span>
                      : state.guessedLetters.map(l => (
                        <span key={l} style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontWeight: 700,
                          background: state.word.includes(l) ? '#d1fae5' : '#fef2f2',
                          color: state.word.includes(l) ? '#059669' : '#dc2626',
                          border: `1px solid ${state.word.includes(l) ? '#a7f3d0' : '#fecaca'}`,
                        }}>{l}</span>
                      ))
                    }
                  </div>
                </div>
              )
            )}

            {/* ENDED */}
            {state.phase === 'ended' && (
              <div style={{ animation: 'pop-in 0.4s ease', marginTop: '1.5rem' }}>
                {state.result === 'won' ? (
                  <div>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉⭐🎉</div>
                    <h3 className="font-cute" style={{ color: '#059669', fontSize: '2rem', margin: '0 0 0.5rem' }}>
                      {isCreator ? `${opponentName} Guessed It!` : 'You Got It!'}
                    </h3>
                    <p style={{ color: '#6b7280' }}>The word was <strong style={{ color: '#4c1d95' }}>{state.word}</strong> !</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💔</div>
                    <h3 className="font-cute" style={{ color: '#dc2626', fontSize: '2rem', margin: '0 0 0.5rem' }}>Out of Lives!</h3>
                    <p style={{ color: '#6b7280' }}>The word was <strong style={{ color: '#4c1d95' }}>{state.word}</strong></p>
                  </div>
                )}
                <button onClick={reset} className="btn-cute btn-cute-primary" style={{ marginTop: '1.5rem' }}>
                  <Sparkles size={16} /> Play Again (Swap Roles)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
