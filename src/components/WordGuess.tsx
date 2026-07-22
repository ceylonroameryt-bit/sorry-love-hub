import React, { useState, useEffect } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw, Send, Heart } from 'lucide-react';
import { GameHeader } from './GameHeader';

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
  phase: 'setup',
  creator: 'host',
  word: '',
  hint: '',
  guessedLetters: [],
  maxStrikes: 6,
  strikes: 0,
  result: null,
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const WordGuess: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INITIAL);
    }
  }, [role, gameState, sendGameAction]);

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
    sendGameAction({
      ...state,
      phase: 'playing',
      word: inputWord.trim().toUpperCase(),
      hint: inputHint.trim()
    });
    setInputWord('');
    setInputHint('');
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

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Word Guessing"
        emoji="🔠"
        instructions={[
          "The Creator sets a secret word and optional hint for their partner.",
          "The Guesser taps letter tiles to uncover the hidden word.",
          "You have 6 allowed strikes before running out of hearts!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* SETUP PHASE */}
        {state.phase === 'setup' && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem', animation: 'float 2.5s ease infinite' }}>🔠💡</div>
            <h3 className="heading-lg" style={{ fontSize: '1.4rem', color: '#7c3aed', marginBottom: '1.2rem' }}>
              Who sets the secret word?
            </h3>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => startSetup('host')} className="btn-cute btn-cute-primary" style={{ padding: '0.8rem 1.4rem' }}>
                👑 Host Sets Word
              </button>
              <button onClick={() => startSetup('guest')} className="btn-cute btn-cute-primary" style={{ padding: '0.8rem 1.4rem', background: '#ec4899', borderColor: '#ec4899' }}>
                🌸 Guest Sets Word
              </button>
            </div>
          </div>
        )}

        {/* CHOOSING PHASE */}
        {state.phase === 'choosing' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
              <span className="badge-cute" style={{ background: isCreator ? '#f3e8ff' : '#f9fafb', color: isCreator ? '#7c3aed' : '#6b7280' }}>
                {isCreator ? '✨ Your turn to set the secret word!' : `⏳ Waiting for ${opponentName || 'Partner'} to set a word...`}
              </span>
            </div>

            {isCreator ? (
              <div>
                <label style={{ display: 'block', fontWeight: 700, color: '#7c3aed', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  Secret Word (A-Z letters):
                </label>
                <input
                  className="input-cute"
                  placeholder="e.g. SUNSHINE"
                  value={inputWord}
                  onChange={e => setInputWord(e.target.value.toUpperCase().replace(/[^A-Z ]/g, ''))}
                  style={{ marginBottom: '0.8rem', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />

                <label style={{ display: 'block', fontWeight: 700, color: '#ec4899', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  Optional Hint for your partner:
                </label>
                <input
                  className="input-cute"
                  placeholder="e.g. My favorite nickname for you"
                  value={inputHint}
                  onChange={e => setInputHint(e.target.value)}
                  style={{ marginBottom: '1rem', fontSize: '0.95rem' }}
                />

                <button
                  onClick={submitWord}
                  disabled={!inputWord.trim()}
                  className="btn-cute btn-cute-primary"
                  style={{ width: '100%', padding: '0.8rem', justifyContent: 'center' }}
                >
                  <Send size={16} /> Lock Secret Word
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#6b7280' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem', animation: 'pulse-gentle 1.5s infinite' }}>🤐</div>
                <p style={{ fontSize: '1rem' }}>{opponentName || 'Partner'} is choosing a secret word and hint!</p>
              </div>
            )}
          </div>
        )}

        {/* PLAYING OR ENDED PHASE */}
        {(state.phase === 'playing' || state.phase === 'ended') && (
          <div>
            {/* Strikes Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {Array.from({ length: state.maxStrikes }).map((_, i) => (
                  <Heart
                    key={i}
                    size={20}
                    fill={i < state.maxStrikes - state.strikes ? '#ec4899' : 'none'}
                    color={i < state.maxStrikes - state.strikes ? '#ec4899' : '#d1d5db'}
                  />
                ))}
              </div>
              {state.hint && (
                <span className="badge-cute" style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.82rem' }}>
                  Hint: {state.hint}
                </span>
              )}
            </div>

            {/* Word Display */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
              marginBottom: '1.5rem',
              padding: '1.2rem',
              background: '#ffffff',
              border: '2px solid #ddd6fe',
              borderRadius: '18px'
            }}>
              {state.word.split('').map((char, idx) => {
                const isSpace = char === ' ';
                const isGuessed = state.guessedLetters.includes(char) || state.phase === 'ended';
                return (
                  <div
                    key={idx}
                    style={{
                      width: isSpace ? '16px' : '38px',
                      height: isSpace ? '44px' : '44px',
                      borderBottom: isSpace ? 'none' : '3px solid #7c3aed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 900,
                      color: isGuessed ? '#7c3aed' : 'transparent',
                      fontFamily: 'monospace'
                    }}
                  >
                    {isSpace ? ' ' : isGuessed ? char : '_'}
                  </div>
                );
              })}
            </div>

            {/* Result Message */}
            {state.phase === 'ended' && (
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', color: state.result === 'won' ? '#059669' : '#dc2626', fontFamily: 'var(--font-world)', marginBottom: '0.4rem' }}>
                  {state.result === 'won' ? '🎉 Word Uncovered!' : '💔 Out of Hearts!'}
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '1rem' }}>
                  Secret Word was: <strong>{state.word}</strong>
                </p>
                <button onClick={reset} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem' }}>
                  <RefreshCw size={16} /> Switch Roles & Play Again
                </button>
              </div>
            )}

            {/* Alphabet Grid */}
            {state.phase === 'playing' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.4rem', marginBottom: '1rem' }}>
                  {ALPHABET.map(letter => {
                    const used = state.guessedLetters.includes(letter);
                    return (
                      <button
                        key={letter}
                        onClick={() => guessLetter(letter)}
                        disabled={!canGuess || used}
                        style={{
                          padding: '0.65rem 0.2rem',
                          borderRadius: '10px',
                          border: used ? '1px solid #e5e7eb' : '1.5px solid #ddd6fe',
                          background: used ? '#f3f4f6' : '#ffffff',
                          color: used ? '#9ca3af' : '#1e1b4b',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          cursor: canGuess && !used ? 'pointer' : 'default',
                          fontFamily: 'monospace'
                        }}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
                <div style={{ textAlign: 'center', color: isGuesser ? '#7c3aed' : '#6b7280', fontSize: '0.88rem', fontWeight: 600 }}>
                  {isGuesser ? 'Tap letters to guess the word!' : `Watching ${opponentName || 'partner'} guess your word...`}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
