import React, { useState } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw, Heart, Send, Check, X } from 'lucide-react';

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
  phase: 'setup', asker: 'host', question: '', secretAnswer: '',
  guess: '', hostScore: 0, guestScore: 0, round: 1
};

import { COUPLES_QUIZ_PROMPTS as PROMPT_QUESTIONS } from '../data/questions';

export const CouplesQuiz: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName } = useGamePeer();
  const state: QuizState = gameState ?? INITIAL;

  const [inputQuestion, setInputQuestion] = useState('');
  const [inputAnswer, setInputAnswer] = useState('');
  const [inputGuess, setInputGuess] = useState('');

  const isAsker = (role === 'host' && state.asker === 'host') || (role === 'guest' && state.asker === 'guest');
  const isGuesser = !isAsker;

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

  const scoreRound = (isCorrect: boolean) => {
    const hostGain = (!isAsker && role === 'host' && isCorrect) || (isAsker && role === 'guest' && isCorrect) ? 1 : 0;
    const guestGain = (!isAsker && role === 'guest' && isCorrect) || (isAsker && role === 'host' && isCorrect) ? 1 : 0;
    
    sendGameAction({
      ...state,
      phase: 'setup',
      hostScore: state.hostScore + hostGain,
      guestScore: state.guestScore + guestGain,
      round: state.round + 1,
      asker: state.asker === 'host' ? 'guest' : 'host', // Swap asker next round
    });
  };

  const resetGame = () => {
    sendGameAction({ ...INITIAL });
  };

  return (
    <div className="container-cute" style={{ maxWidth: '700px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Back */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Couples Quiz 💬</span>
          <button onClick={resetGame} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} title="Reset Scores">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Score display */}
        <div style={{
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          background: '#fff', borderRadius: '14px', padding: '0.8rem 1rem',
          border: '1px solid #ede9fe', marginBottom: '1.5rem',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Your Score</div>
            <div className="font-cute" style={{ fontSize: '1.6rem', color: '#7c3aed' }}>
              {role === 'host' ? state.hostScore : state.guestScore}
            </div>
          </div>
          <div className="font-cute" style={{ fontSize: '1rem', color: '#a78bfa', background: '#f5f3ff', padding: '0.4rem 1.1rem', borderRadius: '50px', border: '1px solid #ddd6fe' }}>
            VS
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{opponentName || 'Partner'}'s Score</div>
            <div className="font-cute" style={{ fontSize: '1.6rem', color: '#8b5cf6' }}>
              {role === 'guest' ? state.hostScore : state.guestScore}
            </div>
          </div>
        </div>

        {/* SETUP PHASE */}
        {state.phase === 'setup' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'float 2s ease infinite' }}>💬❓</div>
            <h2 className="heading-lg">Who asks the next question?</h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '0.9rem' }}>
              Write a question about yourself with a secret answer, and see if your partner can guess it!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => startRound(role === 'host' ? 'host' : 'guest')}
                className="btn-cute btn-cute-primary"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' }}
              >
                I'll Ask! 🙋‍♀️
              </button>
              <button
                onClick={() => startRound(role === 'host' ? 'guest' : 'host')}
                className="btn-cute btn-cute-secondary"
              >
                Let {opponentName || 'Partner'} Ask 👉
              </button>
            </div>
          </div>
        )}

        {/* WRITING PHASE */}
        {state.phase === 'writing' && (
          <div style={{ padding: '0.5rem 0' }}>
            {isAsker ? (
              <div>
                <h3 className="font-cute" style={{ color: '#4c1d95', fontSize: '1.4rem', textAlign: 'center', marginBottom: '1rem' }}>
                  Ask Your Partner! 🤫
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', textAlign: 'center', marginBottom: '1.5rem' }}>
                  Select one of these prompts or write a custom question.
                </p>

                {/* Pre-set questions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
                  {PROMPT_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setInputQuestion(q)}
                      style={{
                        textAlign: 'left',
                        padding: '0.7rem 1rem',
                        borderRadius: '12px',
                        border: inputQuestion === q ? '2px solid #7c3aed' : '1px solid #ede9fe',
                        background: inputQuestion === q ? '#f5f3ff' : '#fff',
                        color: '#4c1d95',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        transition: 'all 0.15s',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '480px', margin: '0 auto' }}>
                  <input
                    className="input-cute"
                    placeholder="Or type a custom question..."
                    value={inputQuestion}
                    onChange={e => setInputQuestion(e.target.value)}
                    style={{ fontSize: '0.95rem' }}
                  />

                  <input
                    className="input-cute"
                    placeholder="Enter your secret answer..."
                    value={inputAnswer}
                    onChange={e => setInputAnswer(e.target.value)}
                    style={{ fontSize: '0.95rem', background: '#fffbeb', border: '1.5px solid #fef3c7' }}
                  />

                  <button
                    onClick={() => submitQuestion(inputQuestion)}
                    disabled={!inputQuestion.trim() || !inputAnswer.trim()}
                    className="btn-cute btn-cute-primary"
                    style={{ justifyContent: 'center', marginTop: '0.5rem' }}
                  >
                    <Send size={15} /> Send Question
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <div style={{ fontSize: '3rem', animation: 'float 2s ease infinite' }}>✍️💭</div>
                <h3 className="heading-lg">
                  {opponentName || 'Partner'} is writing a question...
                </h3>
                <p style={{ color: '#6b7280' }}>Get ready to guess how well you know them! 😊</p>
              </div>
            )}
          </div>
        )}

        {/* GUESSING PHASE */}
        {state.phase === 'guessing' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            {isGuesser ? (
              <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <span className="badge-cute" style={{ marginBottom: '1rem' }}>QUESTION FOR YOU</span>
                <h3 className="font-cute" style={{ color: '#4c1d95', fontSize: '1.6rem', marginBottom: '1.5rem', lineHeight: 1.4 }}>
                  "{state.question}"
                </h3>
                <input
                  className="input-cute"
                  placeholder="Type your guess..."
                  value={inputGuess}
                  onChange={e => setInputGuess(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && inputGuess.trim() && submitGuess()}
                  style={{ textAlign: 'center', fontSize: '1.1rem', marginBottom: '1rem' }}
                  autoFocus
                />
                <button
                  onClick={submitGuess}
                  disabled={!inputGuess.trim()}
                  className="btn-cute btn-cute-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Submit Guess! 🎯
                </button>
              </div>
            ) : (
              <div style={{ padding: '3rem 0' }}>
                <div style={{ fontSize: '3rem', animation: 'pulse-gentle 1.5s infinite' }}>❓🧐</div>
                <h3 className="heading-lg">
                  {opponentName || 'Partner'} is guessing your answer...
                </h3>
                <p style={{ color: '#6b7280' }}>
                  Your question: <strong>"{state.question}"</strong>
                </p>
              </div>
            )}
          </div>
        )}

        {/* REVEAL PHASE */}
        {state.phase === 'reveal' && (
          <div style={{ textAlign: 'center', animation: 'pop-in 0.4s ease' }}>
            <h3 className="font-cute" style={{ color: '#4c1d95', fontSize: '1.8rem', marginBottom: '1.5rem' }}>
              Reveal Answers! 🌟
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: '#fffbeb', border: '1.5px solid #fef3c7', borderRadius: '18px', padding: '1.2rem 1rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {isAsker ? 'Your Secret Answer' : `${opponentName || 'Partner'}'s Answer`}
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#92400e' }}>
                  {state.secretAnswer}
                </div>
              </div>

              <div style={{ background: '#f5f3ff', border: '1.5px solid #ede9fe', borderRadius: '18px', padding: '1.2rem 1rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {isGuesser ? 'Your Guess' : `${opponentName || 'Partner'}'s Guess`}
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#4c1d95' }}>
                  {state.guess}
                </div>
              </div>
            </div>

            {isAsker ? (
              <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                <p style={{ fontWeight: 600, color: '#4c1d95', marginBottom: '1rem' }}>
                  Did they get it right? Be fair! 😉
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button
                    onClick={() => scoreRound(true)}
                    className="btn-cute btn-cute-primary"
                    style={{ background: '#10b981', borderColor: '#10b981', flex: 1, justifyContent: 'center' }}
                  >
                    <Check size={16} /> Yes, Correct! (+1)
                  </button>
                  <button
                    onClick={() => scoreRound(false)}
                    className="btn-cute btn-cute-secondary"
                    style={{ color: '#dc2626', borderColor: '#fecaca', flex: 1, justifyContent: 'center' }}
                  >
                    <X size={16} /> No, Wrong!
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  Waiting for {opponentName || 'partner'} to score this round...
                  <Heart size={15} fill="#7c3aed" color="#7c3aed" style={{ animation: 'pulse-gentle 1s infinite' }} />
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
