import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw, Play } from 'lucide-react';
import { GameHeader } from './GameHeader';

interface WhackState {
  phase: 'setup' | 'playing' | 'ended';
  bfRole: 'host' | 'guest' | null;
  gfRole: 'host' | 'guest' | null;
  bfHole: number | null;
  bonked: boolean;
  gfScore: number;
  bfScore: number;
  timeLeft: number;
}

const INIT: WhackState = {
  phase: 'setup',
  bfRole: 'host',
  gfRole: 'guest',
  bfHole: null,
  bonked: false,
  gfScore: 0,
  bfScore: 0,
  timeLeft: 30,
};

export const BoyfriendHit: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INIT);
    }
  }, [role, gameState, sendGameAction]);

  const state: WhackState = gameState ?? INIT;

  const timerRef = useRef<number | null>(null);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const isBF = (role === 'host' && state.bfRole === 'host') || (role === 'guest' && state.bfRole === 'guest');
  const isGF = !isBF;

  const startGame = () => {
    sendGameAction({ ...stateRef.current, phase: 'playing', bfHole: null, bonked: false, gfScore: 0, bfScore: 0, timeLeft: 30 });
  };

  const popUp = (hole: number) => {
    if (!isBF || state.phase !== 'playing' || state.bonked) return;
    sendGameAction({ ...state, bfHole: hole, bonked: false });
  };

  const whack = (hole: number) => {
    if (!isGF || state.phase !== 'playing' || state.bfHole !== hole || state.bonked) return;
    sendGameAction({ ...state, bonked: true, gfScore: state.gfScore + 1 });
  };

  // Timer loop
  useEffect(() => {
    if (role !== 'host' || state.phase !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      const s = stateRef.current;
      if (s.timeLeft <= 1) {
        clearInterval(timerRef.current!);
        sendGameAction({ ...s, phase: 'ended', timeLeft: 0 });
      } else {
        // Auto pop-up for BF if inactive
        let newHole = s.bfHole;
        if (newHole === null || Math.random() < 0.4) {
          newHole = Math.floor(Math.random() * 9);
        }
        sendGameAction({ ...s, timeLeft: s.timeLeft - 1, bfHole: newHole, bonked: false });
      }
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [role, state.phase, sendGameAction]);

  const resetAll = () => sendGameAction(INIT);

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Whack-a-BF"
        emoji="🔨"
        instructions={[
          "Boyfriend 🙋‍♂️ pops up from 9 holes on the grid.",
          "Girlfriend 🔨 taps the hole as fast as possible to smack him with a mallet!",
          "Score as many bonks as possible in 30 seconds!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            ⏱️ {state.timeLeft}s left
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#ea580c' }}>🔨 Bonks: {state.gfScore}</span>
          </div>
        </div>

        {/* SETUP PHASE */}
        {state.phase === 'setup' && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem', animation: 'float 2.5s ease infinite' }}>🔨🙋‍♂️</div>
            <h3 className="heading-lg" style={{ fontSize: '1.4rem', color: '#ea580c', marginBottom: '0.6rem' }}>
              Whack-a-Boyfriend Arcade!
            </h3>
            {role === 'host' ? (
              <button onClick={startGame} className="btn-cute btn-cute-primary" style={{ padding: '0.75rem 1.8rem', background: '#ea580c', borderColor: '#ea580c' }}>
                <Play size={18} /> Start Bonking!
              </button>
            ) : (
              <p style={{ color: '#6b7280' }}>Waiting for {opponentName || 'host'} to start...</p>
            )}
          </div>
        )}

        {/* PLAYING PHASE */}
        {state.phase === 'playing' && (
          <div className="game-board-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem', marginBottom: '1.5rem' }}>
            {Array.from({ length: 9 }).map((_, idx) => {
              const isHere = state.bfHole === idx;
              const isBonked = isHere && state.bonked;

              return (
                <button
                  key={idx}
                  onClick={() => (isBF ? popUp(idx) : whack(idx))}
                  style={{
                    aspectRatio: '1 / 1',
                    background: isBonked ? '#fee2e2' : isHere ? '#ffedd5' : '#ffffff',
                    border: isHere ? '2.5px solid #ea580c' : '1.5px solid #ddd6fe',
                    borderRadius: '20px',
                    fontSize: '2.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(234,88,12,0.08)'
                  }}
                >
                  {isBonked ? '💥' : isHere ? '🙋‍♂️' : '🕳️'}
                </button>
              );
            })}
          </div>
        )}

        {/* ENDED PHASE */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <h3 style={{ fontSize: '1.5rem', color: '#ea580c', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
              Arcade Finished! Total Bonks: {state.gfScore}
            </h3>
            {role === 'host' && (
              <button onClick={resetAll} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem', background: '#ea580c', borderColor: '#ea580c' }}>
                <RefreshCw size={16} /> Play Again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
