import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw, Zap } from 'lucide-react';
import { GameHeader } from './GameHeader';

interface RaceState {
  phase: 'idle' | 'waiting' | 'active' | 'result';
  round: number;
  triggerTime: number;
  hostClickTime: number | null;
  guestClickTime: number | null;
  hostScore: number;
  guestScore: number;
}

const INITIAL: RaceState = {
  phase: 'idle',
  round: 1,
  triggerTime: 0,
  hostClickTime: null,
  guestClickTime: null,
  hostScore: 0,
  guestScore: 0,
};

const MAX_ROUNDS = 5;

export const ReactionRace: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INITIAL);
    }
  }, [role, gameState, sendGameAction]);

  const state: RaceState = gameState ?? INITIAL;

  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const triggerTimeoutRef = useRef<number | null>(null);

  const startRound = () => {
    if (role !== 'host') return;
    const freshState = stateRef.current;

    sendGameAction({
      ...freshState,
      phase: 'waiting',
      triggerTime: 0,
      hostClickTime: null,
      guestClickTime: null,
    });

    const randomDelay = 2000 + Math.random() * 3500;
    if (triggerTimeoutRef.current) clearTimeout(triggerTimeoutRef.current);

    triggerTimeoutRef.current = window.setTimeout(() => {
      const s = stateRef.current;
      sendGameAction({
        ...s,
        phase: 'active',
        triggerTime: Date.now(),
        hostClickTime: null,
        guestClickTime: null,
      });
    }, randomDelay);
  };

  const handleTap = () => {
    const s = stateRef.current;
    if (s.phase === 'waiting') {
      // False start penalty
      const isHost = role === 'host';
      sendGameAction({
        ...s,
        phase: 'result',
        hostClickTime: isHost ? 9999 : s.hostClickTime,
        guestClickTime: !isHost ? 9999 : s.guestClickTime,
        hostScore: !isHost ? s.hostScore + 1 : s.hostScore,
        guestScore: isHost ? s.guestScore + 1 : s.guestScore,
      });
      return;
    }

    if (s.phase !== 'active') return;

    const reaction = Date.now() - s.triggerTime;
    const isHost = role === 'host';
    const newHostClick = isHost ? reaction : s.hostClickTime;
    const newGuestClick = !isHost ? reaction : s.guestClickTime;

    let nextHostScore = s.hostScore;
    let nextGuestScore = s.guestScore;
    let newPhase: RaceState['phase'] = 'active';

    if (newHostClick !== null && newGuestClick !== null) {
      newPhase = 'result';
      if (newHostClick < newGuestClick) nextHostScore += 1;
      else if (newGuestClick < newHostClick) nextGuestScore += 1;
    }

    sendGameAction({
      ...s,
      phase: newPhase,
      hostClickTime: newHostClick,
      guestClickTime: newGuestClick,
      hostScore: nextHostScore,
      guestScore: nextGuestScore,
    });
  };

  const resetAll = () => sendGameAction(INITIAL);

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Reaction Race"
        emoji="⚡"
        instructions={[
          "Host starts the round. Wait patiently while the box says 'WAIT...'",
          "As soon as the box turns GREEN 🟩, TAP AS FAST AS YOU CAN!",
          "Tapping before the green light gives a false start penalty!",
          "Fastest reaction time (ms) wins the round point!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            Round {state.round} of {MAX_ROUNDS}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>Host: {state.hostScore}</span>
            <span style={{ color: '#ec4899' }}>Guest: {state.guestScore}</span>
          </div>
        </div>

        {/* Reaction Box */}
        <div
          onClick={handleTap}
          style={{
            height: '240px',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: state.phase === 'active' ? '#22c55e' : state.phase === 'waiting' ? '#ef4444' : '#ffffff',
            border: '2.5px solid #ddd6fe',
            color: state.phase === 'active' || state.phase === 'waiting' ? '#ffffff' : '#1e1b4b',
            transition: 'background 0.15s ease',
            marginBottom: '1.5rem',
            userSelect: 'none'
          }}
        >
          {state.phase === 'idle' && (
            <div style={{ textAlign: 'center' }}>
              <Zap size={40} color="#7c3aed" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-world)' }}>
                {role === 'host' ? 'Tap Below to Start Round!' : `Waiting for ${opponentName || 'host'}...`}
              </div>
            </div>
          )}

          {state.phase === 'waiting' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-world)' }}>WAIT FOR GREEN...</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Don't tap yet!</div>
            </div>
          )}

          {state.phase === 'active' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'var(--font-world)' }}>TAP NOW! ⚡</div>
            </div>
          )}

          {state.phase === 'result' && (
            <div style={{ textAlign: 'center', color: '#1e1b4b' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-world)', marginBottom: '0.5rem' }}>
                Round Result:
              </div>
              <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                👑 Host: <strong>{state.hostClickTime === 9999 ? 'False Start ❌' : `${state.hostClickTime}ms`}</strong> | 🌸 Guest: <strong>{state.guestClickTime === 9999 ? 'False Start ❌' : `${state.guestClickTime}ms`}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ textAlign: 'center' }}>
          {role === 'host' && (state.phase === 'idle' || state.phase === 'result') && (
            <button onClick={startRound} className="btn-cute btn-cute-primary" style={{ padding: '0.7rem 1.8rem', background: '#059669', borderColor: '#059669' }}>
              <Zap size={18} /> {state.phase === 'idle' ? 'Start Round' : 'Next Round'}
            </button>
          )}

          {role === 'host' && state.phase === 'result' && (
            <button onClick={resetAll} className="btn-cute btn-cute-secondary" style={{ marginLeft: '0.8rem', padding: '0.7rem 1rem' }}>
              <RefreshCw size={16} /> Reset Scores
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
