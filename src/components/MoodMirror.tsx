import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw } from 'lucide-react';
import { GameHeader } from './GameHeader';

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
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INITIAL);
    }
  }, [role, gameState, sendGameAction]);

  const state: MoodState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const myMood = role === 'host' ? state.hostMood : state.guestMood;
  const myGuess = role === 'host' ? state.hostGuess : state.guestGuess;
  const myScore = role === 'host' ? state.hostScore : state.guestScore;
  const theirScore = role === 'host' ? state.guestScore : state.hostScore;
  const theirMood = role === 'host' ? state.guestMood : state.hostMood;
  const theirGuess = role === 'host' ? state.guestGuess : state.hostGuess;

  const checkResolved = (s: MoodState): MoodState => {
    if (s.hostMood !== null && s.guestMood !== null && s.hostGuess !== null && s.guestGuess !== null) {
      const hBonus = s.hostGuess === s.guestMood ? 1 : 0;
      const gBonus = s.guestGuess === s.hostMood ? 1 : 0;
      return {
        ...s,
        phase: 'result',
        hostScore: s.hostScore + hBonus,
        guestScore: s.guestScore + gBonus,
      };
    }
    return s;
  };

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

  const nextRound = () => {
    if (role !== 'host') return;
    if (state.round >= MAX_ROUNDS) {
      sendGameAction(INITIAL);
    } else {
      sendGameAction({
        ...state,
        phase: 'picking',
        hostMood: null, guestMood: null, hostGuess: null, guestGuess: null,
        round: state.round + 1,
      });
    }
  };

  const resetAll = () => sendGameAction(INITIAL);

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Mood Mirror"
        emoji="🪞"
        instructions={[
          "Select your current mood emoji in secret.",
          "Guess what mood emoji your partner selected!",
          "Earn 1 point for every accurate guess in the reveal!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            Round {state.round} of {MAX_ROUNDS}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>You: {myScore}</span>
            <span style={{ color: '#ec4899' }}>{opponentName || 'Partner'}: {theirScore}</span>
          </div>
        </div>

        {/* PICKING PHASE */}
        {state.phase === 'picking' && (
          <div>
            {/* Step 1: Select My Mood */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#7c3aed', marginBottom: '0.6rem', fontFamily: 'var(--font-cute)', textAlign: 'center' }}>
                1️⃣ How are you feeling right now?
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem' }}>
                {MOODS.map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMyMood(idx)}
                    disabled={myMood !== null}
                    style={{
                      background: myMood === idx ? '#f3e8ff' : '#ffffff',
                      border: myMood === idx ? '2.5px solid #7c3aed' : '1.5px solid #ddd6fe',
                      borderRadius: '14px',
                      padding: '0.8rem 0.4rem',
                      textAlign: 'center',
                      cursor: myMood === null ? 'pointer' : 'default'
                    }}
                  >
                    <div style={{ fontSize: '1.8rem' }}>{m.emoji}</div>
                    <div style={{ fontSize: '0.78rem', color: '#1e1b4b', fontWeight: 600 }}>{m.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Guess Partner's Mood */}
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#ec4899', marginBottom: '0.6rem', fontFamily: 'var(--font-cute)', textAlign: 'center' }}>
                2️⃣ Guess {opponentName || 'Partner'}'s mood:
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem' }}>
                {MOODS.map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMyGuess(idx)}
                    disabled={myGuess !== null}
                    style={{
                      background: myGuess === idx ? '#fce7f3' : '#ffffff',
                      border: myGuess === idx ? '2.5px solid #ec4899' : '1.5px solid #ddd6fe',
                      borderRadius: '14px',
                      padding: '0.8rem 0.4rem',
                      textAlign: 'center',
                      cursor: myGuess === null ? 'pointer' : 'default'
                    }}
                  >
                    <div style={{ fontSize: '1.8rem' }}>{m.emoji}</div>
                    <div style={{ fontSize: '0.78rem', color: '#1e1b4b', fontWeight: 600 }}>{m.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RESULT PHASE */}
        {state.phase === 'result' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              background: '#ffffff',
              padding: '1.2rem',
              borderRadius: '18px',
              border: '2px solid #ddd6fe',
              marginBottom: '1.5rem'
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 700, marginBottom: '0.3rem' }}>Your Actual Mood</div>
                <div style={{ fontSize: '2.5rem' }}>{MOODS[myMood!].emoji}</div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Guessed by partner: {MOODS[theirGuess!].emoji}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: '#ec4899', fontWeight: 700, marginBottom: '0.3rem' }}>{opponentName || 'Partner'}'s Mood</div>
                <div style={{ fontSize: '2.5rem' }}>{MOODS[theirMood!].emoji}</div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Guessed by you: {MOODS[myGuess!].emoji}</div>
              </div>
            </div>

            {role === 'host' && (
              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
                <button onClick={nextRound} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem' }}>
                  Next Round ➔
                </button>
                <button onClick={resetAll} className="btn-cute btn-cute-secondary" style={{ padding: '0.65rem 1rem' }}>
                  <RefreshCw size={16} /> Reset
                </button>
              </div>
            )}
            {role === 'guest' && (
              <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Waiting for host to continue...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
