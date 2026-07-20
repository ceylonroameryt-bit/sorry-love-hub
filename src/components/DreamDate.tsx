import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw } from 'lucide-react';

// Dream Date — Build your perfect date from 4 categories, compare compatibility

const CATEGORIES = [
  {
    label: '📍 Location',
    emoji: '📍',
    options: ['Beach Sunset 🌅', 'Cozy Café ☕', 'Forest Picnic 🌲', 'City Rooftop 🌃', 'Stargazing Field 🌌', 'Amusement Park 🎡'],
  },
  {
    label: '💃 Activity',
    emoji: '💃',
    options: ['Dancing 💃', 'Cooking Together 🍳', 'Movie Night 🎬', 'Long Walk 🚶‍♀️', 'Game Night 🎮', 'Swimming 🏊'],
  },
  {
    label: '🍰 Food',
    emoji: '🍰',
    options: ['Italian Pasta 🍝', 'Sushi 🍣', 'Burgers 🍔', 'Ice Cream 🍦', 'Tacos 🌮', 'Ramen 🍜'],
  },
  {
    label: '✨ Vibe',
    emoji: '✨',
    options: ['Romantic 🌹', 'Fun & Silly 🤪', 'Adventurous 🗺️', 'Calm & Peaceful 🕊️', 'Surprising 🎉', 'Nostalgic 🪅'],
  },
];

interface DreamDateState {
  phase: 'building' | 'result';
  hostChoices: (number | null)[];   // one per category
  guestChoices: (number | null)[];
  round: number;
  hostScore: number;
  guestScore: number;
}

const INITIAL: DreamDateState = {
  phase: 'building',
  hostChoices: [null, null, null, null],
  guestChoices: [null, null, null, null],
  round: 1, hostScore: 0, guestScore: 0,
};

const MAX_ROUNDS = 3;

