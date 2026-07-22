import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw, Zap } from 'lucide-react';
import { GameHeader } from './GameHeader';

interface ReactionState {
  targetIndex: number;
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
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INITIAL);
    }
  }, [role, gameState, sendGameAction]);

  const state: ReactionState = gameState ?? INITIAL;
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const targetTimerRef = useRef<number | null>(null);

  // Host handles generating targets
  useEffect(() => {
    if (role === 'host' && state.phase === 'playing' && state.targetIndex === -1) {
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

  const startRace = () => {
    sendGameAction({
      ...INITIAL,
      phase: 'playing',
    });
  };

  const resetAll = () => sendGameAction(INITIAL);

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Reaction Tap"
        emoji="⏱️"
        instructions={[
          "Watch the 4x4 grid closely.",
          "As soon as a heart 💖 flashes on a cell, tap it immediately!",
          "First player to reach 10 quick taps wins the race!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            First to {WINNING_SCORE} Points
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>Host: {state.hostScore}</span>
            <span style={{ color: '#ec4899' }}>Guest: {state.guestScore}</span>
          </div>
        </div>

        {/* IDLE PHASE */}
        {state.phase === 'idle' && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem', animation: 'float 2.5s ease infinite' }}>⏱️⚡</div>
            <h3 className="heading-lg" style={{ fontSize: '1.4rem', color: '#ca8a04', marginBottom: '0.6rem' }}>
              Ready for Fast Finger Tapping?
            </h3>
            {role === 'host' ? (
              <button onClick={startRace} className="btn-cute btn-cute-primary" style={{ padding: '0.75rem 1.8rem', background: '#ca8a04', borderColor: '#ca8a04' }}>
                <Zap size={18} /> Start Race!
              </button>
            ) : (
              <p style={{ color: '#6b7280' }}>Waiting for {opponentName || 'host'} to start...</p>
            )}
          </div>
        )}

        {/* PLAYING PHASE */}
        {state.phase === 'playing' && (
          <div className="game-board-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1.5rem' }}>
            {Array.from({ length: GRID_SIZE }).map((_, idx) => {
              const isTarget = state.targetIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  disabled={!isTarget}
                  style={{
                    aspectRatio: '1 / 1',
                    background: isTarget ? '#fef9c3' : '#ffffff',
                    border: isTarget ? '2.5px solid #ca8a04' : '1.5px solid #ddd6fe',
                    borderRadius: '16px',
                    fontSize: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isTarget ? 'pointer' : 'default',
                    boxShadow: isTarget ? '0 0 15px rgba(202,138,4,0.4)' : 'none'
                  }}
                >
                  {isTarget ? '💖' : ''}
                </button>
              );
            })}
          </div>
        )}

        {/* ENDED PHASE */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <h3 style={{ fontSize: '1.4rem', color: (role === 'host' && state.hostScore >= WINNING_SCORE) || (role === 'guest' && state.guestScore >= WINNING_SCORE) ? '#059669' : '#dc2626', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
              {(role === 'host' && state.hostScore >= WINNING_SCORE) || (role === 'guest' && state.guestScore >= WINNING_SCORE) ? '🎉 Reaction Tap Champion!' : `💔 ${opponentName || 'Partner'} Won!`}
            </h3>
            {role === 'host' && (
              <button onClick={resetAll} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem', background: '#ca8a04', borderColor: '#ca8a04' }}>
                <RefreshCw size={16} /> Play Again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
