import React, { useState, useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw, Award, Heart, Check, X, Clock } from 'lucide-react';

interface Question {
  text: string;
  options: string[];
  answer: string;
}

const QUESTIONS: Question[] = [
  { text: "What is the capital city of Australia? 🇦🇺", options: ["Sydney", "Melbourne", "Canberra", "Brisbane"], answer: "Canberra" },
  { text: "Which element has the chemical symbol 'O'? 🧪", options: ["Gold", "Oxygen", "Osmium", "Iron"], answer: "Oxygen" },
  { text: "Who painted the famous Mona Lisa? 🎨", options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Claude Monet"], answer: "Leonardo da Vinci" },
  { text: "Which is the smallest country in the world? 🇻🇦", options: ["Monaco", "Vatican City", "Liechtenstein", "San Marino"], answer: "Vatican City" },
  { text: "What is the primary gas found in the Earth's atmosphere? ☁️", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], answer: "Nitrogen" },
  { text: "How many legs does a spider have? 🕷️", options: ["6", "8", "10", "12"], answer: "8" },
  { text: "What is the largest land animal on Earth? 🐘", options: ["African Elephant", "Blue Whale", "Giraffe", "Hippopotamus"], answer: "African Elephant" },
  { text: "Which language has the most native speakers? 🗣️", options: ["English", "Spanish", "Mandarin Chinese", "Hindi"], answer: "Mandarin Chinese" },
  { text: "Which planet is closest to the Sun? ☀️", options: ["Venus", "Mercury", "Mars", "Earth"], answer: "Mercury" },
  { text: "What is the name of the fairy in Peter Pan? 🧚‍♀️", options: ["Tinker Bell", "Cinderella", "Ariel", "Belle"], answer: "Tinker Bell" },
];

interface BattleState {
  phase: 'playing' | 'round_end' | 'ended';
  round: number;
  questionIndex: number;
  hostChoice: string | null;
  guestChoice: string | null;
  hostScore: number;
  guestScore: number;
}

const INITIAL: BattleState = {
  phase: 'playing',
  round: 1,
  questionIndex: 0,
  hostChoice: null,
  guestChoice: null,
  hostScore: 0,
  guestScore: 0
};

