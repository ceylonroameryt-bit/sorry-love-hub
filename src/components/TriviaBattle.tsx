import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw, Clock } from 'lucide-react';
import { GameHeader } from './GameHeader';
import { TRIVIA_QUESTIONS as ALL_QUESTIONS } from '../data/questions';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ROUND_COUNT = 10;
const TIMER_SECONDS = 20;

interface BattleState {
  phase: 'playing' | 'round_end' | 'ended';
  round: number;
  questionIndex: number;
  questionOrder: number[];
  hostChoice: string | null;
  guestChoice: string | null;
  hostScore: number;
  guestScore: number;
}

function makeInitial(): BattleState {
  return {
    phase: 'playing',
    round: 1,
    questionIndex: 0,
    questionOrder: shuffle(ALL_QUESTIONS.map((_, i) => i)).slice(0, ROUND_COUNT),
    hostChoice: null,
    guestChoice: null,
    hostScore: 0,
    guestScore: 0,
  };
}

export const TriviaBattle: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  useEffect(() => {
    if (role === 'host' && (!gameState || !gameState.questionOrder)) {
      sendGameAction(makeInitial());
    }
  }, [role, gameState, sendGameAction]);

  const state: BattleState = gameState ?? makeInitial();

  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const timerRef = useRef<number | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const questionOrder = state.questionOrder ?? ALL_QUESTIONS.map((_, i) => i).slice(0, ROUND_COUNT);
  const currentQ = ALL_QUESTIONS[questionOrder[state.questionIndex]] ?? ALL_QUESTIONS[0];
  const myChoice = role === 'host' ? state.hostChoice : state.guestChoice;
  const theirChoice = role === 'host' ? state.guestChoice : state.hostChoice;

  const resolveRound = useCallback((currentState: BattleState) => {
    const q = ALL_QUESTIONS[(currentState.questionOrder ?? questionOrder)[currentState.questionIndex]] ?? ALL_QUESTIONS[0];
    const nextState = { ...currentState, phase: 'round_end' as const };
    if (nextState.hostChoice === q.answer) nextState.hostScore += 1;
    if (nextState.guestChoice === q.answer) nextState.guestScore += 1;
    sendGameAction(nextState);
  }, [sendGameAction, questionOrder]);

  const selectAnswer = (ans: string) => {
    if (myChoice !== null || state.phase !== 'playing') return;
    const nextState = { ...stateRef.current };
    if (role === 'host') nextState.hostChoice = ans;
    else nextState.guestChoice = ans;

    if (nextState.hostChoice && nextState.guestChoice) {
      resolveRound(nextState);
    } else {
      sendGameAction(nextState);
    }
  };

  const nextQuestion = () => {
    if (role !== 'host') return;
    const nextIdx = state.questionIndex + 1;
    if (nextIdx >= ROUND_COUNT) {
      sendGameAction({ ...state, phase: 'ended' });
    } else {
      sendGameAction({
        ...state,
        phase: 'playing',
        round: state.round + 1,
        questionIndex: nextIdx,
        hostChoice: null,
        guestChoice: null,
      });
      setTimeLeft(TIMER_SECONDS);
    }
  };

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (state.phase !== 'playing') return;

    setTimeLeft(TIMER_SECONDS);

    timerRef.current = window.setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          if (role === 'host') {
            const s = { ...stateRef.current };
            if (!s.hostChoice) s.hostChoice = 'timeout';
            if (!s.guestChoice) s.guestChoice = 'timeout';
            resolveRound(s);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.phase, state.questionIndex, role, resolveRound]);

  const resetAll = () => {
    sendGameAction(makeInitial());
    setTimeLeft(TIMER_SECONDS);
  };

  const iWon = (role === 'host' && state.hostScore > state.guestScore) || (role === 'guest' && state.guestScore > state.hostScore);
  const timerColor = timeLeft <= 5 ? '#dc2626' : timeLeft <= 10 ? '#d97706' : '#7c3aed';

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Trivia Battle"
        emoji="🧠"
        instructions={[
          "Compete head-to-head through 10 randomized trivia questions!",
          "Pick your answer before the 20-second timer expires.",
          "Earn 1 point for every correct answer. Highest score wins!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <span className="badge-cute" style={{ background: '#ede9fe', color: '#6d28d9' }}>
              Round {state.round} / {ROUND_COUNT}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '1rem' }}>
            <span style={{ color: '#7c3aed' }}>Host: {state.hostScore}</span>
            <span style={{ color: '#ec4899' }}>Guest: {state.guestScore}</span>
          </div>
        </div>

        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>
              {state.hostScore === state.guestScore ? '🤝' : iWon ? '🏆' : '💔'}
            </div>
            <h2 className="heading-lg" style={{ color: '#4c1d95', marginBottom: '0.5rem' }}>
              {state.hostScore === state.guestScore ? "It's a Tie!" : iWon ? 'You Win!' : `${opponentName || 'Partner'} Wins!`}
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '1rem' }}>
              Final Score: {state.hostScore} - {state.guestScore}
            </p>
            {role === 'host' && (
              <button onClick={resetAll} className="btn-cute btn-cute-primary" style={{ padding: '0.7rem 1.8rem' }}>
                <RefreshCw size={18} /> Play Again
              </button>
            )}
          </div>
        )}

        {state.phase !== 'ended' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
              <Clock size={18} color={timerColor} />
              <div style={{ flex: 1, background: '#ede9fe', borderRadius: '10px', height: '12px', overflow: 'hidden' }}>
                <div style={{
                  width: `${(timeLeft / TIMER_SECONDS) * 100}%`,
                  height: '100%',
                  background: timerColor,
                  transition: 'width 1s linear',
                  borderRadius: '10px'
                }} />
              </div>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: timerColor, minWidth: '28px' }}>
                {timeLeft}s
              </span>
            </div>

            <div style={{
              background: '#ffffff',
              border: '2px solid #ddd6fe',
              borderRadius: '16px',
              padding: '1.2rem',
              textAlign: 'center',
              marginBottom: '1.2rem',
              boxShadow: '0 4px 12px rgba(124,58,237,0.06)'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e1b4b', lineHeight: 1.4, fontFamily: 'var(--font-cute)' }}>
                {currentQ.text}
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.2rem' }}>
              {currentQ.options.map((opt, i) => {
                const isSelected = myChoice === opt;
                let bg = '#ffffff';
                let border = '#e9d5ff';
                let textColor = '#1e1b4b';

                if (state.phase === 'round_end') {
                  if (opt === currentQ.answer) {
                    bg = '#dcfce7';
                    border = '#22c55e';
                    textColor = '#15803d';
                  } else if (isSelected && opt !== currentQ.answer) {
                    bg = '#fee2e2';
                    border = '#ef4444';
                    textColor = '#b91c1c';
                  }
                } else if (isSelected) {
                  bg = '#f3e8ff';
                  border = '#7c3aed';
                  textColor = '#6d28d9';
                }

                return (
                  <button
                    key={i}
                    onClick={() => selectAnswer(opt)}
                    disabled={myChoice !== null || state.phase !== 'playing'}
                    style={{
                      background: bg,
                      border: `2px solid ${border}`,
                      color: textColor,
                      borderRadius: '14px',
                      padding: '0.85rem 0.6rem',
                      fontFamily: 'var(--font-cute)',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: myChoice === null && state.phase === 'playing' ? 'pointer' : 'default',
                      transition: 'all 0.15s ease',
                      textAlign: 'center',
                      wordBreak: 'break-word'
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            <div style={{ textAlign: 'center', minHeight: '40px' }}>
              {state.phase === 'playing' && (
                <div style={{ color: myChoice ? '#059669' : '#6b7280', fontSize: '0.9rem', fontWeight: 600 }}>
                  {myChoice
                    ? (theirChoice ? 'Both answered! Resolving...' : `Waiting for ${opponentName || 'partner'}... ⏳`)
                    : 'Tap an option to lock in your answer!'}
                </div>
              )}

              {state.phase === 'round_end' && (
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#4c1d95', marginBottom: '0.5rem' }}>
                    Correct Answer: <span style={{ color: '#15803d' }}>{currentQ.answer}</span>
                  </div>
                  {role === 'host' && (
                    <button onClick={nextQuestion} className="btn-cute btn-cute-primary" style={{ padding: '0.5rem 1.4rem' }}>
                      Next Question ➔
                    </button>
                  )}
                  {role === 'guest' && (
                    <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Host will load the next question...</div>
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
