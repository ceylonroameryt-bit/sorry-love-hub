import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw, Award, Heart, Check, X, Clock, Zap } from 'lucide-react';

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
  questionOrder: number[]; // shuffled indices into ALL_QUESTIONS
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
  const { role, sendGameAction, gameState, selectGame, opponentName } = useGamePeer();
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

  // Host-authoritative timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (state.phase !== 'playing') return;

    setTimeLeft(TIMER_SECONDS);

    timerRef.current = window.setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          // Only host resolves timeout to avoid double-resolve
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.questionIndex]);

  const resetAll = () => {
    sendGameAction(makeInitial());
    setTimeLeft(TIMER_SECONDS);
  };

  const iWon = (role === 'host' && state.hostScore > state.guestScore) || (role === 'guest' && state.guestScore > state.hostScore);
  const timerColor = timeLeft <= 5 ? '#dc2626' : timeLeft <= 10 ? '#d97706' : '#7c3aed';

  return (
    <div className="container-cute" style={{ maxWidth: '700px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Trivia Battle 🧠</span>
          <button onClick={resetAll} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} title="New game">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Score Board */}
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', background: '#fff', borderRadius: '14px', padding: '0.8rem 1rem', border: '1px solid #ede9fe', marginBottom: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>You</div>
            <div className="font-cute" style={{ fontSize: '1.8rem', color: '#7c3aed' }}>{role === 'host' ? state.hostScore : state.guestScore}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f5f3ff', padding: '0.3rem 0.8rem', borderRadius: '50px', border: `1.5px solid ${timerColor}30` }}>
              <Clock size={13} color={timerColor} />
              <span className="font-cute" style={{ fontSize: '1rem', color: timerColor, transition: 'color 0.3s' }}>{timeLeft}s</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Q {state.round}/{ROUND_COUNT}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{opponentName || 'Partner'}</div>
            <div className="font-cute" style={{ fontSize: '1.8rem', color: '#8b5cf6' }}>{role === 'guest' ? state.hostScore : state.guestScore}</div>
          </div>
        </div>

        {/* Timer bar */}
        {state.phase === 'playing' && (
          <div style={{ height: '6px', background: '#f5f3ff', borderRadius: '99px', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <div style={{ height: '100%', width: `${(timeLeft / TIMER_SECONDS) * 100}%`, background: `linear-gradient(to right, ${timerColor}, #a78bfa)`, borderRadius: '99px', transition: 'width 1s linear, background 0.3s' }} />
          </div>
        )}

        {/* PLAYING PHASE */}
        {state.phase === 'playing' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#fff', border: '1px solid #ede9fe', borderRadius: '16px', padding: '1.5rem 1.2rem', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', marginBottom: '1.5rem' }}>
              <h3 className="font-cute" style={{ color: '#4c1d95', fontSize: '1.3rem', margin: 0, lineHeight: 1.4 }}>
                {currentQ.text}
              </h3>
            </div>

            {myChoice === null ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxWidth: '540px', margin: '0 auto' }}>
                {currentQ.options.map((opt, i) => (
                  <button key={i} onClick={() => selectAnswer(opt)} className="btn-cute btn-cute-secondary"
                    style={{ padding: '0.85rem 1rem', fontSize: '0.95rem', justifyContent: 'center', fontWeight: 700, color: '#4c1d95', border: '2px solid #ddd6fe', background: '#fff', boxShadow: '0 2px 8px rgba(124,58,237,0.06)', transition: 'all 0.15s', whiteSpace: 'normal', textAlign: 'center', lineHeight: 1.3 }}>
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ animation: 'pop-in 0.3s ease', padding: '1rem 0' }}>
                <div className="font-cute" style={{ fontSize: '1.1rem', color: '#7c3aed', marginBottom: '0.5rem' }}>
                  ✅ Locked in: "{myChoice}"
                </div>
                <p style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.9rem' }}>
                  Waiting for {opponentName || 'partner'}...
                  <Heart size={14} fill="#7c3aed" color="#7c3aed" style={{ animation: 'pulse-gentle 1s infinite' }} />
                </p>
              </div>
            )}
          </div>
        )}

        {/* ROUND END REVEAL */}
        {state.phase === 'round_end' && (
          <div style={{ textAlign: 'center', animation: 'pop-in 0.4s ease' }}>
            <h4 style={{ color: '#6b7280', fontSize: '0.88rem', marginBottom: '0.4rem' }}>The question was:</h4>
            <h3 className="font-cute" style={{ color: '#4c1d95', fontSize: '1.2rem', marginBottom: '1.2rem', lineHeight: 1.3 }}>
              "{currentQ.text}"
            </h3>

            <div style={{ background: '#ecfdf5', border: '2px solid #a7f3d0', borderRadius: '18px', padding: '0.9rem 1.2rem', maxWidth: '360px', margin: '0 auto 1.2rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 700 }}>✅ CORRECT ANSWER</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#065f46', marginTop: '0.2rem' }}>{currentQ.answer}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Your Answer', choice: myChoice, isCorrect: myChoice === currentQ.answer },
                { label: `${opponentName || 'Partner'}'s Answer`, choice: theirChoice, isCorrect: theirChoice === currentQ.answer },
              ].map(({ label, choice, isCorrect }) => (
                <div key={label} style={{ background: isCorrect ? '#ecfdf5' : '#fef2f2', border: `1.5px solid ${isCorrect ? '#a7f3d0' : '#fecaca'}`, borderRadius: '18px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 700 }}>{label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: isCorrect ? '#047857' : '#b91c1c', marginTop: '0.3rem', lineHeight: 1.3 }}>
                    {choice === 'timeout' ? '⏰ Timed Out' : (choice || '—')}
                  </div>
                  <div style={{ marginTop: '0.4rem' }}>
                    {isCorrect ? <Check color="#10b981" size={22} style={{ margin: '0 auto' }} /> : <X color="#dc2626" size={22} style={{ margin: '0 auto' }} />}
                  </div>
                </div>
              ))}
            </div>

            {role === 'host' ? (
              <button onClick={nextQuestion} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', padding: '0.8rem 2rem' }}>
                <Zap size={16} /> {state.questionIndex + 1 >= ROUND_COUNT ? 'See Final Results' : 'Next Question ➡️'}
              </button>
            ) : (
              <p style={{ color: '#8b5cf6', fontSize: '0.9rem' }}>Waiting for host to continue...</p>
            )}
          </div>
        )}

        {/* GAME ENDED */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '2rem 0', animation: 'pop-in 0.4s ease' }}>
            <Award size={60} color="#7c3aed" style={{ animation: 'float 3s ease infinite', margin: '0 auto 1rem' }} />
            <h2 className="font-cute" style={{ fontSize: '2.2rem', color: '#4c1d95', margin: '0 0 0.5rem' }}>Battle Over! 🏁</h2>

            <div style={{ background: '#f5f3ff', border: '2px solid #ddd6fe', borderRadius: '20px', padding: '1.2rem', maxWidth: '360px', margin: '0 auto 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>You</div>
                  <div className="font-cute" style={{ fontSize: '2rem', color: '#7c3aed' }}>{role === 'host' ? state.hostScore : state.guestScore}</div>
                </div>
                <div style={{ fontSize: '1.5rem', alignSelf: 'center', color: '#a78bfa' }}>vs</div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{opponentName || 'Partner'}</div>
                  <div className="font-cute" style={{ fontSize: '2rem', color: '#8b5cf6' }}>{role === 'guest' ? state.hostScore : state.guestScore}</div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '1.2rem', color: '#374151', marginBottom: '2rem' }}>
              {state.hostScore === state.guestScore ? <span><strong>It's a perfect tie!</strong> 🤝</span>
                : iWon ? <span><strong>You won the battle! 👑</strong> Amazing!</span>
                : <span><strong>{opponentName || 'Partner'} won! 👑</strong> Better luck next time!</span>
              }
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={resetAll} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' }}>Play Again</button>
              <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary">Back to Lobby</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
