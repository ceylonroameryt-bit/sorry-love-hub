import React, { useState, useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw, Award, Heart, Zap } from 'lucide-react';

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
  hostVote: 'a' | 'b' | null;
  guestVote: 'a' | 'b' | null;
  matches: number;
}

const ROUNDS = 10;

function shuffle(arr: number[]) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function makeInitial(): TotState {
  const order = shuffle(QUESTIONS.map((_, i) => i));
  return { phase: 'voting', round: 1, qIndex: order[0], hostVote: null, guestVote: null, matches: 0 };
}

export const ThisOrThat: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName } = useGamePeer();
  const state: TotState = gameState ?? makeInitial();
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const [timer, setTimer] = useState(8);
  const timerRef = useRef<number | null>(null);

  const q = QUESTIONS[state.qIndex % QUESTIONS.length];
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
          // Auto-submit if not voted
          if (role === 'host') {
            const s = stateRef.current;
            if (!s.hostVote) {
              const ns = { ...s, hostVote: (Math.random() > 0.5 ? 'a' : 'b') as 'a' | 'b' };
              if (ns.hostVote && ns.guestVote) { ns.phase = 'reveal'; if (ns.hostVote === ns.guestVote) ns.matches += 1; }
              sendGameAction(ns);
            }
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.round]);

  const handleVote = (vote: 'a' | 'b') => {
    if (myVote !== null || state.phase !== 'voting') return;
    const ns = { ...stateRef.current };
    if (role === 'host') ns.hostVote = vote;
    else ns.guestVote = vote;
    if (ns.hostVote && ns.guestVote) {
      ns.phase = 'reveal';
      if (ns.hostVote === ns.guestVote) ns.matches += 1;
    }
    sendGameAction(ns);
  };

  const next = () => {
    if (role !== 'host') return;
    if (state.round >= ROUNDS) { sendGameAction({ ...state, phase: 'ended' }); return; }
    const nextIdx = (state.qIndex + Math.floor(Math.random() * 3) + 1) % QUESTIONS.length;
    sendGameAction({ ...state, phase: 'voting', round: state.round + 1, qIndex: nextIdx, hostVote: null, guestVote: null });
  };

  const reset = () => sendGameAction(makeInitial());

  const matchPct = Math.round((state.matches / Math.max(state.round - (state.phase === 'voting' ? 1 : 0), 1)) * 100);
  const timerColor = timer <= 3 ? '#dc2626' : timer <= 5 ? '#d97706' : '#7c3aed';

  return (
    <div className="container-cute" style={{ maxWidth: '640px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">This or That ⚡</span>
          <button onClick={reset} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}><RefreshCw size={14} /></button>
        </div>

        {/* Match bar */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '0.8rem 1.2rem', border: '1px solid #ede9fe', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>
            <span>Round {state.round}/{ROUNDS}</span>
            <span style={{ color: timerColor, fontWeight: 700 }}>⏱ {state.phase === 'voting' ? `${timer}s` : '—'}</span>
            <span>Match: {matchPct}% ❤️</span>
          </div>
          <div style={{ height: '8px', background: '#f5f3ff', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${matchPct}%`, background: 'linear-gradient(to right, #a78bfa, #ec4899)', borderRadius: '99px', transition: 'width 0.4s' }} />
          </div>
        </div>

        {state.phase === 'voting' && (
          <div style={{ textAlign: 'center' }}>
            <h3 className="font-cute" style={{ fontSize: '1.3rem', color: '#4c1d95', marginBottom: '1.5rem' }}>
              This or That? ⚡ <span style={{ fontSize: '0.9rem', color: timerColor }}>({timer}s)</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[{ vote: 'a' as const, text: q.a }, { vote: 'b' as const, text: q.b }].map(({ vote, text }) => (
                <button key={vote} onClick={() => handleVote(vote)} disabled={myVote !== null}
                  className="btn-cute btn-cute-primary"
                  style={{ padding: '2rem 1rem', fontSize: '1.1rem', justifyContent: 'center', fontWeight: 800, background: myVote === vote ? 'linear-gradient(135deg,#7c3aed,#8b5cf6)' : '#fff', color: myVote === vote ? '#fff' : '#4c1d95', border: `2px solid ${myVote === vote ? '#7c3aed' : '#ddd6fe'}`, boxShadow: myVote === vote ? '0 8px 24px rgba(124,58,237,0.3)' : '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s', whiteSpace: 'normal', lineHeight: 1.4, borderRadius: '20px', minHeight: '100px' }}>
                  {text}
                </button>
              ))}
            </div>
            {myVote && (
              <p style={{ marginTop: '1rem', color: '#8b5cf6', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                Waiting for {opponentName || 'partner'}...
                <Heart size={14} color="#7c3aed" fill="#7c3aed" style={{ animation: 'pulse-gentle 1s infinite' }} />
              </p>
            )}
          </div>
        )}

        {state.phase === 'reveal' && (
          <div style={{ textAlign: 'center', animation: 'pop-in 0.4s ease' }}>
            <h3 className="font-cute" style={{ fontSize: '1.3rem', color: '#4c1d95', marginBottom: '1.2rem' }}>
              {myVote === theirVote ? '💜 You both picked the same thing!' : '✨ Different choices!'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
              {[{ label: 'You', vote: myVote }, { label: opponentName || 'Partner', vote: theirVote }].map(({ label, vote: v }) => (
                <div key={label} style={{ background: '#f5f3ff', border: '2px solid #ddd6fe', borderRadius: '18px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 700 }}>{label}</div>
                  <div style={{ fontSize: '1.1rem', color: '#4c1d95', fontWeight: 800, marginTop: '4px' }}>
                    {v === 'a' ? q.a : v === 'b' ? q.b : '⏰ Timed out!'}
                  </div>
                </div>
              ))}
            </div>
            {role === 'host' ? (
              <button onClick={next} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' }}>
                <Zap size={15} /> {state.round >= ROUNDS ? 'See Results' : 'Next! ⚡'}
              </button>
            ) : <p style={{ color: '#8b5cf6', fontSize: '0.9rem' }}>Waiting for host...</p>}
          </div>
        )}

        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '2rem 0', animation: 'pop-in 0.4s ease' }}>
            <Award size={60} color="#7c3aed" style={{ margin: '0 auto 1rem', animation: 'float 3s ease infinite' }} />
            <h2 className="font-cute" style={{ fontSize: '2rem', color: '#4c1d95', marginBottom: '0.5rem' }}>Done! ⚡</h2>
            <div style={{ fontSize: '1.1rem', color: '#374151', marginBottom: '2rem' }}>
              You matched on <strong style={{ color: '#7c3aed', fontSize: '1.4rem' }}>{state.matches}</strong>/{ROUNDS}!<br />
              <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>{matchPct >= 80 ? '💜 Two peas in a pod!' : matchPct >= 60 ? '❤️ Great minds!' : '✨ Beautifully unique pair!'}</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={reset} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' }}>Play Again</button>
              <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary">Back to Lobby</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