export const DreamDate: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName } = useGamePeer();
  const state: DreamDateState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const myChoices = role === 'host' ? state.hostChoices : state.guestChoices;
  const theirChoices = role === 'host' ? state.guestChoices : state.hostChoices;
  const myScore = role === 'host' ? state.hostScore : state.guestScore;
  const theirScore = role === 'host' ? state.guestScore : state.hostScore;
  const allPicked = myChoices.every(c => c !== null);
  const theirAllPicked = theirChoices.every(c => c !== null);

  const pick = (catIdx: number, optIdx: number) => {
    if (state.phase !== 'building') return;
    const s = stateRef.current;
    const newChoices = [...(role === 'host' ? s.hostChoices : s.guestChoices)];
    newChoices[catIdx] = optIdx;
    const next = role === 'host'
      ? { ...s, hostChoices: newChoices }
      : { ...s, guestChoices: newChoices };

    const theirCurrent = role === 'host' ? s.guestChoices : s.hostChoices;
    const bothDone = newChoices.every(c => c !== null) && theirCurrent.every(c => c !== null);

    if (bothDone) {
      const matches = newChoices.filter((c, i) => c === theirCurrent[i]).length;
      const pts = matches;
      sendGameAction({
        ...next, phase: 'result',
        hostScore: role === 'host' ? s.hostScore + pts : s.hostScore + pts,
        guestScore: role === 'guest' ? s.guestScore + pts : s.guestScore + pts,
      });
    } else {
      sendGameAction(next);
    }
  };

  const nextRound = () => {
    const s = stateRef.current;
    if (s.round >= MAX_ROUNDS) {
      sendGameAction({ ...s, round: MAX_ROUNDS + 1 });
      return;
    }
    sendGameAction({ ...INITIAL, hostScore: s.hostScore, guestScore: s.guestScore, round: s.round + 1 });
  };

  const resetGame = () => sendGameAction({ ...INITIAL });

  const matches = state.phase === 'result'
    ? myChoices.filter((c, i) => c !== null && c === theirChoices[i]).length
    : 0;

  const gameOver = state.round > MAX_ROUNDS;
  const iWon = myScore > theirScore;

  const matchEmojis = ['💔', '💛', '💚', '💙', '💜'];

  return (
    <div className="container-cute" style={{ maxWidth: '680px' }}>
      <div className="card-cute" style={{ background: 'linear-gradient(135deg,#fff0f9,#fdf2f8)', border: '1.5px solid #fbcfe8' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span style={{ background: 'linear-gradient(135deg,#ec4899,#f472b6)', color: '#fff', padding: '0.3rem 0.9rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 700 }}>
            🌙 Dream Date
          </span>
          <button onClick={resetGame} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.6rem' }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Scores */}
        <div style={{ display: 'flex', justifyContent: 'space-around', background: '#fff', borderRadius: '14px', padding: '0.7rem', border: '1px solid #fbcfe8', marginBottom: '1.2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>You 🌙</div>
            <div className="font-cute" style={{ fontSize: '2rem', color: '#ec4899' }}>{myScore}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Round {Math.min(state.round, MAX_ROUNDS)}/{MAX_ROUNDS}</div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Build your dream date!</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{opponentName || 'Partner'} 🌙</div>
            <div className="font-cute" style={{ fontSize: '2rem', color: '#db2777' }}>{theirScore}</div>
          </div>
        </div>

        {/* Game Over */}
        {gameOver && (
          <div style={{ textAlign: 'center', padding: '2rem 0', animation: 'pop-in 0.5s ease' }}>
            <div style={{ fontSize: '4rem', marginBottom: '0.5rem', animation: 'float 1.5s ease infinite' }}>
              {myScore === theirScore ? '💞' : iWon ? '🌹' : '🌸'}
            </div>
            <h2 className="font-cute" style={{ fontSize: '2rem', color: '#9d174d', marginBottom: '0.5rem' }}>
              {myScore === theirScore ? 'Perfect Match! 💞' : iWon ? 'You Win! 🌹' : `${opponentName || 'Partner'} Wins! 🌸`}
            </h2>
            <p style={{ color: '#be185d', fontSize: '1rem', marginBottom: '2rem' }}>
              Final Score: {myScore} – {theirScore} dream matches 💕
            </p>
            {role === 'host' && (
              <button onClick={resetGame} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#ec4899,#f472b6)' }}>
                Play Again 🌙
              </button>
            )}
          </div>
        )}

        {/* Building phase */}
        {!gameOver && state.phase === 'building' && (
          <div>
            {allPicked && !theirAllPicked && (
              <div style={{ textAlign: 'center', padding: '0.5rem', background: '#fdf2f8', borderRadius: '10px', marginBottom: '1rem', color: '#be185d', fontWeight: 600 }}>
                ✅ Dream date set! Waiting for {opponentName || 'partner'}... 💕
              </div>
            )}
            {CATEGORIES.map((cat, catIdx) => (
              <div key={catIdx} style={{ marginBottom: '1.2rem' }}>
                <div style={{ fontFamily: 'var(--font-cute)', color: '#9d174d', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {cat.label}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {cat.options.map((opt, optIdx) => {
                    const selected = myChoices[catIdx] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => !allPicked && pick(catIdx, optIdx)}
                        disabled={allPicked}
                        style={{
                          padding: '0.5rem 0.3rem', borderRadius: '12px',
                          cursor: allPicked ? 'default' : 'pointer',
                          background: selected ? 'linear-gradient(135deg,#ec4899,#f472b6)' : '#fff',
                          color: selected ? '#fff' : '#9d174d', fontSize: '0.78rem', fontWeight: 600,
                          textAlign: 'center', transition: 'all 0.2s',
                          transform: selected ? 'scale(1.05)' : 'scale(1)',
                          boxShadow: selected ? '0 4px 12px rgba(236,72,153,0.35)' : '0 1px 4px rgba(0,0,0,0.05)',
                          border: selected ? 'none' : '1px solid #fbcfe8',
                          opacity: allPicked && !selected ? 0.45 : 1,
                        } as React.CSSProperties}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Result phase */}
        {!gameOver && state.phase === 'result' && (
          <div style={{ animation: 'pop-in 0.5s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.3rem' }}>{matchEmojis[matches] || '💔'}</div>
              <h3 className="font-cute" style={{ color: '#9d174d', fontSize: '1.6rem', margin: '0 0 0.3rem' }}>
                {matches === 4 ? 'Perfect Dream Date! 💞' : matches === 3 ? 'Almost Perfect! 💕' : matches === 2 ? 'Pretty Similar! 💚' : matches === 1 ? 'A Little Match! 💛' : 'Total Opposites! 💔'}
              </h3>
              <p style={{ color: '#be185d', fontSize: '0.9rem' }}>{matches}/4 categories match! +{matches} points each</p>
            </div>

            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1.2rem' }}>
              {CATEGORIES.map((cat, catIdx) => {
                const myOpt = myChoices[catIdx];
                const theirOpt = theirChoices[catIdx];
                const isMatch = myOpt === theirOpt;
                return (
                  <div key={catIdx} style={{
                    display: 'grid', gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center', gap: '0.5rem',
                    background: isMatch ? '#fdf2f8' : '#fff',
                    border: `1.5px solid ${isMatch ? '#f9a8d4' : '#e5e7eb'}`,
                    borderRadius: '12px', padding: '0.6rem 0.8rem',
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#be185d', textAlign: 'right' }}>
                      {myOpt !== null ? cat.options[myOpt] : '—'}
                    </div>
                    <div style={{ fontSize: '1.1rem' }}>{isMatch ? '💞' : '≠'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'left' }}>
                      {theirOpt !== null ? cat.options[theirOpt] : '—'}
                    </div>
                  </div>
                );
              })}
            </div>

            {role === 'host' ? (
              <div style={{ textAlign: 'center' }}>
                <button onClick={nextRound} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#ec4899,#f472b6)' }}>
                  {state.round >= MAX_ROUNDS ? 'See Final Results 🌙' : 'Next Round ➡️'}
                </button>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#be185d', fontSize: '0.9rem' }}>Waiting for host to continue...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