export const TriviaBattle: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName } = useGamePeer();
  const state: BattleState = gameState ?? INITIAL;

  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef<number | null>(null);

  const currentQ = QUESTIONS[state.questionIndex] || QUESTIONS[0];
  const myChoice = role === 'host' ? state.hostChoice : state.guestChoice;
  const theirChoice = role === 'host' ? state.guestChoice : state.hostChoice;

  const selectAnswer = (ans: string) => {
    if (myChoice !== null || state.phase !== 'playing') return;

    const nextState = { ...state };
    if (role === 'host') nextState.hostChoice = ans;
    else nextState.guestChoice = ans;

    // Check if both have answered
    if (nextState.hostChoice && nextState.guestChoice) {
      resolveRound(nextState);
    } else {
      sendGameAction(nextState);
    }
  };

  const resolveRound = (currentState: BattleState) => {
    const nextState = { ...currentState };
    nextState.phase = 'round_end';

    // Award scores
    if (nextState.hostChoice === currentQ.answer) {
      nextState.hostScore += 1;
    }
    if (nextState.guestChoice === currentQ.answer) {
      nextState.guestScore += 1;
    }

    sendGameAction(nextState);
  };

  const nextQuestion = () => {
    const nextIdx = state.questionIndex + 1;
    if (nextIdx >= QUESTIONS.length) {
      sendGameAction({
        ...state,
        phase: 'ended'
      });
    } else {
      sendGameAction({
        ...state,
        phase: 'playing',
        round: state.round + 1,
        questionIndex: nextIdx,
        hostChoice: null,
        guestChoice: null
      });
      setTimeLeft(15);
    }
  };

  // Timer logic
  useEffect(() => {
    if (state.phase !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          
          // Force end round
          const nextState = { ...state };
          if (!nextState.hostChoice) nextState.hostChoice = 'timeout';
          if (!nextState.guestChoice) nextState.guestChoice = 'timeout';
          resolveRound(nextState);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.phase, state.questionIndex]);

  const resetAll = () => {
    sendGameAction({ ...INITIAL });
    setTimeLeft(15);
  };

  const iWon = (role === 'host' && state.hostScore > state.guestScore) || (role === 'guest' && state.guestScore > state.hostScore);
  const correctOption = currentQ.answer;

  return (
    <div className="container-cute" style={{ maxWidth: '700px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Trivia Battle 🧠</span>
          <button onClick={resetAll} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} title="Reset scores">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Score Board */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f5f3ff', padding: '0.4rem 1.1rem', borderRadius: '50px', border: '1px solid #ddd6fe' }}>
            <Clock size={14} color="#7c3aed" />
            <span className="font-cute" style={{ fontSize: '0.9rem', color: '#7c3aed' }}>{timeLeft}s</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{opponentName || 'Partner'}'s Score</div>
            <div className="font-cute" style={{ fontSize: '1.6rem', color: '#8b5cf6' }}>
              {role === 'guest' ? state.hostScore : state.guestScore}
            </div>
          </div>
        </div>

        {/* PLAYING PHASE */}
        {state.phase === 'playing' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: '#fff',
              border: '1px solid #ede9fe',
              borderRadius: '16px',
              padding: '1.5rem 1.2rem',
              boxShadow: '0 4px 10px rgba(0,0,0,0.01)',
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}>
              <h3 className="font-cute" style={{ color: '#4c1d95', fontSize: '1.35rem', margin: 0, lineHeight: 1.4 }}>
                {currentQ.text}
              </h3>
            </div>

            {myChoice === null ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '520px', margin: '0 auto' }}>
                {currentQ.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => selectAnswer(opt)}
                    className="btn-cute btn-cute-secondary"
                    style={{
                      padding: '0.9rem 1.2rem',
                      fontSize: '1rem',
                      justifyContent: 'flex-start',
                      fontWeight: 700,
                      color: '#4c1d95',
                      border: '2px solid #ddd6fe',
                      background: '#fff',
                      boxShadow: '0 2px 8px rgba(124,58,237,0.08)',
                      transition: 'all 0.15s',
                      width: '100%',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ animation: 'pop-in 0.3s ease', padding: '1rem 0' }}>
                <div className="font-cute" style={{ fontSize: '1.2rem', color: '#7c3aed', marginBottom: '0.5rem' }}>
                  You locked in: "{myChoice}"
                </div>
                <p style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  Waiting for {opponentName || 'partner'}...
                  <Heart size={15} fill="#7c3aed" color="#7c3aed" style={{ animation: 'pulse-gentle 1s infinite' }} />
                </p>
              </div>
            )}
          </div>
        )}

        {/* ROUND END REVEAL */}
        {state.phase === 'round_end' && (
          <div style={{ textAlign: 'center', animation: 'pop-in 0.4s ease' }}>
            <h4 style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>The question was:</h4>
            <h3 className="font-cute" style={{ color: '#4c1d95', fontSize: '1.25rem', marginBottom: '1.5rem', lineHeight: 1.3 }}>
              "{currentQ.text}"
            </h3>

            <div style={{ background: '#ecfdf5', border: '2px solid #a7f3d0', borderRadius: '18px', padding: '1rem', maxWidth: '360px', margin: '0 auto 1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 700 }}>CORRECT ANSWER</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#065f46', marginTop: '0.2rem' }}>
                {correctOption}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{
                background: myChoice === correctOption ? '#ecfdf5' : '#fef2f2',
                border: `1.5px solid ${myChoice === correctOption ? '#a7f3d0' : '#fecaca'}`,
                borderRadius: '18px', padding: '1rem'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 700 }}>Your Answer</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: myChoice === correctOption ? '#047857' : '#b91c1c', marginTop: '0.3rem', lineHeight: 1.3 }}>
                  {myChoice === 'timeout' ? '⏰ Timeout' : myChoice}
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  {myChoice === correctOption ? <Check color="#10b981" size={24} style={{ margin: '0 auto' }} /> : <X color="#dc2626" size={24} style={{ margin: '0 auto' }} />}
                </div>
              </div>

              <div style={{
                background: theirChoice === correctOption ? '#ecfdf5' : '#fef2f2',
                border: `1.5px solid ${theirChoice === correctOption ? '#a7f3d0' : '#fecaca'}`,
                borderRadius: '18px', padding: '1rem'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 700 }}>{opponentName || 'Partner'}'s Answer</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: theirChoice === correctOption ? '#047857' : '#b91c1c', marginTop: '0.3rem', lineHeight: 1.3 }}>
                  {theirChoice === 'timeout' ? '⏰ Timeout' : theirChoice}
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  {theirChoice === correctOption ? <Check color="#10b981" size={24} style={{ margin: '0 auto' }} /> : <X color="#dc2626" size={24} style={{ margin: '0 auto' }} />}
                </div>
              </div>
            </div>

            {role === 'host' ? (
              <button onClick={nextQuestion} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', padding: '0.8rem 2rem' }}>
                Next Question ➡️
              </button>
            ) : (
              <p style={{ color: '#8b5cf6', fontSize: '0.9rem' }}>
                Waiting for host to load next question...
              </p>
            )}
          </div>
        )}

        {/* GAME ENDED */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '2rem 0', animation: 'pop-in 0.4s ease' }}>
            <Award size={60} color="#7c3aed" style={{ animation: 'float 3s ease infinite', margin: '0 auto 1rem' }} />
            <h2 className="font-cute" style={{ fontSize: '2.2rem', color: '#4c1d95', margin: '0 0 0.5rem' }}>Battle Over! 🏁</h2>

            <div style={{ fontSize: '1.2rem', color: '#374151', marginBottom: '2rem' }}>
              {state.hostScore === state.guestScore ? (
                <span><strong>It's a perfect tie!</strong> 🤝</span>
              ) : iWon ? (
                <span><strong>You won the battle! 👑</strong></span>
              ) : (
                <span><strong>{opponentName || 'Partner'} won the battle! 👑</strong></span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={resetAll} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' }}>
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
