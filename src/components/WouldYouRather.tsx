import React from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw, Award, Heart, Check, X } from 'lucide-react';

interface Question {
  optionA: string;
  optionB: string;
}

const QUESTIONS: Question[] = [
  { optionA: "Live in a cozy cabin in the snowy mountains 🏔️", optionB: "Live in a sunny beach cottage 🏖️" },
  { optionA: "Have unlimited free pizzas forever 🍕", optionB: "Have unlimited free cupcakes & mochi 🧁" },
  { optionA: "Be able to fly anywhere in the world ✈️", optionB: "Be able to read minds 🧠" },
  { optionA: "Go on a road trip across the country 🚗", optionB: "Go on a luxury cruise across the ocean 🚢" },
  { optionA: "Have a cute pet panda 🐼", optionB: "Have a cute pet koala 🐨" },
  { optionA: "Only watch movies/shows for the rest of your life 🎬", optionB: "Only listen to music for the rest of your life 🎵" },
  { optionA: "Wake up early and watch the sunrise 🌅", optionB: "Stay up late and watch the stars 🌙" },
  { optionA: "Always have to tell the truth 🤫", optionB: "Always know when someone is lying 🕵️" },
  { optionA: "Explore a futuristic space station 🚀", optionB: "Explore an ancient underwater castle 🏰" },
  { optionA: "Be 10 minutes early to everything ⏰", optionB: "Be 10 minutes late but look fabulous 💅" },
];

interface WyrState {
  phase: 'voting' | 'reveal' | 'ended';
  round: number;
  questionIndex: number;
  hostVote: 'A' | 'B' | null;
  guestVote: 'A' | 'B' | null;
  matches: number;
}

const INITIAL: WyrState = {
  phase: 'voting',
  round: 1,
  questionIndex: 0,
  hostVote: null,
  guestVote: null,
  matches: 0,
};

