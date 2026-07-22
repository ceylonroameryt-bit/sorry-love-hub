import React, { useState, useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw, Heart, Clock } from 'lucide-react';
import { GameHeader } from './GameHeader';

const QUESTIONS: { a: string; b: string }[] = [
  { a: "Summer ☀️", b: "Winter ❄️" },
  { a: "Dogs 🐶", b: "Cats 🐱" },
  { a: "Movies 🎬", b: "Series 📺" },
  { a: "Pizza 🍕", b: "Burgers 🍔" },
  { a: "Morning ☀️", b: "Night 🌙" },
  { a: "Beach 🏖️", b: "Mountains 🏔️" },
  { a: "Sweet 🍰", b: "Savoury 🧀" },
  { a: "Coffee ☕", b: "Tea 🍵" },
  { a: "Reading 📖", b: "Gaming 🎮" },
  { a: "Comedy 😂", b: "Romance 💕" },
  { a: "City 🏙️", b: "Countryside 🌿" },
  { a: "Cooking 👨‍🍳", b: "Eating out 🍽️" },
  { a: "Plan ahead 📋", b: "Last minute 🌀" },
  { a: "Introvert 🤫", b: "Extrovert 🎉" },
  { a: "Text 💬", b: "Call 📞" },
  { a: "Dance 💃", b: "Sing 🎤" },
  { a: "History 🏺", b: "Future 🚀" },
  { a: "Rain 🌧️", b: "Sunshine ☀️" },
  { a: "Big group 👥", b: "Small group 👫" },
  { a: "Late night 🌙", b: "Early morning 🌅" },
];

interface TotState {
  phase: 'voting' | 'reveal' | 'ended';
  round: number;
  qIndex: number;
  qOrder: number[];
  hostVote: 'a' | 'b' | null;
  guestVote: 'a' | 'b' | null;
  matches: number;
}

const ROUNDS = 10;

