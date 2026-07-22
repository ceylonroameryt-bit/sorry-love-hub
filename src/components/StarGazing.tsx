import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw } from 'lucide-react';
import { GameHeader } from './GameHeader';

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
  const { role, sendGameAction, gameState } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INITIAL);
    }
  }, [role, gameState, sendGameAction]);

  const state: StarState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const myPicks = role === 'host' ? state.hostPicks : state.guestPicks;
  const myScore = role === 'host' ? state.hostScore : state.guestScore;

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

    const hDone = next.hostPicks.length === MAX_PICKS;
    const gDone = next.guestPicks.length === MAX_PICKS;

    if (hDone && gDone) {
      const shared = next.hostPicks.filter(p => next.guestPicks.includes(p)).length;
      next.phase = 'result';
      next.hostScore = s.hostScore + shared;
      next.guestScore = s.guestScore + shared;
    }
    sendGameAction(next);
  };

  const nextRound = () => {
    if (role !== 'host') return;
    if (state.round >= MAX_ROUNDS) {
      sendGameAction(INITIAL);
    } else {
      sendGameAction({
        ...state,
        phase: 'picking',
        hostPicks: [],
        guestPicks: [],
        round: state.round + 1,
      });
    }
  };

  const resetAll = () => sendGameAction(INITIAL);

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Star Gazing"
        emoji="✨"
        instructions={[
          "Select exactly 3 constellation stars silently from the 5x5 grid.",
          "Once both partners select 3 stars, the night sky reveals your shared stars!",
          "Score 1 point for every matching star you both picked!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            Night Sky {state.round} of {MAX_ROUNDS}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#ca8a04' }}>Shared Stars Score: {myScore}</span>
          </div>
        </div>

        {/* PICKING PHASE */}
        {state.phase === 'picking' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: 600 }}>
                Selected: <strong>{myPicks.length} / {MAX_PICKS}</strong> stars
              </span>
            </div>

            <div className="game-board-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
              {STAR_NAMES.map((name, idx) => {
                const isSelected = myPicks.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleStar(idx)}
                    disabled={myPicks.length >= MAX_PICKS && !isSelected}
                    style={{
                      background: isSelected ? '#fef9c3' : '#ffffff',
                      border: isSelected ? '2px solid #ca8a04' : '1.5px solid #ddd6fe',
                      borderRadius: '12px',
                      padding: '0.6rem 0.2rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span style={{ fontSize: '1.4rem' }}>{isSelected ? '⭐' : '✨'}</span>
                    <span style={{ fontSize: '0.7rem', color: '#1e1b4b', fontWeight: 600, fontFamily: 'var(--font-cute)' }}>
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* RESULT PHASE */}
        {state.phase === 'result' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <h3 style={{ fontSize: '1.4rem', color: '#ca8a04', fontFamily: 'var(--font-world)', marginBottom: '1.2rem' }}>
              Night Sky Alignment ✨
            </h3>

            <div className="game-board-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {STAR_NAMES.map((name, idx) => {
                const hPicked = state.hostPicks.includes(idx);
                const gPicked = state.guestPicks.includes(idx);
                const matched = hPicked && gPicked;

                let bg = '#ffffff';
                let border = '#ddd6fe';
                let emoji = '✨';

                if (matched) {
                  bg = '#dcfce7'; border = '#22c55e'; emoji = '🌟';
                } else if (hPicked || gPicked) {
                  bg = '#fef9c3'; border = '#ca8a04'; emoji = '⭐';
                }

                return (
                  <div
                    key={idx}
                    style={{
                      background: bg,
                      border: `1.5px solid ${border}`,
                      borderRadius: '12px',
                      padding: '0.6rem 0.2rem',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span style={{ fontSize: '1.4rem' }}>{emoji}</span>
                    <span style={{ fontSize: '0.7rem', color: '#1e1b4b', fontWeight: 600 }}>{name}</span>
                  </div>
                );
              })}
            </div>

            {role === 'host' && (
              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
                <button onClick={nextRound} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem', background: '#ca8a04', borderColor: '#ca8a04' }}>
                  Next Sky ➔
                </button>
                <button onClick={resetAll} className="btn-cute btn-cute-secondary" style={{ padding: '0.65rem 1rem' }}>
                  <RefreshCw size={16} /> Reset
                </button>
              </div>
            )}
            {role === 'guest' && (
              <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Waiting for host to continue...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
