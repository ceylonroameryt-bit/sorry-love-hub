import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw } from 'lucide-react';
import { GameHeader } from './GameHeader';

interface BubbleState {
  bubbles: number[];
  poppedBy: Record<number, 'host' | 'guest'>;
  targetNumber: number;
  hostScore: number;
  guestScore: number;
  phase: 'init' | 'playing' | 'ended';
}

const INITIAL: BubbleState = {
  bubbles: [],
  poppedBy: {},
  targetNumber: 1,
  hostScore: 0,
  guestScore: 0,
  phase: 'init',
};

export const BubblePopOnline: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();
  const state: BubbleState = gameState ?? INITIAL;
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Host initializes bubbles
  useEffect(() => {
    if (role === 'host' && (state.phase === 'init' || !state.bubbles || state.bubbles.length === 0)) {
      const nums = Array.from({ length: 16 }, (_, i) => i + 1)
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);

      sendGameAction({
        ...INITIAL,
        bubbles: nums,
        phase: 'playing',
      });
    }
  }, [role, state.phase, state.bubbles, sendGameAction]);

  const handleBubbleClick = (num: number) => {
    if (state.phase !== 'playing' || num !== state.targetNumber || state.poppedBy[num]) return;

    const newPoppedBy = { ...state.poppedBy, [num]: role };
    const nextTarget = state.targetNumber + 1;
    const isEnded = nextTarget > 16;

    let nextHostScore = state.hostScore;
    let nextGuestScore = state.guestScore;

    if (role === 'host') nextHostScore++;
    else nextGuestScore++;

    sendGameAction({
      ...state,
      poppedBy: newPoppedBy,
      targetNumber: nextTarget,
      hostScore: nextHostScore,
      guestScore: nextGuestScore,
      phase: isEnded ? 'ended' : 'playing',
    });
  };

  const resetGame = () => {
    const nums = Array.from({ length: 16 }, (_, i) => i + 1)
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

    sendGameAction({
      ...INITIAL,
      bubbles: nums,
      phase: 'playing',
    });
  };

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Bubble Pop Duel"
        emoji="🫧"
        instructions={[
          "Race to pop numbered bubbles in ascending numerical order (1 ➔ 2 ➔ 3 ... 16).",
          "Each valid bubble popped in sequence awards 1 point.",
          "Highest score when bubble #16 is popped wins the duel!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: '#ec4899', color: '#ffffff' }}>
            🎯 Next Target Bubble: #{state.targetNumber}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>Host: {state.hostScore}</span>
            <span style={{ color: '#ec4899' }}>Guest: {state.guestScore}</span>
          </div>
        </div>

        {/* 4x4 Grid */}
        <div className="game-board-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1.5rem' }}>
          {state.bubbles.map((num) => {
            const popped = state.poppedBy[num];
            const isNextTarget = num === state.targetNumber;

            return (
              <button
                key={num}
                onClick={() => handleBubbleClick(num)}
                disabled={popped !== undefined || state.phase === 'ended'}
                style={{
                  background: popped === 'host' ? '#ede9fe' : popped === 'guest' ? '#fce7f3' : isNextTarget ? '#fef9c3' : '#ffffff',
                  border: popped === 'host' ? '2px solid #7c3aed' : popped === 'guest' ? '2px solid #ec4899' : isNextTarget ? '2.5px solid #ca8a04' : '1.5px solid #ddd6fe',
                  borderRadius: '50%',
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  aspectRatio: '1 / 1',
                  cursor: isNextTarget && !popped ? 'pointer' : 'default',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.04)',
                  fontFamily: 'monospace'
                }}
              >
                {popped ? (popped === 'host' ? '👑' : '🌸') : num}
              </button>
            );
          })}
        </div>

        {/* Ended Banner */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.4rem', color: state.hostScore === state.guestScore ? '#ca8a04' : '#059669', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
              {state.hostScore === state.guestScore ? "It's a Tie!" : (role === 'host' && state.hostScore > state.guestScore) || (role === 'guest' && state.guestScore > state.hostScore) ? '🎉 Speed Champion!' : `💔 ${opponentName || 'Partner'} Won!`}
            </h3>
            {role === 'host' && (
              <button onClick={resetGame} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem', background: '#ec4899', borderColor: '#ec4899' }}>
                <RefreshCw size={16} /> Play Next Match
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