function shuffle(arr: number[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeInitial(): TotState {
  const order = shuffle(QUESTIONS.map((_, i) => i));
  return {
    phase: 'voting',
    round: 1,
    qIndex: 0,
    qOrder: order.slice(0, ROUNDS),
    hostVote: null,
    guestVote: null,
    matches: 0
  };
}

export const ThisOrThat: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization for fresh shuffled questions
  useEffect(() => {
    if (role === 'host' && (!gameState || !gameState.qOrder)) {
      sendGameAction(makeInitial());
    }
  }, [role, gameState, sendGameAction]);

  const state: TotState = gameState ?? makeInitial();
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const [timer, setTimer] = useState(8);
  const timerRef = useRef<number | null>(null);

  const qOrder = state.qOrder ?? QUESTIONS.map((_, i) => i).slice(0, ROUNDS);
  const currentIdx = qOrder[state.qIndex % qOrder.length] ?? 0;
  const q = QUESTIONS[currentIdx];

  const myVote = role === 'host' ? state.hostVote : state.guestVote;
  const theirVote = role === 'host' ? state.guestVote : state.hostVote;

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (state.phase !== 'voting') return;
    setTimer(8);
    timerRef.current = window.setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          if (role === 'host') {
            const s = { ...stateRef.current };
            if (!s.hostVote) s.hostVote = Math.random() < 0.5 ? 'a' : 'b';
            if (!s.guestVote) s.guestVote = Math.random() < 0.5 ? 'a' : 'b';
            s.phase = 'reveal';
            if (s.hostVote === s.guestVote) s.matches += 1;
            sendGameAction(s);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.phase, state.qIndex, role, sendGameAction]);

  const handleVote = (v: 'a' | 'b') => {
    if (myVote !== null || state.phase !== 'voting') return;
    const ns = { ...state };
    if (role === 'host') ns.hostVote = v;
    else ns.guestVote = v;
    if (ns.hostVote && ns.guestVote) {
      ns.phase = 'reveal';
      if (ns.hostVote === ns.guestVote) ns.matches += 1;
    }
    sendGameAction(ns);
  };

  const next = () => {
    if (role !== 'host') return;
    if (state.round >= ROUNDS) {
      sendGameAction({ ...state, phase: 'ended' });
      return;
    }
    sendGameAction({
      ...state,
      phase: 'voting',
      round: state.round + 1,
      qIndex: state.qIndex + 1,
      hostVote: null,
      guestVote: null
    });
  };

  const reset = () => sendGameAction(makeInitial());

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="This or That"
        emoji="⚡"
        instructions={[
          "Rapid 8-second choices per round!",
          "Pick 'This' or 'That' before the timer expires.",
          "Score a Love Match point whenever you choose the exact same option!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            Round {state.round} of {ROUNDS}
          </span>
          <span className="badge-cute" style={{ background: '#fce7f3', color: '#db2777' }}>
            <Heart size={14} fill="#db2777" /> Matches: {state.matches}
          </span>
        </div>

        {/* Ended Phase */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>⚡💖</div>
            <h2 className="heading-lg" style={{ color: '#7c3aed', marginBottom: '0.5rem' }}>
              Rapid Fire Complete!
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              You matched on <strong>{state.matches} out of {ROUNDS}</strong> rapid choices!
            </p>
            {role === 'host' && (
              <button onClick={reset} className="btn-cute btn-cute-primary" style={{ padding: '0.7rem 1.8rem' }}>
                <RefreshCw size={18} /> Play Again
              </button>
            )}
          </div>
        )}

        {/* Voting or Reveal Phase */}
        {state.phase !== 'ended' && (
          <div>
            {/* Timer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '1.2rem', color: timer <= 3 ? '#dc2626' : '#7c3aed', fontWeight: 700 }}>
              <Clock size={16} />
              <span>{state.phase === 'voting' ? `${timer}s left` : 'Revealed!'}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Option A */}
              <button
                onClick={() => handleVote('a')}
                disabled={myVote !== null || state.phase !== 'voting'}
                style={{
                  background: myVote === 'a' ? '#f3e8ff' : '#ffffff',
                  border: myVote === 'a' ? '2.5px solid #7c3aed' : '2px solid #ddd6fe',
                  borderRadius: '18px',
                  padding: '1.4rem 1rem',
                  cursor: myVote === null && state.phase === 'voting' ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(124,58,237,0.06)'
                }}
              >
                <span style={{ fontSize: '1.2rem', color: '#1e1b4b', fontWeight: 700, fontFamily: 'var(--font-cute)' }}>
                  {q.a}
                </span>
                {state.phase === 'reveal' && (
                  <div style={{ marginTop: '0.8rem', fontSize: '0.8rem', fontWeight: 700, color: '#6d28d9' }}>
                    {state.hostVote === 'a' && <span>👑 Host </span>}
                    {state.guestVote === 'a' && <span>🌸 Guest</span>}
                  </div>
                )}
              </button>

              {/* Option B */}
              <button
                onClick={() => handleVote('b')}
                disabled={myVote !== null || state.phase !== 'voting'}
                style={{
                  background: myVote === 'b' ? '#fce7f3' : '#ffffff',
                  border: myVote === 'b' ? '2.5px solid #ec4899' : '2px solid #ddd6fe',
                  borderRadius: '18px',
                  padding: '1.4rem 1rem',
                  cursor: myVote === null && state.phase === 'voting' ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(236,72,153,0.06)'
                }}
              >
                <span style={{ fontSize: '1.2rem', color: '#1e1b4b', fontWeight: 700, fontFamily: 'var(--font-cute)' }}>
                  {q.b}
                </span>
                {state.phase === 'reveal' && (
                  <div style={{ marginTop: '0.8rem', fontSize: '0.8rem', fontWeight: 700, color: '#db2777' }}>
                    {state.hostVote === 'b' && <span>👑 Host </span>}
                    {state.guestVote === 'b' && <span>🌸 Guest</span>}
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
                    : 'Tap your choice fast!'}
                </div>
              )}

              {state.phase === 'reveal' && (
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: state.hostVote === state.guestVote ? '#059669' : '#db2777', marginBottom: '0.6rem' }}>
                    {state.hostVote === state.guestVote ? '✨ You both matched!' : '💭 Different choices!'}
                  </div>
                  {role === 'host' && (
                    <button onClick={next} className="btn-cute btn-cute-primary" style={{ padding: '0.5rem 1.4rem' }}>
                      Next Rapid Choice ➔
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
