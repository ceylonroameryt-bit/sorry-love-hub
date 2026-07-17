import React from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw, Award, Heart, Check, X } from 'lucide-react';

const QUESTIONS = [
  { a: "Cries at movies 🎬", b: "Never cries at movies 😎" },
  { a: "Always late ⏰", b: "Always early 🏃" },
  { a: "Text all day 📱", b: "Hates texting 🤐" },
  { a: "Pineapple on pizza ✅", b: "Never pineapple 🍕" },
  { a: "Night owl 🌙", b: "Early bird 🐦" },
  { a: "Spends all their savings 💸", b: "Saves everything 💰" },
  { a: "Obsessed with TikTok 📱", b: "Never uses TikTok 🙅" },
  { a: "Sings in the shower 🎤", b: "Silent in the shower 🤫" },
  { a: "Hogs the blanket 🛌", b: "Never touches the blanket 🥶" },
  { a: "Says 'I love you' first ❤️", b: "Waits for the other person 👀" },
  { a: "Always forgets anniversaries 😅", b: "Never forgets a date 📅" },
  { a: "Addicted to coffee ☕", b: "Tea only 🍵" },
  { a: "Would survive a zombie apocalypse 🧟", b: "First to go in a horror film 😱" },
  { a: "Cooks amazing food 👨‍🍳", b: "Burns water 🔥" },
  { a: "Plans everything 📋", b: "Lives spontaneously 🌈" },
];

interface ConfState {
  phase: 'voting' | 'reveal' | 'ended';
  round: number;
  qIndex: number;
  hostVote: 'a' | 'b' | null; // Host says: A describes host, B describes guest (or which fits whom)
  guestVote: 'a' | 'b' | null;
  matches: number;
}

const ROUNDS = 8;

function makeInitial(): ConfState {
  const indices: number[] = [];
  const pool = [...Array(QUESTIONS.length).keys()];
  while (indices.length < ROUNDS) {
    const i = Math.floor(Math.random() * pool.length);
    indices.push(pool.splice(i, 1)[0]);
  }
  return { phase: 'voting', round: 1, qIndex: indices[0], hostVote: null, guestVote: null, matches: 0 };
}

export const CoupleConfessions: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName } = useGamePeer();
  const state: ConfState = gameState ?? makeInitial();

  const q = QUESTIONS[state.qIndex % QUESTIONS.length];
  const myVote = role === 'host' ? state.hostVote : state.guestVote;
  const theirVote = role === 'host' ? state.guestVote : state.hostVote;

  const handleVote = (vote: 'a' | 'b') => {
    if (myVote !== null || state.phase !== 'voting') return;
    const ns = { ...state };
    if (role === 'host') ns.hostVote = vote;
    else ns.guestVote = vote;
    // If both voted, go to reveal
    if (ns.hostVote && ns.guestVote) {
      ns.phase = 'reveal';
      // They match if they both voted the same letter (same person)
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

  return (
    <div className="container-cute" style={{ maxWidth: '660px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Couple Confessions 🤭</span>
          <button onClick={reset} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}><RefreshCw size={14} /></button>
        </div>

        {/* Agreement meter */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '0.8rem 1.2rem', border: '1px solid #ede9fe', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>
            <span>Round {state.round}/{ROUNDS}</span>
            <span>Agreement: {matchPct}% 🤭</span>
          </div>
          <div style={{ height: '8px', background: '#f5f3ff', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${matchPct}%`, background: 'linear-gradient(to right, #a78bfa, #ec4899)', borderRadius: '99px', transition: 'width 0.4s' }} />
          </div>
        </div>

        <div style={{ textAlign: 'center', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '0.6rem', marginBottom: '1.2rem', fontSize: '0.82rem', color: '#7c2d12' }}>
          Both secretly pick which option describes <strong>the same person</strong>. Agree = point! 🎯
        </div>

        {state.phase === 'voting' && (
          <div style={{ textAlign: 'center' }}>
            <h3 className="font-cute" style={{ fontSize: '1.3rem', color: '#4c1d95', marginBottom: '0.5rem' }}>Which one of you is this? 🤔</h3>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Pick which statement fits <em>you</em> — your partner guesses too!</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { vote: 'a' as const, text: q.a },
                { vote: 'b' as const, text: q.b },
              ].map(({ vote, text }) => (
                <button key={vote} onClick={() => handleVote(vote)} disabled={myVote !== null} className="btn-cute"
                  style={{ padding: '1.1rem', fontSize: '1rem', fontWeight: 700, justifyContent: 'center', background: myVote === vote ? '#f5f3ff' : '#fff', border: `2px solid ${myVote === vote ? '#7c3aed' : '#ddd6fe'}`, color: '#4c1d95', transition: 'all 0.2s', whiteSpace: 'normal' }}>
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
            <h3 className="font-cute" style={{ fontSize: '1.3rem', color: '#4c1d95', marginBottom: '1.2rem' }}>What did you both pick? 👀</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
              {[
                { label: 'You picked', vote: myVote },
                { label: `${opponentName || 'Partner'} picked`, vote: theirVote },
              ].map(({ label, vote: v }) => (
                <div key={label} style={{ background: '#f5f3ff', border: '2px solid #ddd6fe', borderRadius: '18px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 700, marginBottom: '0.4rem' }}>{label}</div>
                  <div style={{ fontSize: '0.95rem', color: '#4c1d95', fontWeight: 700, lineHeight: 1.3 }}>
                    {v === 'a' ? q.a : v === 'b' ? q.b : '—'}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: myVote === theirVote ? '#059669' : '#ca8a04', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {myVote === theirVote
                ? <><Check color="#10b981" size={22} /> You agreed! +1 point each! 🎯</>
                : <><X color="#ca8a04" size={22} /> Disagreed — different takes! 🌈</>}
            </div>
            {role === 'host' ? (
              <button onClick={next} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' }}>
                {state.round >= ROUNDS ? 'See Final Results' : 'Next Confession ➡️'}
              </button>
            ) : <p style={{ color: '#8b5cf6', fontSize: '0.9rem' }}>Waiting for host...</p>}
          </div>
        )}

        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '2rem 0', animation: 'pop-in 0.4s ease' }}>
            <Award size={60} color="#7c3aed" style={{ margin: '0 auto 1rem', animation: 'float 3s ease infinite' }} />
            <h2 className="font-cute" style={{ fontSize: '2rem', color: '#4c1d95', marginBottom: '0.5rem' }}>Confessions Complete! 🤭</h2>
            <div style={{ fontSize: '1.1rem', color: '#374151', marginBottom: '2rem' }}>
              You agreed on <strong style={{ color: '#7c3aed', fontSize: '1.4rem' }}>{state.matches}</strong>/{ROUNDS}!<br />
              <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>{matchPct >= 80 ? '🌟 You know each other so well!' : matchPct >= 60 ? '💕 Pretty good understanding!' : '😂 Surprises everywhere!'}</span>
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
