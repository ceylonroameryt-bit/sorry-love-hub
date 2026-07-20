import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw, Zap } from 'lucide-react';

interface TapState {
  pullPosition: number; // -40 (guest wins) to +40 (host wins)
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
  const { role, sendGameAction, gameState, selectGame, opponentName, playerName } = useGamePeer();
  const state: TapState = gameState ?? INITIAL;
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const handleTap = () => {
    if (state.phase !== 'playing' || state.winner) return;

    const pullStep = 2.5; // distance moved per tap
    let nextPos = state.pullPosition + (role === 'host' ? pullStep : -pullStep);

    // Bound check
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

  const startFight = () => {
    sendGameAction({
      ...state,
      pullPosition: 0,
      winner: null,
      phase: 'playing',
    });
  };

  const restartGame = () => {
    const s = stateRef.current;
    sendGameAction({
      ...INITIAL,
      hostScore: s.hostScore,
      guestScore: s.guestScore,
      phase: 'ready',
    });
  };

  const percentage = 50 + (state.pullPosition / 80) * 100; // convert -40..40 to 0%..100%

  return (
    <div className="container-cute" style={{ maxWidth: '650px' }}>
      <div className="card-cute" style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Heart Tap Duel ⚡</span>
        </div>

        {/* Scores */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
          background: '#fef3c7', padding: '0.8rem', borderRadius: '15px',
          textAlign: 'center', marginBottom: '1.5rem', border: '2px solid #1e1b4b'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#d97706' }}>{playerName} Score</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e1b4b' }}>
              {role === 'host' ? state.hostScore : state.guestScore}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#d97706' }}>{opponentName || 'Partner'} Score</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e1b4b' }}>
              {role === 'host' ? state.guestScore : state.hostScore}
            </div>
          </div>
        </div>

        {/* Status text */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', height: '2rem' }}>
          {state.phase === 'ready' && (
            <span className="font-cute" style={{ color: '#d97706', fontSize: '1.1rem' }}>
              Get ready to mash the heart as fast as you can! 💖
            </span>
          )}
          {state.phase === 'playing' && (
            <span className="font-cute animate-pulse" style={{ color: '#dc2626', fontSize: '1.2rem', fontWeight: 'bold' }}>
              TAP! TAP! TAP! 💥
            </span>
          )}
          {state.phase === 'ended' && (
            <span className="font-cute" style={{ color: '#7c3aed', fontSize: '1.25rem' }}>
              {state.winner === role ? '👑 You won the tug-of-war!' : `💔 ${opponentName || 'Partner'} won!`}
            </span>
          )}
        </div>

        {/* Tug of war bar */}
        <div style={{ margin: '0 auto 2rem', maxWidth: '450px' }}>
          {/* Labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px', color: '#4b5563' }}>
            <span>👈 {role === 'host' ? opponentName || 'Partner' : playerName}</span>
            <span>{role === 'host' ? playerName : opponentName || 'Partner'} 👉</span>
          </div>

          {/* Bar background */}
          <div style={{
            height: '24px', background: '#e5e7eb', border: '3px solid #1e1b4b',
            borderRadius: '12px', overflow: 'hidden', position: 'relative',
            boxShadow: '2px 2px 0px #1e1b4b'
          }}>
            {/* Center line */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '3px', background: '#1e1b4b', opacity: 0.3 }}></div>

            {/* Pull indicator bar */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: role === 'host' ? '50%' : `${percentage}%`,
              right: role === 'host' ? `${100 - percentage}%` : '50%',
              background: 'linear-gradient(90deg, #ec4899, #7c3aed)',
              transition: 'all 0.05s ease',
            }}></div>

            {/* Sliding heart pointer */}
            <div style={{
              position: 'absolute', top: '-6px', left: `${percentage}%`,
              transform: 'translateX(-50%)', fontSize: '1.6rem',
              transition: 'all 0.05s ease',
            }}>
              ❤️
            </div>
          </div>
        </div>

        {/* Action button / Mashing button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          {state.phase === 'ready' && (
            <button onClick={startFight} className="btn-cute btn-cute-primary" style={{ padding: '0.8rem 2.5rem', fontSize: '1.1rem' }}>
              <Zap size={16} /> Start Duel!
            </button>
          )}

          {state.phase === 'playing' && (
            <button
              onClick={handleTap}
              style={{
                width: '120px', height: '120px', borderRadius: '50%',
                background: 'radial-gradient(circle, #f472b6, #ec4899)',
                border: '4px solid #1e1b4b', boxShadow: '4px 4px 0px #1e1b4b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '3.5rem', cursor: 'pointer', transition: 'transform 0.05s active',
                transform: 'scale(1)',
                userSelect: 'none',
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
              onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              ❤️
            </button>
          )}

          {state.phase === 'ended' && (
            <button onClick={restartGame} className="btn-cute btn-cute-primary" style={{ padding: '0.8rem 2rem' }}>
              <RefreshCw size={16} /> Rematch
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