export const WouldYouRather: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName } = useGamePeer();
  const state: WyrState = gameState ?? INITIAL;

  const currentQ = QUESTIONS[state.questionIndex] || QUESTIONS[0];
  const myVote = role === 'host' ? state.hostVote : state.guestVote;
  const theirVote = role === 'host' ? state.guestVote : state.hostVote;

  const handleVote = (vote: 'A' | 'B') => {
    if (myVote !== null || state.phase !== 'voting') return;

    const nextState = { ...state };
    if (role === 'host') nextState.hostVote = vote;
    else nextState.guestVote = vote;

    // Check if both have voted
    if (nextState.hostVote && nextState.guestVote) {
      nextState.phase = 'reveal';
      if (nextState.hostVote === nextState.guestVote) {
        nextState.matches += 1;
      }
    }
    sendGameAction(nextState);
  };

  const nextQuestion = () => {
    const nextIdx = state.questionIndex + 1;
    if (nextIdx >= QUESTIONS.length) {
      sendGameAction({
        ...state,
        phase: 'ended',
      });
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

  const resetGame = () => {
    sendGameAction({ ...INITIAL });
  };

  const matchPct = state.round > 1 ? Math.round((state.matches / (state.round - (state.phase === 'voting' ? 1 : 0))) * 100) : 0;

  return (
    <div className="container-cute" style={{ maxWidth: '680px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Would You Rather 🤔</span>
          <button onClick={resetGame} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} title="Reset game">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Match score bar */}
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '0.8rem 1.2rem',
          border: '1px solid #ede9fe', marginBottom: '1.5rem', textAlign: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.82rem', color: '#6b7280', fontWeight: 600 }}>
            <span>Round {state.round}/{QUESTIONS.length}</span>
            <span>Match Level: {matchPct}% ❤️</span>
          </div>
          <div style={{ height: '8px', background: '#f5f3ff', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${matchPct}%`, background: 'linear-gradient(to right, #a78bfa, #ec4899)', borderRadius: '99px', transition: 'width 0.3s ease' }} />
          </div>
        </div>

        {/* VOTING PHASE */}
        {state.phase === 'voting' && (
          <div style={{ textAlign: 'center' }}>
            <h3 className="font-cute" style={{ color: '#4c1d95', fontSize: '1.6rem', marginBottom: '1.5rem', lineHeight: 1.4 }}>
              Would You Rather...
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '520px', margin: '0 auto 1.5rem' }}>
              <button
                onClick={() => handleVote('A')}
                disabled={myVote !== null}
                className="btn-cute"
                style={{
                  padding: '1.2rem', fontSize: '1rem', fontWeight: 700, justifyContent: 'center',
                  background: myVote === 'A' ? '#f5f3ff' : '#fff',
                  border: `2px solid ${myVote === 'A' ? '#7c3aed' : '#ddd6fe'}`,
                  color: '#4c1d95',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
                  whiteSpace: 'normal',
                }}
              >
                {currentQ.optionA}
              </button>

              <div className="font-cute" style={{ color: '#a78bfa', fontSize: '1.2rem', margin: '4px 0' }}>OR</div>

              <button
                onClick={() => handleVote('B')}
                disabled={myVote !== null}
                className="btn-cute"
                style={{
                  padding: '1.2rem', fontSize: '1rem', fontWeight: 700, justifyContent: 'center',
                  background: myVote === 'B' ? '#fdf2f8' : '#fff',
                  border: `2px solid ${myVote === 'B' ? '#ec4899' : '#ddd6fe'}`,
                  color: '#4c1d95',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
                  whiteSpace: 'normal',
                }}
              >
                {currentQ.optionB}
              </button>
            </div>

            {myVote !== null && (
              <p style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                Waiting for {opponentName || 'Partner'} to lock in...
                <Heart size={15} fill="#7c3aed" color="#7c3aed" style={{ animation: 'pulse-gentle 1s infinite' }} />
              </p>
            )}
          </div>
        )}

        {/* REVEAL PHASE */}
        {state.phase === 'reveal' && (
          <div style={{ textAlign: 'center', animation: 'pop-in 0.4s ease' }}>
            <h3 className="font-cute" style={{ color: '#4c1d95', fontSize: '1.6rem', marginBottom: '1.5rem' }}>
              Results Revealed! 🌟
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{
                background: '#f5f3ff', border: '1.5px solid #ede9fe', borderRadius: '18px', padding: '1.2rem 1rem'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 700, marginBottom: '0.5rem' }}>Your Pick</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#4c1d95', lineHeight: 1.3 }}>
                  {myVote === 'A' ? currentQ.optionA : currentQ.optionB}
                </div>
              </div>

              <div style={{
                background: '#fdf2f8', border: '1.5px solid #fbcfe8', borderRadius: '18px', padding: '1.2rem 1rem'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#be185d', fontWeight: 700, marginBottom: '0.5rem' }}>{opponentName || 'Partner'}'s Pick</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#4c1d95', lineHeight: 1.3 }}>
                  {theirVote === 'A' ? currentQ.optionA : currentQ.optionB}
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontSize: '1.2rem', fontWeight: 700, color: myVote === theirVote ? '#059669' : '#ca8a04',
              marginBottom: '2rem'
            }}>
              {myVote === theirVote ? (
                <>
                  <Check color="#10b981" size={24} />
                  <span>It's a Match! You both think alike! 💖</span>
                </>
              ) : (
                <>
                  <X color="#dc2626" size={24} />
                  <span>Different minds! opposites attract! ✨</span>
                </>
              )}
            </div>

            {role === 'host' ? (
              <button onClick={nextQuestion} className="btn-cute btn-cute-primary" style={{ padding: '0.8rem 2rem' }}>
                Next Question ➡️
              </button>
            ) : (
              <p style={{ color: '#8b5cf6', fontSize: '0.9rem' }}>
                Waiting for host to load next question...
              </p>
            )}
          </div>
        )}

        {/* ENDED PHASE */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '2rem 0', animation: 'pop-in 0.4s ease' }}>
            <Award size={60} color="#7c3aed" style={{ animation: 'float 3s ease infinite', margin: '0 auto 1rem' }} />
            <h2 className="font-cute" style={{ fontSize: '2.2rem', color: '#4c1d95', margin: '0 0 0.5rem' }}>Match Completed! 🏁</h2>

            <div style={{ fontSize: '1.2rem', color: '#374151', marginBottom: '2rem' }}>
              You matched on <strong style={{ color: '#ec4899', fontSize: '1.5rem' }}>{state.matches}</strong> out of <strong style={{ fontSize: '1.3rem' }}>{QUESTIONS.length}</strong> questions!
              <div style={{ color: '#7c3aed', fontWeight: 800, marginTop: '8px', fontSize: '1.3rem' }}>
                Relationship Match: {matchPct}% ❤️
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={resetGame} className="btn-cute btn-cute-primary">
                Play Again
              </button>
              <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary">
                Back to Lobby
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
