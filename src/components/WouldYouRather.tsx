import React, { useEffect } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw, Heart } from 'lucide-react';
import { GameHeader } from './GameHeader';
import { WYR_QUESTIONS as ALL_QUESTIONS } from '../data/questions';

interface WyrState {
  phase: 'voting' | 'reveal' | 'ended';
  round: number;
  questionIndex: number;
  questionOrder: number[];
  hostVote: 'A' | 'B' | null;
  guestVote: 'A' | 'B' | null;
  matches: number;
}

const TOTAL_ROUNDS = 10;

function makeInitial(): WyrState {
  const order = ALL_QUESTIONS.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    phase: 'voting',
    round: 1,
    questionIndex: 0,
    questionOrder: order.slice(0, TOTAL_ROUNDS),
    hostVote: null,
    guestVote: null,
    matches: 0,
  };
}

export const WouldYouRather: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization for fresh shuffled questions
  useEffect(() => {
    if (role === 'host' && (!gameState || !gameState.questionOrder)) {
      sendGameAction(makeInitial());
    }
  }, [role, gameState, sendGameAction]);

  const state: WyrState = gameState ?? makeInitial();

  const questionOrder = state.questionOrder ?? ALL_QUESTIONS.map((_, i) => i).slice(0, TOTAL_ROUNDS);
  const currentQ = ALL_QUESTIONS[questionOrder[state.questionIndex]] ?? ALL_QUESTIONS[0];
  const myVote = role === 'host' ? state.hostVote : state.guestVote;
  const theirVote = role === 'host' ? state.guestVote : state.hostVote;

  const handleVote = (vote: 'A' | 'B') => {
    if (myVote !== null || state.phase !== 'voting') return;
    const nextState = { ...state };
    if (role === 'host') nextState.hostVote = vote;
    else nextState.guestVote = vote;

    if (nextState.hostVote && nextState.guestVote) {
      nextState.phase = 'reveal';
      if (nextState.hostVote === nextState.guestVote) nextState.matches += 1;
    }
    sendGameAction(nextState);
  };

  const nextQuestion = () => {
    if (role !== 'host') return;
    const nextIdx = state.questionIndex + 1;
    if (nextIdx >= TOTAL_ROUNDS) {
      sendGameAction({ ...state, phase: 'ended' });
    } else {
      sendGameAction({
        ...state,
        phase: 'voting',
        round: state.round + 1,
        questionIndex: nextIdx,
        hostVote: null,
        guestVote: null,
      });
    }
  };

  const resetAll = () => {
    sendGameAction(makeInitial());
  };

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Would You Rather"
        emoji="🤔"
        instructions={[
          "Secretly pick Option A or Option B for each relationship dilemma!",
          "When both you and your partner vote, your answers are revealed.",
          "Score a Love Match point whenever both of you choose the same option!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Game Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="badge-cute" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            Dilemma {state.round} of {TOTAL_ROUNDS}
          </span>
          <span className="badge-cute" style={{ background: '#fce7f3', color: '#db2777' }}>
            <Heart size={14} fill="#db2777" /> Matches: {state.matches}
          </span>
        </div>

        {/* Ended Phase */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>💕</div>
            <h2 className="heading-lg" style={{ color: '#4c1d95', marginBottom: '0.5rem' }}>
              Game Complete!
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              You matched on <strong>{state.matches} out of {TOTAL_ROUNDS}</strong> choices!
            </p>
            {role === 'host' && (
              <button onClick={resetAll} className="btn-cute btn-cute-primary" style={{ padding: '0.7rem 1.8rem' }}>
                <RefreshCw size={18} /> Play Again
              </button>
            )}
          </div>
        )}

        {/* Voting or Reveal Phase */}
        {state.phase !== 'ended' && (
          <div>
            <h3 style={{
              textAlign: 'center',
              fontFamily: 'var(--font-world)',
              color: '#4c1d95',
              fontSize: '1.3rem',
              marginBottom: '1.2rem'
            }}>
              Would You Rather...
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Option A */}
              <button
                onClick={() => handleVote('A')}
                disabled={myVote !== null || state.phase !== 'voting'}
                style={{
                  background: myVote === 'A' ? '#f3e8ff' : '#ffffff',
                  border: myVote === 'A' ? '2.5px solid #7c3aed' : '2px solid #ddd6fe',
                  borderRadius: '18px',
                  padding: '1.2rem 1rem',
                  cursor: myVote === null && state.phase === 'voting' ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(124,58,237,0.06)'
                }}
              >
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#7c3aed', fontWeight: 700, marginBottom: '0.4rem' }}>OPTION A</span>
                <span style={{ fontSize: '1rem', color: '#1e1b4b', fontWeight: 600, fontFamily: 'var(--font-cute)' }}>
                  {currentQ.optionA}
                </span>
                {state.phase === 'reveal' && (
                  <div style={{ marginTop: '0.8rem', fontSize: '0.8rem', fontWeight: 700, color: '#6d28d9' }}>
                    {state.hostVote === 'A' && <span>👑 Host </span>}
                    {state.guestVote === 'A' && <span>🌸 Guest</span>}
                  </div>
                )}
              </button>

              {/* Option B */}
              <button
                onClick={() => handleVote('B')}
                disabled={myVote !== null || state.phase !== 'voting'}
                style={{
                  background: myVote === 'B' ? '#fce7f3' : '#ffffff',
                  border: myVote === 'B' ? '2.5px solid #ec4899' : '2px solid #ddd6fe',
                  borderRadius: '18px',
                  padding: '1.2rem 1rem',
                  cursor: myVote === null && state.phase === 'voting' ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(236,72,153,0.06)'
                }}
              >
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#ec4899', fontWeight: 700, marginBottom: '0.4rem' }}>OPTION B</span>
                <span style={{ fontSize: '1rem', color: '#1e1b4b', fontWeight: 600, fontFamily: 'var(--font-cute)' }}>
                  {currentQ.optionB}
                </span>
                {state.phase === 'reveal' && (
                  <div style={{ marginTop: '0.8rem', fontSize: '0.8rem', fontWeight: 700, color: '#db2777' }}>
                    {state.hostVote === 'B' && <span>👑 Host </span>}
                    {state.guestVote === 'B' && <span>🌸 Guest</span>}
                  </div>
                )}
              </button>
            </div>

            {/* Voting Status */}
            <div style={{ textAlign: 'center', minHeight: '40px' }}>
              {state.phase === 'voting' && (
                <div style={{ color: myVote ? '#059669' : '#6b7280', fontSize: '0.95rem', fontWeight: 600 }}>
                  {myVote
                    ? (theirVote ? 'Both voted! Revealing...' : `Vote locked! Waiting for ${opponentName || 'partner'}... ⏳`)
                    : 'Pick your choice in secret!'}
                </div>
              )}

              {state.phase === 'reveal' && (
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: state.hostVote === state.guestVote ? '#059669' : '#db2777', marginBottom: '0.6rem' }}>
                    {state.hostVote === state.guestVote ? '✨ You both matched!' : '💭 Different choices!'}
                  </div>
                  {role === 'host' && (
                    <button onClick={nextQuestion} className="btn-cute btn-cute-primary" style={{ padding: '0.5rem 1.4rem' }}>
                      Next Dilemma ➔
                    </button>
                  )}
                  {role === 'guest' && (
                    <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Waiting for host to continue...</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
