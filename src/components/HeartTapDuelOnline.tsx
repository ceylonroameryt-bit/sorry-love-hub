import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw, Zap, Heart } from 'lucide-react';
import { GameHeader } from './GameHeader';

interface TapState {
  pullPosition: number;
  winner: 'host' | 'guest' | null;
  phase: 'ready' | 'playing' | 'ended';
  hostScore: number;
  guestScore: number;
}

const INITIAL: TapState = {
  pullPosition: 0,
  winner: null,
  phase: 'ready',
  hostScore: 0,
  guestScore: 0,
};

export const HeartTapDuelOnline: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INITIAL);
    }
  }, [role, gameState, sendGameAction]);

  const state: TapState = gameState ?? INITIAL;
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const handleTap = () => {
    if (state.phase !== 'playing' || state.winner) return;

    const pullStep = 2.5;
    let nextPos = state.pullPosition + (role === 'host' ? pullStep : -pullStep);

    let currentWinner: 'host' | 'guest' | null = null;
    let nextPhase: 'ready' | 'playing' | 'ended' = state.phase;
    let nextHostScore = state.hostScore;
    let nextGuestScore = state.guestScore;

    if (nextPos >= 40) {
      nextPos = 40;
      currentWinner = 'host';
      nextPhase = 'ended';
      nextHostScore++;
    } else if (nextPos <= -40) {
      nextPos = -40;
      currentWinner = 'guest';
      nextPhase = 'ended';
      nextGuestScore++;
    }

    sendGameAction({
      ...state,
      pullPosition: nextPos,
      winner: currentWinner,
      phase: nextPhase,
      hostScore: nextHostScore,
      guestScore: nextGuestScore,
    });
  };

  const startMatch = () => {
    sendGameAction({
      ...state,
      pullPosition: 0,
      winner: null,
      phase: 'playing',
    });
  };


  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Heart Tap Tug-of-War"
        emoji="💖⚡"
        instructions={[
          "Mash your tap button as fast as possible!",
          "Each tap pulls the heart towards your side of the tug-of-war meter.",
          "First player to pull the heart completely to their side wins!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: state.phase === 'playing' ? '#dcfce7' : '#ede9fe', color: state.phase === 'playing' ? '#15803d' : '#6d28d9' }}>
            {state.phase === 'playing' ? '⚡ MASH NOW!' : 'Ready'}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>Host: {state.hostScore}</span>
            <span style={{ color: '#ec4899' }}>Guest: {state.guestScore}</span>
          </div>
        </div>

        {/* Tug-of-War Bar */}
        <div style={{
          position: 'relative',
          height: '40px',
          background: '#ffffff',
          border: '2px solid #ddd6fe',
          borderRadius: '50px',
          overflow: 'hidden',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(124,58,237,0.08)'
        }}>
          <div style={{
            position: 'absolute',
            left: `${50 + state.pullPosition}%`,
            transform: 'translateX(-50%)',
            transition: 'left 0.05s ease',
            fontSize: '1.8rem',
            lineHeight: 1
          }}>
            💖
          </div>
        </div>

        {/* Action Button */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          {state.phase === 'ready' && role === 'host' && (
            <button onClick={startMatch} className="btn-cute btn-cute-primary" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem', background: '#db2777', borderColor: '#db2777' }}>
              <Zap size={20} /> Start Tug-of-War!
            </button>
          )}

          {state.phase === 'playing' && (
            <button
              onClick={handleTap}
              className="btn-cute btn-cute-primary"
              style={{
                width: '100%',
                padding: '1.8rem',
                fontSize: '1.4rem',
                justifyContent: 'center',
                background: role === 'host' ? '#7c3aed' : '#ec4899',
                borderColor: role === 'host' ? '#7c3aed' : '#ec4899'
              }}
            >
              <Heart size={28} fill="#ffffff" /> TAP FAST! TAP FAST!
            </button>
          )}
        </div>

        {/* Winner Banner */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.5rem', color: state.winner === role ? '#059669' : '#dc2626', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
              {state.winner === role ? '🎉 Tug-of-War Champion!' : `💔 ${opponentName || 'Partner'} Won!`}
            </h3>
            {role === 'host' && (
              <button onClick={startMatch} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem' }}>
                <RefreshCw size={16} /> Play Next Round
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
