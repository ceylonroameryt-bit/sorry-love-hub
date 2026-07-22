import React, { useEffect } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw, Flame, Snowflake } from 'lucide-react';
import { GameHeader } from './GameHeader';
import { HOT_OR_NOT_TOPICS, type HotOrNotTopic } from '../data/questions';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TOTAL_ROUNDS = 8;

interface HotOrNotState {
  phase: 'playing' | 'round_end' | 'ended';
  round: number;
  topicIndex: number;
  topicOrder: number[];
  hostRating: number | null;
  guestRating: number | null;
  matches: number;
}

function makeInitial(): HotOrNotState {
  return {
    phase: 'playing',
    round: 1,
    topicIndex: 0,
    topicOrder: shuffle(HOT_OR_NOT_TOPICS.map((_, i) => i)).slice(0, TOTAL_ROUNDS),
    hostRating: null,
    guestRating: null,
    matches: 0,
  };
}

export const HotOrNot: React.FC = () => {
  const { role, sendGameAction, gameState } = useGamePeer();

  useEffect(() => {
    if (role === 'host' && (!gameState || !gameState.topicOrder)) {
      sendGameAction(makeInitial());
    }
  }, [role, gameState, sendGameAction]);

  const state: HotOrNotState = gameState ?? makeInitial();

  const topicOrder = state.topicOrder ?? HOT_OR_NOT_TOPICS.map((_, i) => i).slice(0, TOTAL_ROUNDS);
  const currentTopic: HotOrNotTopic = HOT_OR_NOT_TOPICS[topicOrder[state.topicIndex]] ?? HOT_OR_NOT_TOPICS[0];
  const myRating = role === 'host' ? state.hostRating : state.guestRating;

  const rate = (val: number) => {
    if (myRating !== null || state.phase !== 'playing') return;
    const nextState = { ...state };
    if (role === 'host') nextState.hostRating = val;
    else nextState.guestRating = val;

    if (nextState.hostRating !== null && nextState.guestRating !== null) {
      nextState.phase = 'round_end';
      const diff = Math.abs(nextState.hostRating - nextState.guestRating);
      if (diff <= 2) nextState.matches += 1;
    }

    sendGameAction(nextState);
  };

  const nextTopic = () => {
    if (role !== 'host') return;
    const nextIdx = state.topicIndex + 1;
    if (nextIdx >= TOTAL_ROUNDS) {
      sendGameAction({ ...state, phase: 'ended' });
    } else {
      sendGameAction({
        ...state,
        phase: 'playing',
        round: state.round + 1,
        topicIndex: nextIdx,
        hostRating: null,
        guestRating: null,
      });
    }
  };

  const resetAll = () => sendGameAction(makeInitial());

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Hot or Not?"
        emoji="🔥🧊"
        instructions={[
          "Rate various topics on a scale of 1 (NOT / COLD 🧊) to 10 (HOT / FIRE 🔥).",
          "Compare your ratings with your partner!",
          "If your ratings are within 2 points of each other, it's a match!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="badge-cute" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            Topic {state.round} of {TOTAL_ROUNDS}
          </span>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#059669', fontFamily: 'var(--font-world)' }}>
            Matches: {state.matches} / {state.round - (state.phase === 'playing' ? 1 : 0)}
          </span>
        </div>

        {/* Topic Banner */}
        <div style={{
          background: '#ffffff',
          border: '2px solid #ddd6fe',
          borderRadius: '20px',
          padding: '1.5rem 1rem',
          textAlign: 'center',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 14px rgba(124,58,237,0.06)'
        }}>
          <div style={{ fontSize: '2.8rem', marginBottom: '0.4rem' }}>{currentTopic.emoji}</div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e1b4b', lineHeight: 1.4, fontFamily: 'var(--font-cute)' }}>
            {currentTopic.topic}
          </h3>
        </div>

        {/* Rating Slider 1-10 */}
        {state.phase === 'playing' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#0284c7' }}><Snowflake size={14} /> 1 (Cold / Not)</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#dc2626' }}>10 (Fire / Hot) <Flame size={14} /></span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1.2rem' }}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(num => {
                const isSelected = myRating === num;
                return (
                  <button
                    key={num}
                    onClick={() => rate(num)}
                    disabled={myRating !== null}
                    style={{
                      background: isSelected ? '#f3e8ff' : '#ffffff',
                      border: isSelected ? '2.5px solid #7c3aed' : '1.5px solid #ddd6fe',
                      color: isSelected ? '#7c3aed' : '#1e1b4b',
                      borderRadius: '12px',
                      padding: '0.75rem 0.2rem',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      cursor: myRating === null ? 'pointer' : 'default',
                      fontFamily: 'monospace'
                    }}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Round End Reveal */}
        {state.phase === 'round_end' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              background: '#ffffff',
              padding: '1.2rem',
              borderRadius: '18px',
              border: '2px solid #ddd6fe',
              marginBottom: '1.2rem'
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 700 }}>👑 Host Rating</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#7c3aed', fontFamily: 'monospace' }}>{state.hostRating} / 10</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#ec4899', fontWeight: 700 }}>🌸 Guest Rating</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ec4899', fontFamily: 'monospace' }}>{state.guestRating} / 10</div>
              </div>
            </div>

            {role === 'host' && (
              <button onClick={nextTopic} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem' }}>
                Next Topic ➔
              </button>
            )}
          </div>
        )}

        {/* Ended Phase */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <h3 style={{ fontSize: '1.4rem', color: '#059669', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
              🎉 Rated All Topics! Matched {state.matches} out of {TOTAL_ROUNDS} times!
            </h3>
            {role === 'host' && (
              <button onClick={resetAll} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem' }}>
                <RefreshCw size={16} /> Rate More Topics
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
