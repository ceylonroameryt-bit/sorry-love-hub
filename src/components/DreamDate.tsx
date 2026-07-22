import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw } from 'lucide-react';
import { GameHeader } from './GameHeader';

const CATEGORIES = [
  {
    label: '📍 Location',
    emoji: '📍',
    options: ['Beach Sunset 🌅', 'Cozy Café ☕', 'Forest Picnic 🌲', 'City Rooftop 🌃', 'Stargazing Field 🌌', 'Amusement Park 🎡'],
  },
  {
    label: '💃 Activity',
    emoji: '💃',
    options: ['Dancing 💃', 'Cooking Together 🍳', 'Movie Night 🎬', 'Long Walk 🚶‍♀️', 'Game Night 🎮', 'Swimming 🏊'],
  },
  {
    label: '🍰 Food',
    emoji: '🍰',
    options: ['Italian Pasta 🍝', 'Sushi 🍣', 'Burgers 🍔', 'Ice Cream 🍦', 'Tacos 🌮', 'Ramen 🍜'],
  },
  {
    label: '✨ Vibe',
    emoji: '✨',
    options: ['Romantic 🌹', 'Fun & Silly 🤪', 'Adventurous 🗺️', 'Calm & Peaceful 🕊️', 'Surprising 🎉', 'Nostalgic 🪅'],
  },
];

interface DreamDateState {
  phase: 'building' | 'result';
  hostChoices: (number | null)[];
  guestChoices: (number | null)[];
  round: number;
  hostScore: number;
  guestScore: number;
}

const INITIAL: DreamDateState = {
  phase: 'building',
  hostChoices: [null, null, null, null],
  guestChoices: [null, null, null, null],
  round: 1, hostScore: 0, guestScore: 0,
};

const MAX_ROUNDS = 3;

export const DreamDate: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INITIAL);
    }
  }, [role, gameState, sendGameAction]);

  const state: DreamDateState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const myChoices = role === 'host' ? state.hostChoices : state.guestChoices;
  const theirChoices = role === 'host' ? state.guestChoices : state.hostChoices;
  const myScore = role === 'host' ? state.hostScore : state.guestScore;
  const allPicked = myChoices.every(c => c !== null);

  const selectChoice = (catIdx: number, optIdx: number) => {
    const s = stateRef.current;
    const oldList = role === 'host' ? [...s.hostChoices] : [...s.guestChoices];
    oldList[catIdx] = optIdx;

    const nextState = role === 'host'
      ? { ...s, hostChoices: oldList }
      : { ...s, guestChoices: oldList };

    if (nextState.hostChoices.every(c => c !== null) && nextState.guestChoices.every(c => c !== null)) {
      let matches = 0;
      for (let i = 0; i < 4; i++) {
        if (nextState.hostChoices[i] === nextState.guestChoices[i]) matches++;
      }
      nextState.phase = 'result';
      nextState.hostScore = s.hostScore + matches;
      nextState.guestScore = s.guestScore + matches;
    }
    sendGameAction(nextState);
  };

  const nextRound = () => {
    if (role !== 'host') return;
    if (state.round >= MAX_ROUNDS) {
      sendGameAction(INITIAL);
    } else {
      sendGameAction({
        ...state,
        phase: 'building',
        hostChoices: [null, null, null, null],
        guestChoices: [null, null, null, null],
        round: state.round + 1,
      });
    }
  };

  const resetAll = () => sendGameAction(INITIAL);

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Dream Date"
        emoji="🌅"
        instructions={[
          "Select your favorite choice across 4 categories (Location, Activity, Food, Vibe).",
          "When both partners complete their date choices, check your date compatibility!",
          "Earn points for every date preference you match on!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            Date Plan {state.round} of {MAX_ROUNDS}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#db2777' }}>Matches Score: {myScore}</span>
          </div>
        </div>

        {/* BUILDING PHASE */}
        {state.phase === 'building' && (
          <div>
            <div style={{ display: 'grid', gap: '1.2rem', marginBottom: '1.5rem' }}>
              {CATEGORIES.map((cat, catIdx) => {
                const picked = myChoices[catIdx];
                return (
                  <div key={catIdx} style={{ background: '#ffffff', border: '1.5px solid #ddd6fe', borderRadius: '16px', padding: '1rem' }}>
                    <div style={{ fontWeight: 700, color: '#7c3aed', fontSize: '0.95rem', marginBottom: '0.6rem' }}>
                      {cat.label}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                      {cat.options.map((opt, optIdx) => (
                        <button
                          key={optIdx}
                          onClick={() => selectChoice(catIdx, optIdx)}
                          style={{
                            background: picked === optIdx ? '#f3e8ff' : '#ffffff',
                            border: picked === optIdx ? '2px solid #7c3aed' : '1px solid #e9d5ff',
                            color: picked === optIdx ? '#6d28d9' : '#1e1b4b',
                            borderRadius: '12px',
                            padding: '0.6rem 0.3rem',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            justifyContent: 'center',
                            fontFamily: 'var(--font-cute)'
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: 'center', color: allPicked ? '#059669' : '#6b7280', fontSize: '0.9rem', fontWeight: 600 }}>
              {allPicked
                ? `✅ Date plan locked! Waiting for ${opponentName || 'partner'} to finish... ⏳`
                : 'Select one option from each category above!'}
            </div>
          </div>
        )}

        {/* RESULT PHASE */}
        {state.phase === 'result' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <h3 style={{ fontSize: '1.4rem', color: '#db2777', fontFamily: 'var(--font-world)', marginBottom: '1.2rem' }}>
              Dream Date Comparison 🌅
            </h3>

            <div style={{ display: 'grid', gap: '0.8rem', marginBottom: '1.5rem' }}>
              {CATEGORIES.map((cat, catIdx) => {
                const myOpt = cat.options[myChoices[catIdx]!];
                const theirOpt = cat.options[theirChoices[catIdx]!];
                const matched = myChoices[catIdx] === theirChoices[catIdx];

                return (
                  <div
                    key={catIdx}
                    style={{
                      background: matched ? '#dcfce7' : '#ffffff',
                      border: `1.5px solid ${matched ? '#22c55e' : '#ddd6fe'}`,
                      borderRadius: '16px',
                      padding: '0.8rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}
                  >
                    <span style={{ fontWeight: 700, color: '#1e1b4b', fontSize: '0.88rem' }}>{cat.label}</span>
                    <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                      You: <strong style={{ color: '#7c3aed' }}>{myOpt}</strong> | Partner: <strong style={{ color: '#ec4899' }}>{theirOpt}</strong>
                    </div>
                    <span style={{ fontWeight: 700, color: matched ? '#15803d' : '#9ca3af', fontSize: '0.85rem' }}>
                      {matched ? '✨ Match!' : 'Different'}
                    </span>
                  </div>
                );
              })}
            </div>

            {role === 'host' && (
              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
                <button onClick={nextRound} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem', background: '#db2777', borderColor: '#db2777' }}>
                  Next Date Plan ➔
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
