import React, { useEffect } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw, Heart } from 'lucide-react';
import { GameHeader } from './GameHeader';

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
  qOrder: number[];
  hostVote: 'a' | 'b' | null;
  guestVote: 'a' | 'b' | null;
  matches: number;
}

const ROUNDS = 8;

function makeInitial(): ConfState {
  const pool = [...Array(QUESTIONS.length).keys()];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return {
    phase: 'voting',
    round: 1,
    qIndex: 0,
    qOrder: pool.slice(0, ROUNDS),
    hostVote: null,
    guestVote: null,
    matches: 0
  };
}

export const CoupleConfessions: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization for fresh shuffled questions
  useEffect(() => {
    if (role === 'host' && (!gameState || !gameState.qOrder)) {
      sendGameAction(makeInitial());
    }
  }, [role, gameState, sendGameAction]);

  const state: ConfState = gameState ?? makeInitial();

  const qOrder = state.qOrder ?? [...Array(QUESTIONS.length).keys()].slice(0, ROUNDS);
  const currentIdx = qOrder[state.qIndex % qOrder.length] ?? 0;
  const q = QUESTIONS[currentIdx];

  const myVote = role === 'host' ? state.hostVote : state.guestVote;
  const theirVote = role === 'host' ? state.guestVote : state.hostVote;

  const handleVote = (vote: 'a' | 'b') => {
    if (myVote !== null || state.phase !== 'voting') return;
    const ns = { ...state };
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
      guestVote: null,
    });
  };

  const reset = () => sendGameAction(makeInitial());

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Couple Confessions"
        emoji="🤭"
        instructions={[
          "Read two contrasting habits or confessions.",
          "Secretly pick which option describes the situation best!",
          "If both of you choose the same option, you earn a Sync Match point!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            Confession {state.round} of {ROUNDS}
          </span>
          <span className="badge-cute" style={{ background: '#fce7f3', color: '#db2777' }}>
            <Heart size={14} fill="#db2777" /> Matches: {state.matches}
          </span>
        </div>

        {/* Ended Phase */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🤭💖</div>
            <h2 className="heading-lg" style={{ color: '#db2777', marginBottom: '0.5rem' }}>
              Confessions Complete!
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              You matched on <strong>{state.matches} out of {ROUNDS}</strong> confessions!
            </p>
            {role === 'host' && (
              <button onClick={reset} className="btn-cute btn-cute-primary" style={{ padding: '0.7rem 1.8rem', background: '#db2777', borderColor: '#db2777' }}>
                <RefreshCw size={18} /> Play Again
              </button>
            )}
          </div>
        )}

        {/* Voting or Reveal Phase */}
        {state.phase !== 'ended' && (
          <div>
            <h3 style={{ textAlign: 'center', fontFamily: 'var(--font-world)', color: '#4c1d95', fontSize: '1.3rem', marginBottom: '1.2rem' }}>
              Which describes your relationship best?
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Option A */}
              <button
                onClick={() => handleVote('a')}
                disabled={myVote !== null || state.phase !== 'voting'}
                style={{
                  background: myVote === 'a' ? '#f3e8ff' : '#ffffff',
                  border: myVote === 'a' ? '2.5px solid #7c3aed' : '2px solid #ddd6fe',
                  borderRadius: '18px',
                  padding: '1.2rem 1rem',
                  cursor: myVote === null && state.phase === 'voting' ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(124,58,237,0.06)'
                }}
              >
                <span style={{ fontSize: '1.05rem', color: '#1e1b4b', fontWeight: 600, fontFamily: 'var(--font-cute)' }}>
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
                  padding: '1.2rem 1rem',
                  cursor: myVote === null && state.phase === 'voting' ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(236,72,153,0.06)'
                }}
              >
                <span style={{ fontSize: '1.05rem', color: '#1e1b4b', fontWeight: 600, fontFamily: 'var(--font-cute)' }}>
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
                    : 'Pick the option that fits best!'}
                </div>
              )}

              {state.phase === 'reveal' && (
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: state.hostVote === state.guestVote ? '#059669' : '#db2777', marginBottom: '0.6rem' }}>
                    {state.hostVote === state.guestVote ? '✨ You both agreed!' : '💭 You chose differently!'}
                  </div>
                  {role === 'host' && (
                    <button onClick={next} className="btn-cute btn-cute-primary" style={{ padding: '0.5rem 1.4rem', background: '#db2777', borderColor: '#db2777' }}>
                      Next Confession ➔
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
