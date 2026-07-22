import React, { useState, useEffect } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { Send, Check, RefreshCw } from 'lucide-react';
import { GameHeader } from './GameHeader';
import { COUPLES_QUIZ_PROMPTS as PROMPT_QUESTIONS } from '../data/questions';

interface QuizState {
  phase: 'setup' | 'writing' | 'guessing' | 'reveal' | 'ended';
  asker: 'host' | 'guest';
  question: string;
  secretAnswer: string;
  guess: string;
  hostScore: number;
  guestScore: number;
  round: number;
}

const INITIAL: QuizState = {
  phase: 'setup',
  asker: 'host',
  question: '',
  secretAnswer: '',
  guess: '',
  hostScore: 0,
  guestScore: 0,
  round: 1
};

export const CouplesQuiz: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INITIAL);
    }
  }, [role, gameState, sendGameAction]);

  const state: QuizState = gameState ?? INITIAL;

  const [inputQuestion, setInputQuestion] = useState('');
  const [inputAnswer, setInputAnswer] = useState('');
  const [inputGuess, setInputGuess] = useState('');

  const isAsker = (role === 'host' && state.asker === 'host') || (role === 'guest' && state.asker === 'guest');

  const startRound = (askerRole: 'host' | 'guest') => {
    sendGameAction({
      ...state,
      phase: 'writing',
      asker: askerRole,
      question: '',
      secretAnswer: '',
      guess: '',
    });
  };

  const submitQuestion = (q: string) => {
    if (!q.trim() || !inputAnswer.trim()) return;
    sendGameAction({
      ...state,
      phase: 'guessing',
      question: q.trim(),
      secretAnswer: inputAnswer.trim(),
    });
    setInputAnswer('');
    setInputQuestion('');
  };

  const submitGuess = () => {
    if (!inputGuess.trim()) return;
    sendGameAction({
      ...state,
      phase: 'reveal',
      guess: inputGuess.trim(),
    });
    setInputGuess('');
  };

  const awardPoint = (correct: boolean) => {
    const ns = { ...state };
    if (correct) {
      if (role === 'host' && state.asker === 'guest') ns.hostScore += 1;
      if (role === 'guest' && state.asker === 'host') ns.guestScore += 1;
    }
    const nextAsker = state.asker === 'host' ? 'guest' : 'host';
    ns.phase = 'writing';
    ns.asker = nextAsker;
    ns.round += 1;
    ns.question = '';
    ns.secretAnswer = '';
    ns.guess = '';
    sendGameAction(ns);
  };

  const resetAll = () => {
    sendGameAction(INITIAL);
    setInputQuestion('');
    setInputAnswer('');
    setInputGuess('');
  };

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Couples Quiz"
        emoji="💬"
        instructions={[
          "The Asker picks or writes a question about themselves and enters their secret answer.",
          "The Guesser tries to guess what their partner wrote!",
          "Compare answers and award points for accurate partner guesses."
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Score & Round Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            Round {state.round}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>Host: {state.hostScore}</span>
            <span style={{ color: '#ec4899' }}>Guest: {state.guestScore}</span>
          </div>
        </div>

        {/* SETUP PHASE */}
        {state.phase === 'setup' && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem', animation: 'float 2.5s ease infinite' }}>💬💖</div>
            <h3 className="heading-lg" style={{ fontSize: '1.5rem', color: '#4c1d95', marginBottom: '1.2rem' }}>
              Who starts as the Asker?
            </h3>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => startRound('host')} className="btn-cute btn-cute-primary" style={{ padding: '0.8rem 1.4rem' }}>
                👑 Host Asks First
              </button>
              <button onClick={() => startRound('guest')} className="btn-cute btn-cute-primary" style={{ padding: '0.8rem 1.4rem', background: '#ec4899', borderColor: '#ec4899' }}>
                🌸 Guest Asks First
              </button>
            </div>
          </div>
        )}

        {/* WRITING PHASE */}
        {state.phase === 'writing' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
              <span className="badge-cute" style={{ background: isAsker ? '#f3e8ff' : '#f9fafb', color: isAsker ? '#7c3aed' : '#6b7280' }}>
                {isAsker ? '✨ Your turn to ask!' : `⏳ Waiting for ${opponentName || 'Partner'} to write a question...`}
              </span>
            </div>

            {isAsker ? (
              <div>
                <label style={{ display: 'block', fontWeight: 700, color: '#4c1d95', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  Pick a prompt or type your own question:
                </label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
                  {PROMPT_QUESTIONS.slice(0, 4).map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputQuestion(p)}
                      style={{
                        padding: '0.35rem 0.7rem',
                        fontSize: '0.78rem',
                        borderRadius: '12px',
                        border: '1px solid #c084fc',
                        background: inputQuestion === p ? '#ede9fe' : '#ffffff',
                        color: '#6d28d9',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-cute)'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <input
                  className="input-cute"
                  placeholder="e.g., What is my favorite comfort food?"
                  value={inputQuestion}
                  onChange={e => setInputQuestion(e.target.value)}
                  style={{ marginBottom: '0.8rem', fontSize: '0.95rem' }}
                />

                <label style={{ display: 'block', fontWeight: 700, color: '#ec4899', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  Your Secret Answer (only revealed at the end):
                </label>
                <input
                  className="input-cute"
                  placeholder="e.g., Spicy Ramen"
                  value={inputAnswer}
                  onChange={e => setInputAnswer(e.target.value)}
                  style={{ marginBottom: '1rem', fontSize: '0.95rem' }}
                />

                <button
                  onClick={() => submitQuestion(inputQuestion)}
                  disabled={!inputQuestion.trim() || !inputAnswer.trim()}
                  className="btn-cute btn-cute-primary"
                  style={{ width: '100%', padding: '0.8rem', justifyContent: 'center' }}
                >
                  <Send size={16} /> Send Question & Lock Secret Answer
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#6b7280' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem', animation: 'pulse-gentle 1.5s infinite' }}>✍️</div>
                <p style={{ fontSize: '1rem' }}>{opponentName || 'Partner'} is choosing a question and typing their secret answer!</p>
              </div>
            )}
          </div>
        )}

        {/* GUESSING PHASE */}
        {state.phase === 'guessing' && (
          <div>
            <div style={{
              background: '#ffffff',
              border: '2px solid #ddd6fe',
              borderRadius: '16px',
              padding: '1.2rem',
              textAlign: 'center',
              marginBottom: '1.2rem',
              boxShadow: '0 4px 12px rgba(124,58,237,0.06)'
            }}>
              <span style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>
                {isAsker ? 'Your Question:' : `${opponentName || 'Partner'}'s Question:`}
              </span>
              <p style={{ fontSize: '1.2rem', color: '#1e1b4b', fontWeight: 700, margin: 0, fontFamily: 'var(--font-cute)' }}>
                "{state.question}"
              </p>
            </div>

            {!isAsker ? (
              <div>
                <label style={{ display: 'block', fontWeight: 700, color: '#059669', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  Type your guess:
                </label>
                <input
                  className="input-cute"
                  placeholder="Type your guess here..."
                  value={inputGuess}
                  onChange={e => setInputGuess(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitGuess()}
                  style={{ marginBottom: '1rem', fontSize: '0.95rem' }}
                />
                <button
                  onClick={submitGuess}
                  disabled={!inputGuess.trim()}
                  className="btn-cute btn-cute-primary"
                  style={{ width: '100%', padding: '0.8rem', justifyContent: 'center', background: '#059669', borderColor: '#059669' }}
                >
                  <Send size={16} /> Submit Guess
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: '#6b7280' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', animation: 'pulse-gentle 1.5s infinite' }}>💭</div>
                <p style={{ fontSize: '1rem' }}>Waiting for {opponentName || 'partner'} to guess your secret answer!</p>
              </div>
            )}
          </div>
        )}

        {/* REVEAL PHASE */}
        {state.phase === 'reveal' && (
          <div>
            <div style={{
              background: '#ffffff',
              border: '2px solid #ddd6fe',
              borderRadius: '20px',
              padding: '1.2rem',
              marginBottom: '1.2rem'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 700 }}>QUESTION</span>
                <div style={{ fontSize: '1.15rem', color: '#1e1b4b', fontWeight: 700, fontFamily: 'var(--font-cute)' }}>
                  "{state.question}"
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: '#f5f3ff', border: '1.5px solid #c084fc', padding: '0.9rem', borderRadius: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 700 }}>Secret Answer</div>
                  <div style={{ fontSize: '1.1rem', color: '#1e1b4b', fontWeight: 700, marginTop: '4px' }}>
                    {state.secretAnswer}
                  </div>
                </div>

                <div style={{ background: '#fce7f3', border: '1.5px solid #f472b6', padding: '0.9rem', borderRadius: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.78rem', color: '#ec4899', fontWeight: 700 }}>{opponentName || 'Partner'}'s Guess</div>
                  <div style={{ fontSize: '1.1rem', color: '#1e1b4b', fontWeight: 700, marginTop: '4px' }}>
                    {state.guess}
                  </div>
                </div>
              </div>
            </div>

            {/* Judging Correctness */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#4c1d95', fontWeight: 700, marginBottom: '0.8rem' }}>Was the guess correct?</p>
              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => awardPoint(true)} className="btn-cute btn-cute-primary" style={{ background: '#059669', borderColor: '#059669', padding: '0.6rem 1.4rem' }}>
                  <Check size={16} /> Yes, Correct! (+1 Point)
                </button>
                <button onClick={() => awardPoint(false)} className="btn-cute btn-cute-secondary" style={{ padding: '0.6rem 1.4rem' }}>
                  No, Not Quite
                </button>
                <button onClick={resetAll} className="btn-cute btn-cute-secondary" style={{ padding: '0.6rem 1rem' }}>
                  <RefreshCw size={14} /> Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
