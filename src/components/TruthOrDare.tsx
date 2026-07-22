import React, { useEffect } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw } from 'lucide-react';
import { GameHeader } from './GameHeader';
import { TRUTH_QUESTIONS as TRUTHS, DARE_PROMPTS as DARES } from '../data/questions';

interface TodState {
  phase: 'select' | 'reveal';
  turn: 'host' | 'guest';
  type: 'truth' | 'dare' | null;
  text: string;
  hostTurns: number;
  guestTurns: number;
}

const INITIAL: TodState = {
  phase: 'select',
  turn: 'host',
  type: null,
  text: '',
  hostTurns: 0,
  guestTurns: 0,
};

export const TruthOrDare: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INITIAL);
    }
  }, [role, gameState, sendGameAction]);

  const state: TodState = gameState ?? INITIAL;

  const isMyTurn = (role === 'host' && state.turn === 'host') || (role === 'guest' && state.turn === 'guest');
  const totalTurns = state.hostTurns + state.guestTurns;

  const handleSelection = (type: 'truth' | 'dare') => {
    if (!isMyTurn || state.phase !== 'select') return;
    const pool = type === 'truth' ? TRUTHS : DARES;
    const randomText = pool[Math.floor(Math.random() * pool.length)];
    sendGameAction({ ...state, phase: 'reveal', type, text: randomText });
  };

  const nextTurn = () => {
    const nextHostTurns = state.turn === 'host' ? state.hostTurns + 1 : state.hostTurns;
    const nextGuestTurns = state.turn === 'guest' ? state.guestTurns + 1 : state.guestTurns;
    sendGameAction({
      phase: 'select',
      turn: state.turn === 'host' ? 'guest' : 'host',
      type: null,
      text: '',
      hostTurns: nextHostTurns,
      guestTurns: nextGuestTurns,
    });
  };

  const resetGame = () => { sendGameAction({ ...INITIAL }); };

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Truth or Dare"
        emoji="🤫"
        instructions={[
          "Take turns choosing Truth 💜 or Dare 🔥 on your turn.",
          "Truth prompts reveal sweet secrets & relationship thoughts.",
          "Dare challenges test your creativity and fun coupling spirit!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Turn stats */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          background: '#fff',
          borderRadius: '14px',
          padding: '0.6rem 1rem',
          border: '1px solid #ede9fe',
          marginBottom: '1.2rem',
          fontSize: '0.82rem',
          color: '#6b7280',
          flexWrap: 'wrap',
          gap: '0.4rem'
        }}>
          <span>Your turns: <strong style={{ color: '#7c3aed' }}>{role === 'host' ? state.hostTurns : state.guestTurns}</strong></span>
          <span>Total played: <strong>{totalTurns}</strong></span>
          <span>{opponentName || 'Partner'}'s turns: <strong style={{ color: '#8b5cf6' }}>{role === 'host' ? state.guestTurns : state.hostTurns}</strong></span>
        </div>

        {/* Turn indicator */}
        <div style={{
          textAlign: 'center',
          background: isMyTurn ? '#f3e8ff' : '#f9fafb',
          border: `1.5px solid ${isMyTurn ? '#c084fc' : '#e5e7eb'}`,
          borderRadius: '16px',
          padding: '0.8rem',
          marginBottom: '1.5rem',
          color: isMyTurn ? '#5b21b6' : '#6b7280',
          fontWeight: 700,
          fontSize: '0.95rem'
        }}>
          {isMyTurn ? "✨ IT'S YOUR TURN! ✨" : `⏳ Waiting for ${opponentName || 'Partner'} to pick...`}
        </div>

        {/* SELECT PHASE */}
        {state.phase === 'select' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1.2rem', animation: 'float 2.5s ease infinite' }}>🤫🎭</div>
            <h3 className="heading-lg" style={{ fontSize: '1.5rem', color: '#4c1d95', marginBottom: '1.2rem' }}>
              {isMyTurn ? "Choose Your Fate!" : `${opponentName || 'Partner'} is choosing...`}
            </h3>
            {isMyTurn ? (
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleSelection('truth')}
                  className="btn-cute btn-cute-primary"
                  style={{ flex: 1, minWidth: '140px', padding: '1.2rem', fontSize: '1.1rem', justifyContent: 'center', background: '#7c3aed' }}
                >
                  Truth 💜
                </button>
                <button
                  onClick={() => handleSelection('dare')}
                  className="btn-cute btn-cute-primary"
                  style={{ flex: 1, minWidth: '140px', padding: '1.2rem', fontSize: '1.1rem', justifyContent: 'center', background: '#db2777', borderColor: '#db2777' }}
                >
                  Dare 🔥
                </button>
              </div>
            ) : (
              <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>They can choose Truth or Dare to get a prompt!</p>
            )}
          </div>
        )}

        {/* REVEAL PHASE */}
        {state.phase === 'reveal' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              display: 'inline-block',
              background: state.type === 'truth' ? '#f3e8ff' : '#fce7f3',
              color: state.type === 'truth' ? '#7c3aed' : '#db2777',
              fontWeight: 700,
              padding: '0.4rem 1.2rem',
              borderRadius: '50px',
              fontSize: '1rem',
              marginBottom: '1.2rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              {state.type} Prompt
            </div>
            <div style={{
              background: '#ffffff',
              border: `2px solid ${state.type === 'truth' ? '#c084fc' : '#f472b6'}`,
              borderRadius: '20px',
              padding: '1.5rem 1.2rem',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
            }}>
              <p style={{ fontSize: '1.15rem', color: '#1e1b4b', fontWeight: 600, margin: 0, lineHeight: 1.5, fontFamily: 'var(--font-cute)' }}>
                "{state.text}"
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={nextTurn} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.5rem' }}>
                Complete & Next Turn ➔
              </button>
              <button onClick={resetGame} className="btn-cute btn-cute-secondary" style={{ padding: '0.65rem 1rem' }}>
                <RefreshCw size={16} /> Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
