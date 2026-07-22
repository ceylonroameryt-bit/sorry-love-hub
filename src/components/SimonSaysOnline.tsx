import React, { useState, useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw } from 'lucide-react';
import { GameHeader } from './GameHeader';

interface SimonState {
  sequence: number[];
  turn: 'host' | 'guest';
  phase: 'watching' | 'playing' | 'adding' | 'ended';
  currentStreak: number;
  loser: 'host' | 'guest' | null;
  hostScore: number;
  guestScore: number;
}

const INITIAL: SimonState = {
  sequence: [],
  turn: 'host',
  phase: 'watching',
  currentStreak: 0,
  loser: null,
  hostScore: 0,
  guestScore: 0,
};

const PADS = [
  { id: 0, color: '#ef4444', activeColor: '#fca5a5', name: 'Red 🔴' },
  { id: 1, color: '#3b82f6', activeColor: '#93c5fd', name: 'Blue 🔵' },
  { id: 2, color: '#10b981', activeColor: '#6ee7b7', name: 'Green 🟢' },
  { id: 3, color: '#f59e0b', activeColor: '#fde047', name: 'Yellow 🟡' },
];

export const SimonSaysOnline: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();
  const state: SimonState = gameState ?? INITIAL;
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const [activePad, setActivePad] = useState<number | null>(null);
  const [localInputIdx, setLocalInputIdx] = useState(0);

  const isMyTurn = state.turn === role && state.phase !== 'ended';

  // Host initializes initial sequence
  useEffect(() => {
    if (role === 'host' && (state.sequence.length === 0 || !state.sequence)) {
      const firstPad = Math.floor(Math.random() * 4);
      sendGameAction({
        ...INITIAL,
        sequence: [firstPad],
        phase: 'watching',
      });
    }
  }, [role, state.sequence, sendGameAction]);

  // Flash sequence animation
  useEffect(() => {
    if (state.sequence.length > 0 && state.phase === 'watching') {
      let idx = 0;
      setLocalInputIdx(0);

      const interval = setInterval(() => {
        if (idx < state.sequence.length) {
          const pad = state.sequence[idx];
          setActivePad(pad);
          setTimeout(() => setActivePad(null), 400);
          idx++;
        } else {
          clearInterval(interval);
          if (role === 'host') {
            sendGameAction({
              ...stateRef.current,
              phase: 'playing',
            });
          }
        }
      }, 700);

      return () => clearInterval(interval);
    }
  }, [state.sequence, state.phase, role, sendGameAction]);

  const handlePadClick = (padId: number) => {
    if (!isMyTurn || state.phase !== 'playing') return;

    setActivePad(padId);
    setTimeout(() => setActivePad(null), 250);

    const expected = state.sequence[localInputIdx];

    if (padId !== expected) {
      // Failed sequence
      const nextHostScore = role === 'guest' ? state.hostScore + 1 : state.hostScore;
      const nextGuestScore = role === 'host' ? state.guestScore + 1 : state.guestScore;

      sendGameAction({
        ...state,
        phase: 'ended',
        loser: role,
        hostScore: nextHostScore,
        guestScore: nextGuestScore,
      });
      return;
    }

    const nextLocalIdx = localInputIdx + 1;
    if (nextLocalIdx >= state.sequence.length) {
      // Completed current pattern, go to adding phase
      sendGameAction({
        ...state,
        phase: 'adding',
        currentStreak: state.sequence.length,
      });
    } else {
      setLocalInputIdx(nextLocalIdx);
    }
  };

  const handleAddPad = (padId: number) => {
    if (!isMyTurn || state.phase !== 'adding') return;

    const nextSequence = [...state.sequence, padId];
    const nextTurn = role === 'host' ? 'guest' : 'host';

    sendGameAction({
      ...state,
      sequence: nextSequence,
      turn: nextTurn,
      phase: 'watching',
    });
  };

  const resetGame = () => {
    const firstPad = Math.floor(Math.random() * 4);
    sendGameAction({
      ...INITIAL,
      sequence: [firstPad],
      phase: 'watching',
      hostScore: state.hostScore,
      guestScore: state.guestScore,
    });
  };

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Simon Says"
        emoji="🔴🔵"
        instructions={[
          "Watch the flashing pattern sequence carefully.",
          "Repeat the pattern by tapping the colored pads in exact order.",
          "Add a new pad to the end of the sequence for your partner!",
          "First player to make a mistake loses the round!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: isMyTurn ? '#dcfce7' : '#ede9fe', color: isMyTurn ? '#15803d' : '#6d28d9' }}>
            {state.phase === 'watching' ? '👀 WATCH PATTERN' : state.phase === 'adding' ? '➕ ADD NEW PAD' : isMyTurn ? '✨ YOUR TURN' : `⏳ ${opponentName || 'Partner'}'s Turn`}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>Host: {state.hostScore}</span>
            <span style={{ color: '#ec4899' }}>Guest: {state.guestScore}</span>
          </div>
        </div>

        {/* 2x2 Pad Grid */}
        <div className="game-board-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem', marginBottom: '1.5rem' }}>
          {PADS.map(pad => {
            const isActive = activePad === pad.id;
            return (
              <button
                key={pad.id}
                onClick={() => (state.phase === 'adding' ? handleAddPad(pad.id) : handlePadClick(pad.id))}
                disabled={!isMyTurn || state.phase === 'watching'}
                style={{
                  background: isActive ? pad.activeColor : pad.color,
                  border: '3px solid #ffffff',
                  borderRadius: '24px',
                  aspectRatio: '1 / 1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  color: '#ffffff',
                  fontWeight: 900,
                  cursor: isMyTurn && state.phase !== 'watching' ? 'pointer' : 'default',
                  transform: isActive ? 'scale(0.96)' : 'none',
                  transition: 'all 0.1s ease',
                  boxShadow: isActive ? `0 0 20px ${pad.color}` : '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                {pad.name}
              </button>
            );
          })}
        </div>

        {/* Ended Banner */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.4rem', color: state.loser !== role ? '#059669' : '#dc2626', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
              {state.loser !== role ? '🎉 Pattern Champion!' : `💔 ${opponentName || 'Partner'} Won!`}
            </h3>
            {role === 'host' && (
              <button onClick={resetGame} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem' }}>
                <RefreshCw size={16} /> Play Next Round
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
