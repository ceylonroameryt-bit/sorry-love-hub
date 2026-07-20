import React from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

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

import { TRUTH_QUESTIONS as TRUTHS, DARE_PROMPTS as DARES } from '../data/questions';

export const TruthOrDare: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName } = useGamePeer();
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
    <div className="container-cute" style={{ maxWidth: '640px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Truth or Dare 🤫</span>
          <button onClick={resetGame} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Turn stats */}
        <div style={{ display: 'flex', justifyContent: 'space-around', background: '#fff', borderRadius: '14px', padding: '0.6rem 1rem', border: '1px solid #ede9fe', marginBottom: '1.5rem', fontSize: '0.82rem', color: '#6b7280' }}>
          <span>Your turns: <strong style={{ color: '#7c3aed' }}>{role === 'host' ? state.hostTurns : state.guestTurns}</strong></span>
          <span>Total played: <strong>{totalTurns}</strong></span>
          <span>{opponentName || 'Partner'}'s turns: <strong style={{ color: '#8b5cf6' }}>{role === 'host' ? state.guestTurns : state.hostTurns}</strong></span>
        </div>

        {/* Turn indicator */}
        <div style={{ textAlign: 'center', background: isMyTurn ? 'linear-gradient(135deg,#f5f3ff,#ede9fe)' : '#f9fafb', border: `1.5px solid ${isMyTurn ? '#c084fc' : '#e5e7eb'}`, borderRadius: '16px', padding: '0.8rem', marginBottom: '2rem', color: isMyTurn ? '#5b21b6' : '#6b7280', fontWeight: 700, fontSize: '0.95rem' }}>
          {isMyTurn ? "✨ IT'S YOUR TURN! ✨" : `⏳ Waiting for ${opponentName || 'Partner'} to pick...`}
        </div>

        {/* SELECT PHASE */}
        {state.phase === 'select' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', animation: 'float 2.5s ease infinite' }}>🤫🎭</div>
            <h3 className="heading-lg" style={{ fontSize: '1.6rem', color: '#4c1d95', marginBottom: '1.5rem' }}>
              {isMyTurn ? "Choose Your Fate!" : `${opponentName || 'Partner'} is choosing...`}
            </h3>
            {isMyTurn ? (
              <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center' }}>
                <button onClick={() => handleSelection('truth')} className="btn-cute btn-cute-primary"
                  style={{ flex: 1, padding: '1.5rem', fontSize: '1.2rem', justifyContent: 'center', background: '#7c3aed' }}>
                  Truth 💜
                </button>
                <button onClick={() => handleSelection('dare')} className="btn-cute btn-cute-primary"
                  style={{ flex: 1, padding: '1.5rem', fontSize: '1.2rem', justifyContent: 'center', background: '#db2777', borderColor: '#db2777' }}>
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
          <div style={{ textAlign: 'center', animation: 'pop-in 0.4s ease' }}>
            <span className="badge-cute" style={{ background: state.type === 'truth' ? '#f5f3ff' : '#fff1f2', color: state.type === 'truth' ? '#7c3aed' : '#be123c', border: `1.5px solid ${state.type === 'truth' ? '#c084fc' : '#fecaca'}`, marginBottom: '1rem', fontSize: '0.9rem', padding: '0.5rem 1.5rem' }}>
              {state.type?.toUpperCase()} {state.type === 'truth' ? '💜' : '🔥'}
            </span>

            <div style={{ background: '#fff', border: '2px solid #ddd6fe', borderRadius: '20px', padding: '2rem 1.5rem', marginBottom: '2rem', boxShadow: '0 4px 14px rgba(124,58,237,0.05)' }}>
              <h3 className="font-cute" style={{ color: '#4c1d95', fontSize: '1.4rem', margin: 0, lineHeight: 1.5 }}>
                "{state.text}"
              </h3>
            </div>

            {isMyTurn ? (
              <div style={{ maxWidth: '360px', margin: '0 auto' }}>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1.2rem' }}>
                  Complete the prompt, then click next to pass the turn!
                </p>
                <button onClick={nextTurn} className="btn-cute btn-cute-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Done! Next Turn ➡️
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#8b5cf6' }}>
                <AlertCircle size={16} />
                <span>Waiting for {opponentName || 'Partner'} to complete...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
