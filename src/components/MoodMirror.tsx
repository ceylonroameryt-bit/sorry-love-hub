import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw } from 'lucide-react';

// Mood Mirror — both guess each other's current mood, score for matches

interface MoodState {
  phase: 'picking' | 'result';
  hostMood: number | null;     // host's actual mood
  guestMood: number | null;    // guest's actual mood
  hostGuess: number | null;    // host's guess of guest's mood
  guestGuess: number | null;   // guest's guess of host's mood
  round: number;
  hostScore: number;
  guestScore: number;
}

const MOODS = [
  { emoji: '😍', label: 'In love' },
  { emoji: '😊', label: 'Happy' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '🥰', label: 'Cuddly' },
  { emoji: '😤', label: 'Annoyed' },
  { emoji: '😴', label: 'Sleepy' },
  { emoji: '🤪', label: 'Silly' },
  { emoji: '🥺', label: 'Soft' },
];

const MAX_ROUNDS = 5;
const INITIAL: MoodState = {
  phase: 'picking',
  hostMood: null, guestMood: null, hostGuess: null, guestGuess: null,
  round: 1, hostScore: 0, guestScore: 0,
};

export const MoodMirror: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName } = useGamePeer();
  const state: MoodState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const myMood = role === 'host' ? state.hostMood : state.guestMood;
  const myGuess = role === 'host' ? state.hostGuess : state.guestGuess;
  const myScore = role === 'host' ? state.hostScore : state.guestScore;
  const theirScore = role === 'host' ? state.guestScore : state.hostScore;
  const theirMood = role === 'host' ? state.guestMood : state.hostMood;
  const theirGuess = role === 'host' ? state.guestGuess : state.hostGuess;

  const setMyMood = (idx: number) => {
    if (myMood !== null) return;
    const s = stateRef.current;
    const next = role === 'host' ? { ...s, hostMood: idx } : { ...s, guestMood: idx };
    sendGameAction(checkResolved(next));
  };

  const setMyGuess = (idx: number) => {
    if (myGuess !== null) return;
    const s = stateRef.current;
    const next = role === 'host' ? { ...s, hostGuess: idx } : { ...s, guestGuess: idx };
    sendGameAction(checkResolved(next));
  };

  const checkResolved = (s: MoodState): MoodState => {
    if (s.hostMood !== null && s.guestMood !== null && s.hostGuess !== null && s.guestGuess !== null) {
      // Both done — compute scores
      const hostGotIt = s.hostGuess === s.guestMood ? 1 : 0;
      const guestGotIt = s.guestGuess === s.hostMood ? 1 : 0;
      return {
        ...s, phase: 'result',
        hostScore: s.hostScore + hostGotIt,
        guestScore: s.guestScore + guestGotIt,
      };
    }
    return s;
  };

  const nextRound = () => {
    const s = stateRef.current;
    if (s.round >= MAX_ROUNDS) {
      sendGameAction({ ...s, round: MAX_ROUNDS + 1 });
      return;
    }
    sendGameAction({ ...INITIAL, hostScore: s.hostScore, guestScore: s.guestScore, round: s.round + 1 });
  };

  const resetGame = () => sendGameAction({ ...INITIAL });
  const gameOver = state.round > MAX_ROUNDS;
  const iWon = myScore > theirScore;
  const bothMoodSet = myMood !== null;
  const bothGuessSet = myGuess !== null;

  return (
    <div className="container-cute" style={{ maxWidth: '640px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Mood Mirror 🪞</span>
          <button onClick={resetGame} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.6rem' }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Scores */}
        <div style={{ display: 'flex', justifyContent: 'space-around', background: '#fff', borderRadius: '14px', padding: '0.7rem', border: '1px solid #ede9fe', marginBottom: '1.2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>You 🪞</div>
            <div className="font-cute" style={{ fontSize: '2rem', color: '#7c3aed' }}>{myScore}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Round {Math.min(state.round, MAX_ROUNDS)}/{MAX_ROUNDS}</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Guess their mood!</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{opponentName || 'Partner'} 🪞</div>
            <div className="font-cute" style={{ fontSize: '2rem', color: '#ec4899' }}>{theirScore}</div>
          </div>
        </div>

        {/* Game over */}
        {gameOver && (
          <div style={{ textAlign: 'center', padding: '2rem 0', animation: 'pop-in 0.5s ease' }}>
            <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>{iWon ? '🪞✨' : myScore === theirScore ? '🤝' : '💫'}</div>
            <h2 className="font-cute" style={{ fontSize: '2rem', color: '#4c1d95', marginBottom: '0.5rem' }}>
              {iWon ? 'You Win! 🎉' : myScore === theirScore ? "Mind Meld! 🤝" : `${opponentName || 'Partner'} Wins!`}
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Final: {myScore} – {theirScore} correct guesses</p>
            {role === 'host' && (
              <button onClick={resetGame} className="btn-cute btn-cute-primary">Play Again 🪞</button>
            )}
          </div>
        )}

        {/* Picking phase */}
        {!gameOver && state.phase === 'picking' && (
          <div>
            {/* Step 1: set your mood */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 className="font-cute" style={{ color: '#4c1d95', textAlign: 'center', marginBottom: '0.3rem', fontSize: '1.1rem' }}>
                {bothMoodSet ? '✅ Your mood is set!' : 'Step 1: Pick YOUR current mood 🎭'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {MOODS.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setMyMood(i)}
                    disabled={bothMoodSet}
                    style={{
                      padding: '0.6rem 0.3rem', borderRadius: '12px', border: 'none', cursor: bothMoodSet ? 'default' : 'pointer',
                      background: myMood === i ? 'linear-gradient(135deg,#7c3aed,#a78bfa)' : '#f5f3ff',
                      color: myMood === i ? '#fff' : '#4c1d95', fontSize: '1.3rem',
                      transition: 'all 0.2s', transform: myMood === i ? 'scale(1.08)' : 'scale(1)',
                      boxShadow: myMood === i ? '0 4px 12px rgba(124,58,237,0.3)' : 'none',
                      opacity: bothMoodSet && myMood !== i ? 0.4 : 1,
                    }}
                  >
                    {m.emoji}
                    <div style={{ fontSize: '0.62rem', marginTop: '2px', fontFamily: 'var(--font-cute)' }}>{m.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: guess partner's mood */}
            {bothMoodSet && (
              <div>
                <h3 className="font-cute" style={{ color: '#4c1d95', textAlign: 'center', marginBottom: '0.3rem', fontSize: '1.1rem' }}>
                  {bothGuessSet
                    ? `✅ You guessed! Waiting for ${opponentName || 'partner'}...`
                    : `Step 2: Guess ${opponentName || 'partner'}'s mood! 🤔`}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {MOODS.map((m, i) => (
                    <button
                      key={i}
                      onClick={() => setMyGuess(i)}
                      disabled={bothGuessSet}
                      style={{
                        padding: '0.6rem 0.3rem', borderRadius: '12px', border: 'none', cursor: bothGuessSet ? 'default' : 'pointer',
                        background: myGuess === i ? 'linear-gradient(135deg,#ec4899,#f472b6)' : '#fdf2f8',
                        color: myGuess === i ? '#fff' : '#9d174d', fontSize: '1.3rem',
                        transition: 'all 0.2s', transform: myGuess === i ? 'scale(1.08)' : 'scale(1)',
                        boxShadow: myGuess === i ? '0 4px 12px rgba(236,72,153,0.3)' : 'none',
                        opacity: bothGuessSet && myGuess !== i ? 0.4 : 1,
                      }}
                    >
                      {m.emoji}
                      <div style={{ fontSize: '0.62rem', marginTop: '2px', fontFamily: 'var(--font-cute)' }}>{m.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!bothMoodSet && (
              <p style={{ textAlign: 'center', color: '#a78bfa', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                Your partner can't see your picks until reveal! 🙈
              </p>
            )}
          </div>
        )}

        {/* Result phase */}
        {!gameOver && state.phase === 'result' && (
          <div style={{ animation: 'pop-in 0.5s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.2rem' }}>
              {[
                { label: 'You were', mood: myMood, guess: theirGuess, guesserName: opponentName || 'Partner', color: '#7c3aed' },
                { label: `${opponentName || 'Partner'} was`, mood: theirMood, guess: myGuess, guesserName: 'You', color: '#ec4899' },
              ].map(({ label, mood, guess, guesserName, color }) => {
                const correct = mood === guess;
                return (
                  <div key={label} style={{ background: correct ? '#f0fdf4' : '#fff', border: `2px solid ${correct ? '#86efac' : '#e5e7eb'}`, borderRadius: '16px', padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.3rem' }}>{label}…</div>
                    <div style={{ fontSize: '2.5rem' }}>{mood !== null ? MOODS[mood].emoji : '?'}</div>
                    <div style={{ fontSize: '0.8rem', color, fontWeight: 700 }}>{mood !== null ? MOODS[mood].label : '—'}</div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: '#6b7280' }}>{guesserName} guessed:</div>
                    <div style={{ fontSize: '1.8rem' }}>{guess !== null ? MOODS[guess].emoji : '?'}</div>
                    <div style={{ fontSize: '1.2rem', marginTop: '0.2rem' }}>{correct ? '✅ Correct! +1' : '❌ Wrong!'}</div>
                  </div>
                );
              })}
            </div>
            {role === 'host' ? (
              <div style={{ textAlign: 'center' }}>
                <button onClick={nextRound} className="btn-cute btn-cute-primary">
                  {state.round >= MAX_ROUNDS ? 'See Final Results 🪞' : 'Next Round ➡️'}
                </button>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#8b5cf6', fontSize: '0.9rem' }}>Waiting for host to continue...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
