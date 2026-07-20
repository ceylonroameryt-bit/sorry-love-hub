import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, Zap } from 'lucide-react';

interface ReactionState {
  targetIndex: number; // 0-15 representing grid index, or -1 for idle
  hostScore: number;
  guestScore: number;
  phase: 'idle' | 'playing' | 'ended';
  round: number;
}

const INITIAL: ReactionState = {
  targetIndex: -1,
  hostScore: 0,
  guestScore: 0,
  phase: 'idle',
  round: 1,
};

const GRID_SIZE = 16;
const WINNING_SCORE = 10;

export const ReactionTapOnline: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName, playerName } = useGamePeer();
  const state: ReactionState = gameState ?? INITIAL;
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const targetTimerRef = useRef<number | null>(null);

  // Host handles generating targets
  useEffect(() => {
    if (role === 'host' && state.phase === 'playing' && state.targetIndex === -1) {
      // Spawn new target after a random delay (800ms - 2500ms)
      const delay = Math.random() * 1700 + 800;
      targetTimerRef.current = window.setTimeout(() => {
        const nextTarget = Math.floor(Math.random() * GRID_SIZE);
        sendGameAction({
          ...stateRef.current,
          targetIndex: nextTarget,
        });
      }, delay);
    }

    return () => {
      if (targetTimerRef.current) {
        clearTimeout(targetTimerRef.current);
      }
    };
  }, [role, state.phase, state.targetIndex, sendGameAction]);

  const handleCellClick = (idx: number) => {
    if (state.phase !== 'playing' || state.targetIndex !== idx) return;

    // Popped! Assign score
    let nextHostScore = state.hostScore;
    let nextGuestScore = state.guestScore;

    if (role === 'host') nextHostScore++;
    else nextGuestScore++;

    const isEnded = nextHostScore >= WINNING_SCORE || nextGuestScore >= WINNING_SCORE;

    sendGameAction({
      ...state,
      targetIndex: -1,
      hostScore: nextHostScore,
      guestScore: nextGuestScore,
      phase: isEnded ? 'ended' : 'playing',
    });
  };

  const startMatch = () => {
    sendGameAction({
      ...INITIAL,
      phase: 'playing',
    });
  };

  const restartGame = () => {
    sendGameAction(INITIAL);
  };

  return (
    <div className="container-cute" style={{ maxWidth: '650px' }}>
      <div className="card-cute" style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Reaction Tap Duel ⚡</span>
        </div>

        {/* Scores */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
          background: '#fef3c7', padding: '0.8rem', borderRadius: '15px',
          textAlign: 'center', marginBottom: '1.5rem', border: '2px solid #1e1b4b'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#b45309' }}>{playerName} Score</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e1b4b' }}>
              {role === 'host' ? state.hostScore : state.guestScore}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#b45309' }}>{opponentName || 'Partner'} Score</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e1b4b' }}>
              {role === 'host' ? state.guestScore : state.hostScore}
            </div>
          </div>
        </div>

        {/* Status */}
        <div style={{ textAlign: 'center', marginBottom: '1.2rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {state.phase === 'idle' && (
            <span className="font-cute" style={{ color: '#b45309', fontSize: '1.1rem' }}>
              First player to reach 10 points wins! ⚡
            </span>
          )}
          {state.phase === 'playing' && (
            <span className="font-cute animate-pulse" style={{ color: '#dc2626', fontSize: '1.15rem', fontWeight: 'bold' }}>
              {state.targetIndex === -1 ? 'Get ready...' : 'TAP THE HEART! ❤️'}
            </span>
          )}
          {state.phase === 'ended' && (
            <span className="font-cute" style={{ color: '#7c3aed', fontSize: '1.2rem' }}>
              {state.hostScore >= WINNING_SCORE ? (role === 'host' ? '👑 You won the race!' : `💔 ${opponentName || 'Partner'} won!`) : (role === 'guest' ? '👑 You won the race!' : `💔 ${opponentName || 'Partner'} won!`)}
            </span>
          )}
        </div>

        {/* Grid of targets */}
        {state.phase === 'playing' ? (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px',
            maxWidth: '320px', margin: '0 auto 1.5rem'
          }}>
            {Array.from({ length: GRID_SIZE }).map((_, idx) => {
              const isTarget = state.targetIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  disabled={!isTarget}
                  style={{
                    aspectRatio: '1', borderRadius: '15px',
                    backgroundColor: isTarget ? '#ec4899' : '#fff',
                    border: '3px solid #1e1b4b',
                    boxShadow: isTarget ? '2px 2px 0px #1e1b4b' : 'none',
                    fontSize: '2rem', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: isTarget ? 'pointer' : 'default',
                    transition: 'all 0.05s ease',
                    transform: isTarget ? 'scale(1.05)' : 'none',
                  }}
                >
                  {isTarget ? '❤️' : ''}
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
            {state.phase === 'idle' ? (
              <button onClick={startMatch} className="btn-cute btn-cute-primary" style={{ padding: '0.8rem 2.5rem' }}>
                <Zap size={16} /> Start Match!
              </button>
            ) : (
              <button onClick={restartGame} className="btn-cute btn-cute-primary" style={{ padding: '0.8rem 2.5rem' }}>
                Play Again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
