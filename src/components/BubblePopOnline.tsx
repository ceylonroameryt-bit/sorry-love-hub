import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface BubbleState {
  bubbles: number[]; // 1–16 shuffled
  poppedBy: Record<number, 'host' | 'guest'>;
  targetNumber: number; // starts at 1, goes up to 16
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
  const { role, sendGameAction, gameState, selectGame, opponentName, playerName } = useGamePeer();
  const state: BubbleState = gameState ?? INITIAL;
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Host initializes bubbles
  useEffect(() => {
    if (role === 'host' && state.phase === 'init') {
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
  }, [role, state.phase, sendGameAction]);

  const handleBubbleClick = (num: number) => {
    if (state.phase !== 'playing' || num !== state.targetNumber) return;
    if (state.poppedBy[num]) return; // already popped

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

  const restartGame = () => {
    if (role === 'host') {
      const nums = Array.from({ length: 16 }, (_, i) => i + 1)
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);

      sendGameAction({
        ...INITIAL,
        bubbles: nums,
        phase: 'playing',
      });
    } else {
      sendGameAction(INITIAL);
    }
  };

  return (
    <div className="container-cute" style={{ maxWidth: '650px' }}>
      <div className="card-cute" style={{ background: '#fcf5ff', border: '1.5px solid #e9d5ff' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Bubble Pop Duel 🫧</span>
        </div>

        {/* Scores */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
          background: '#f3e8ff', padding: '0.8rem', borderRadius: '15px',
          textAlign: 'center', marginBottom: '1.5rem', border: '2px solid #1e1b4b'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#7c3aed' }}>{playerName} Score</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e1b4b' }}>
              {role === 'host' ? state.hostScore : state.guestScore}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#7c3aed' }}>{opponentName || 'Partner'} Score</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e1b4b' }}>
              {role === 'host' ? state.guestScore : state.hostScore}
            </div>
          </div>
        </div>

        {/* Status */}
        <div style={{ textAlign: 'center', marginBottom: '1rem', height: '2.5rem' }}>
          {state.phase === 'ended' ? (
            <span className="font-cute" style={{ color: '#7c3aed', fontSize: '1.2rem' }}>
              Finished! {state.hostScore === state.guestScore ? "It's a tie! 🤝" : state.hostScore > state.guestScore ? (role === 'host' ? 'You won! 🎉🏆' : 'Partner won! 💔') : (role === 'guest' ? 'You won! 🎉🏆' : 'Partner won! 💔')}
            </span>
          ) : state.phase === 'playing' ? (
            <span className="font-cute" style={{ color: '#7c3aed', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              Find & Pop Bubble: <strong style={{ fontSize: '1.6rem', background: '#ede9fe', padding: '2px 10px', borderRadius: '8px', border: '1.5px solid #1e1b4b' }}>{state.targetNumber}</strong>
            </span>
          ) : (
            <span className="font-cute" style={{ color: '#9ca3af', fontSize: '1rem' }}>
              Initializing bubbles...
            </span>
          )}
        </div>

        {/* Grid */}
        {state.bubbles.length > 0 ? (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
            maxWidth: '360px', margin: '0 auto 1.5rem'
          }}>
            {state.bubbles.map((num) => {
              const popper = state.poppedBy[num];
              const isPopped = !!popper;
              const isTarget = num === state.targetNumber;

              let bg = '#fff';
              let color = '#1e1b4b';
              let shadow = '3px 3px 0px #1e1b4b';

              if (isPopped) {
                bg = popper === 'host' ? '#c084fc' : '#f472b6'; // Purple or Pink
                color = '#fff';
                shadow = 'none';
              } else if (isTarget) {
                bg = '#fef08a'; // yellow highlight
              }

              return (
                <button
                  key={num}
                  disabled={isPopped || state.phase !== 'playing'}
                  onClick={() => handleBubbleClick(num)}
                  style={{
                    aspectRatio: '1', fontSize: '1.5rem', fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: bg, color: color,
                    border: '3px solid #1e1b4b', borderRadius: '50%',
                    boxShadow: shadow,
                    cursor: isPopped || state.phase !== 'playing' ? 'default' : 'pointer',
                    transform: isTarget && state.phase === 'playing' ? 'scale(1.05)' : 'none',
                    transition: 'all 0.1s ease',
                    position: 'relative',
                  }}
                >
                  {isPopped ? (popper === 'host' ? '💜' : '💖') : num}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Action button */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {state.phase === 'ended' && (
            <button onClick={restartGame} className="btn-cute btn-cute-primary">
              <RefreshCw size={16} /> Play Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
