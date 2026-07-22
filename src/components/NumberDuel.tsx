import React, { useEffect } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw } from 'lucide-react';
import { GameHeader } from './GameHeader';

interface DuelState {
  phase: 'betting' | 'reveal' | 'ended';
  round: number;
  target: number;
  hostPick: number | null;
  guestPick: number | null;
  hostScore: number;
  guestScore: number;
}

function generateTarget(): number {
  return Math.floor(Math.random() * 12) + 6;
}

const INITIAL: DuelState = {
  phase: 'betting',
  round: 1,
  target: generateTarget(),
  hostPick: null,
  guestPick: null,
  hostScore: 0,
  guestScore: 0,
};

const ROUNDS = 5;

export const NumberDuel: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INITIAL);
    }
  }, [role, gameState, sendGameAction]);

  const state: DuelState = gameState ?? INITIAL;
  const myPick = role === 'host' ? state.hostPick : state.guestPick;
  const theirPick = role === 'host' ? state.guestPick : state.hostPick;

  const handlePick = (num: number) => {
    if (myPick !== null || state.phase !== 'betting') return;

    const nextState = { ...state };
    if (role === 'host') nextState.hostPick = num;
    else nextState.guestPick = num;

    if (nextState.hostPick !== null && nextState.guestPick !== null) {
      const h = nextState.hostPick;
      const g = nextState.guestPick;
      const sum = h + g;

      nextState.phase = 'reveal';
      if (sum <= nextState.target) {
        if (h > g) nextState.hostScore += 1;
        else if (g > h) nextState.guestScore += 1;
      } else {
        const diffH = Math.abs(nextState.target - h);
        const diffG = Math.abs(nextState.target - g);
        if (diffH < diffG) nextState.hostScore += 1;
        else if (diffG < diffH) nextState.guestScore += 1;
      }
    }
    sendGameAction(nextState);
  };

  const nextRound = () => {
    if (role !== 'host') return;
    if (state.round >= ROUNDS) {
      sendGameAction({ ...state, phase: 'ended' });
    } else {
      sendGameAction({
        ...state,
        phase: 'betting',
        round: state.round + 1,
        target: generateTarget(),
        hostPick: null,
        guestPick: null,
      });
    }
  };

  const resetAll = () => sendGameAction(INITIAL);

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Number Duel"
        emoji="🔢"
        instructions={[
          "Secretly pick a number from 1 to 10.",
          "The sum of both choices is calculated against the Target sum.",
          "The player closest to the target without exceeding it wins the round!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            Round {state.round} of {ROUNDS}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>Host: {state.hostScore}</span>
            <span style={{ color: '#ec4899' }}>Guest: {state.guestScore}</span>
          </div>
        </div>

        {/* Target Header */}
        <div style={{
          background: '#ffffff',
          border: '2px solid #ca8a04',
          borderRadius: '18px',
          padding: '1.2rem',
          textAlign: 'center',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 12px rgba(202,138,4,0.06)'
        }}>
          <span style={{ fontSize: '0.8rem', color: '#ca8a04', fontWeight: 700, textTransform: 'uppercase' }}>TARGET SUM:</span>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ca8a04', fontFamily: 'var(--font-world)' }}>
            {state.target}
          </div>
        </div>

        {/* BETTING PHASE */}
        {state.phase === 'betting' && (
          <div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', textAlign: 'center', marginBottom: '0.8rem', fontWeight: 600 }}>
              {myPick === null ? 'Select your secret number (1–10):' : 'Your secret number is locked!'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.6rem', marginBottom: '1.5rem' }}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  onClick={() => handlePick(num)}
                  disabled={myPick !== null}
                  style={{
                    padding: '0.9rem 0.2rem',
                    borderRadius: '14px',
                    border: myPick === num ? '2.5px solid #ca8a04' : '1.5px solid #ddd6fe',
                    background: myPick === num ? '#fef9c3' : '#ffffff',
                    color: myPick === num ? '#ca8a04' : '#1e1b4b',
                    fontWeight: 700,
                    fontSize: '1.2rem',
                    cursor: myPick === null ? 'pointer' : 'default',
                    fontFamily: 'monospace'
                  }}
                >
                  {num}
                </button>
              ))}
            </div>

            <div style={{ textAlign: 'center', color: myPick !== null ? '#059669' : '#6b7280', fontSize: '0.95rem', fontWeight: 600 }}>
              {myPick !== null
                ? (theirPick !== null ? 'Both picked! Resolving...' : `Number locked! Waiting for ${opponentName || 'partner'}... ⏳`)
                : 'Pick a number above!'}
            </div>
          </div>
        )}

        {/* REVEAL PHASE */}
        {state.phase === 'reveal' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '2rem',
              background: '#ffffff',
              padding: '1.2rem',
              borderRadius: '18px',
              border: '1.5px solid #ddd6fe',
              marginBottom: '1.5rem'
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 700 }}>👑 Host Pick</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#7c3aed', fontFamily: 'monospace' }}>{state.hostPick}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#ec4899', fontWeight: 700 }}>🌸 Guest Pick</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ec4899', fontFamily: 'monospace' }}>{state.guestPick}</div>
              </div>
            </div>

            <p style={{ color: '#4b5563', fontSize: '1rem', fontWeight: 600, marginBottom: '1.2rem' }}>
              Combined Sum: <strong>{state.hostPick! + state.guestPick!}</strong> (Target: {state.target})
            </p>

            {role === 'host' && (
              <button onClick={nextRound} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem', background: '#ca8a04', borderColor: '#ca8a04' }}>
                Next Round ➔
              </button>
            )}
            {role === 'guest' && (
              <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Waiting for host to continue...</div>
            )}
          </div>
        )}

        {/* ENDED PHASE */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <h3 style={{ fontSize: '1.4rem', color: '#ca8a04', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
              Match Completed! Final Score: {state.hostScore} - {state.guestScore}
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
