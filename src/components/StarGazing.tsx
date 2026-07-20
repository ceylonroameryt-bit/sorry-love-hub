import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw } from 'lucide-react';

// Star Gazing — both players silently pick 3 stars from a 5x5 grid
// Then reveal which stars they share ✨

interface StarState {
  phase: 'picking' | 'waiting' | 'result';
  hostPicks: number[];
  guestPicks: number[];
  round: number;
  hostScore: number;
  guestScore: number;
}

const INITIAL: StarState = {
  phase: 'picking',
  hostPicks: [],
  guestPicks: [],
  round: 1,
  hostScore: 0,
  guestScore: 0,
};

const STAR_NAMES = [
  'Sirius','Rigel','Betelgeuse','Polaris','Vega',
  'Altair','Deneb','Aldebaran','Antares','Canopus',
  'Capella','Procyon','Spica','Fomalhaut','Regulus',
  'Castor','Pollux','Mimosa','Acrux','Shaula',
  'Alnilam','Mira','Zeta','Alphard','Thuban',
];

const MAX_PICKS = 3;
const MAX_ROUNDS = 5;

export const StarGazing: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName } = useGamePeer();
  const state: StarState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const myPicks = role === 'host' ? state.hostPicks : state.guestPicks;
  const myScore = role === 'host' ? state.hostScore : state.guestScore;
  const theirScore = role === 'host' ? state.guestScore : state.hostScore;

  const iWaiting = state.phase === 'waiting' || (state.phase === 'picking' && myPicks.length === MAX_PICKS);

  const toggleStar = (idx: number) => {
    if (state.phase !== 'picking') return;
    if (myPicks.length >= MAX_PICKS && !myPicks.includes(idx)) return;
    const s = stateRef.current;
    const newMyPicks = myPicks.includes(idx)
      ? myPicks.filter(i => i !== idx)
      : [...myPicks, idx];

    const next: StarState = role === 'host'
      ? { ...s, hostPicks: newMyPicks }
      : { ...s, guestPicks: newMyPicks };

    // Auto-submit when 3 picked
    if (newMyPicks.length === MAX_PICKS) {
      const submitted: StarState = { ...next, phase: 'waiting' };
      // If both are now submitted
      const theirCurrent = role === 'host' ? s.guestPicks : s.hostPicks;
      if (theirCurrent.length === MAX_PICKS) {
        resolveRound(submitted);
        return;
      }
      sendGameAction(submitted);
    } else {
      sendGameAction(next);
    }
  };

  const resolveRound = (s: StarState) => {
    const shared = s.hostPicks.filter(i => s.guestPicks.includes(i)).length;
    const bonusHost = shared;
    const bonusGuest = shared;
    const next: StarState = {
      ...s,
      phase: 'result',
      hostScore: s.hostScore + bonusHost,
      guestScore: s.guestScore + bonusGuest,
    };
    sendGameAction(next);
  };

  // Watch for partner submitting while we're already waiting
  useEffect(() => {
    const s = stateRef.current;
    if (s.phase === 'waiting') {
      const bothReady = s.hostPicks.length === MAX_PICKS && s.guestPicks.length === MAX_PICKS;
      if (bothReady && role === 'host') {
        resolveRound(s);
      }
    }
  }, [state]);

  const nextRound = () => {
    const s = stateRef.current;
    if (s.round >= MAX_ROUNDS) {
      sendGameAction({ ...INITIAL, hostScore: s.hostScore, guestScore: s.guestScore, round: MAX_ROUNDS + 1, phase: 'result' });
      return;
    }
    sendGameAction({ ...s, phase: 'picking', hostPicks: [], guestPicks: [], round: s.round + 1 });
  };

  const resetGame = () => sendGameAction({ ...INITIAL });

  const shared = state.phase === 'result' ? state.hostPicks.filter(i => state.guestPicks.includes(i)) : [];
  const gameOver = state.round > MAX_ROUNDS;
  const iWon = myScore > theirScore;

  return (
    <div className="container-cute" style={{ maxWidth: '640px' }}>
      <div className="card-cute" style={{ background: 'linear-gradient(180deg,#0f0c29,#1a1040,#302b63)', border: '1.5px solid #4c1d95', color: '#e9d5ff' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', background: 'rgba(255,255,255,0.1)', borderColor: '#7c3aed', color: '#e9d5ff' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span style={{ background: 'linear-gradient(135deg,#7c3aed,#c4b5fd)', padding: '0.3rem 0.9rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 700 }}>
            ⭐ Star Gazing
          </span>
          <button onClick={resetGame} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid #7c3aed', borderRadius: '8px', padding: '0.4rem 0.6rem', cursor: 'pointer', color: '#e9d5ff' }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Scores */}
        <div style={{ display: 'flex', justifyContent: 'space-around', background: 'rgba(255,255,255,0.07)', borderRadius: '14px', padding: '0.8rem', marginBottom: '1.2rem', border: '1px solid rgba(124,58,237,0.3)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#c4b5fd' }}>You ⭐</div>
            <div className="font-cute" style={{ fontSize: '2rem', color: '#c4b5fd' }}>{myScore}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#a78bfa' }}>Round {Math.min(state.round, MAX_ROUNDS)}/{MAX_ROUNDS}</div>
            <div style={{ fontSize: '0.8rem', color: '#7c3aed' }}>Shared = points!</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#f9a8d4' }}>{opponentName || 'Partner'} ⭐</div>
            <div className="font-cute" style={{ fontSize: '2rem', color: '#f9a8d4' }}>{theirScore}</div>
          </div>
        </div>

        {/* Game Over */}
        {gameOver && (
          <div style={{ textAlign: 'center', padding: '2rem 0', animation: 'pop-in 0.5s ease' }}>
            <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>{iWon ? '🌟' : myScore === theirScore ? '🤝' : '💫'}</div>
            <h2 className="font-cute" style={{ fontSize: '2rem', color: '#c4b5fd', marginBottom: '0.5rem' }}>
              {iWon ? 'You Win! 🌟' : myScore === theirScore ? "It's a Tie! 🤝" : `${opponentName || 'Partner'} Wins! ✨`}
            </h2>
            <p style={{ color: '#a78bfa', marginBottom: '2rem' }}>Final: {myScore} – {theirScore} shared stars</p>
            {role === 'host' && (
              <button onClick={resetGame} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
                Play Again ⭐
              </button>
            )}
          </div>
        )}

        {/* Picking phase */}
        {!gameOver && state.phase !== 'result' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <p style={{ color: '#c4b5fd', fontSize: '0.9rem' }}>
                {iWaiting
                  ? `✅ You picked ${MAX_PICKS} stars! Waiting for ${opponentName || 'partner'}...`
                  : `Pick ${MAX_PICKS - myPicks.length} more star${MAX_PICKS - myPicks.length !== 1 ? 's' : ''}! 🌌`}
              </p>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem',
              marginBottom: '1rem',
            }}>
              {STAR_NAMES.map((name, i) => {
                const isMyPick = myPicks.includes(i);
                const isDisabled = (myPicks.length >= MAX_PICKS && !isMyPick) || iWaiting;
                return (
                  <button
                    key={i}
                    onClick={() => !iWaiting && toggleStar(i)}
                    disabled={isDisabled}
                    style={{
                      padding: '0.5rem 0.3rem', borderRadius: '10px', border: 'none',
                      cursor: isDisabled ? 'default' : 'pointer',
                      background: isMyPick
                        ? 'linear-gradient(135deg,#7c3aed,#a78bfa)'
                        : 'rgba(255,255,255,0.07)',
                      color: isMyPick ? '#fff' : '#c4b5fd',
                      fontSize: '0.72rem', fontWeight: 600, textAlign: 'center',
                      transition: 'all 0.2s ease',
                      transform: isMyPick ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: isMyPick ? '0 4px 12px rgba(124,58,237,0.5)' : 'none',
                      opacity: isDisabled && !isMyPick ? 0.4 : 1,
                    }}
                  >
                    {isMyPick ? '⭐' : '✦'}<br />{name}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Result phase */}
        {!gameOver && state.phase === 'result' && (
          <div style={{ textAlign: 'center', animation: 'pop-in 0.5s ease' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
              {shared.length === 3 ? '🌠' : shared.length === 2 ? '✨' : shared.length === 1 ? '⭐' : '🌑'}
            </div>
            <h3 className="font-cute" style={{ color: '#c4b5fd', fontSize: '1.8rem', marginBottom: '0.5rem' }}>
              {shared.length === 0 ? 'No Shared Stars!' : `${shared.length} Shared Star${shared.length > 1 ? 's' : ''}! ✨`}
            </h3>
            {shared.length > 0 && (
              <p style={{ color: '#a78bfa', marginBottom: '0.5rem' }}>
                You both chose: {shared.map(i => STAR_NAMES[i]).join(', ')}
              </p>
            )}
            <p style={{ color: '#c4b5fd', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              +{shared.length} points each!
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Your Stars', picks: role === 'host' ? state.hostPicks : state.guestPicks, color: '#c4b5fd' },
                { label: `${opponentName || 'Partner'}'s Stars`, picks: role === 'host' ? state.guestPicks : state.hostPicks, color: '#f9a8d4' },
              ].map(({ label, picks, color }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '12px', padding: '0.8rem 1.2rem', minWidth: '140px' }}>
                  <div style={{ fontSize: '0.75rem', color, marginBottom: '0.3rem' }}>{label}</div>
                  {picks.map(i => (
                    <div key={i} style={{ fontSize: '0.82rem', color: shared.includes(i) ? '#fbbf24' : color }}>
                      {shared.includes(i) ? '⭐' : '✦'} {STAR_NAMES[i]}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {role === 'host' ? (
              <button onClick={nextRound} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
                {state.round >= MAX_ROUNDS ? 'See Final Results 🌟' : 'Next Round ➡️'}
              </button>
            ) : (
              <p style={{ color: '#a78bfa', fontSize: '0.9rem' }}>Waiting for host...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
