import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw } from 'lucide-react';

// Treasure Hunt — Battleship-style on a 6x6 grid
// Each player hides 1 treasure. Then take turns guessing.

interface TreasureState {
  phase: 'placing' | 'hunting' | 'won';
  hostTreasure: number | null;    // cell index 0-35
  guestTreasure: number | null;
  hostGuesses: number[];          // cells host has guessed (trying to find guest's treasure)
  guestGuesses: number[];
  currentTurn: 'host' | 'guest'; // whose turn to guess
  winner: 'host' | 'guest' | null;
  round: number;
  hostScore: number;
  guestScore: number;
}

const GRID = 6;
const TOTAL = GRID * GRID;

const INITIAL: TreasureState = {
  phase: 'placing',
  hostTreasure: null, guestTreasure: null,
  hostGuesses: [], guestGuesses: [],
  currentTurn: 'host', winner: null,
  round: 1, hostScore: 0, guestScore: 0,
};

const TERRAIN = ['🌊','🌴','⛰️','🌿','🪨','🏖️','🌺','🦋','🌸','🍄','🌙','⭐','💎','🗺️','🔮','🌈','🦚','🦜','🌻','🦋','🌊','🏝️','🌴','🌿','⛰️','🌸','🍄','⭐','💎','🌙','🔮','🌈','🦚','🦜','🌺','🪨'];

export const TreasureHunt: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName } = useGamePeer();
  const state: TreasureState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const myTreasure = role === 'host' ? state.hostTreasure : state.guestTreasure;
  const theirTreasure = role === 'host' ? state.guestTreasure : state.hostTreasure;
  const myGuesses = role === 'host' ? state.hostGuesses : state.guestGuesses;
  const theirGuesses = role === 'host' ? state.guestGuesses : state.hostGuesses;
  const isMyTurn = state.currentTurn === role;
  const myScore = role === 'host' ? state.hostScore : state.guestScore;
  const theirScore = role === 'host' ? state.guestScore : state.hostScore;

  const placeTreasure = (cell: number) => {
    if (myTreasure !== null) return;
    const s = stateRef.current;
    const next = role === 'host' ? { ...s, hostTreasure: cell } : { ...s, guestTreasure: cell };
    // Both placed → start hunting
    const both = role === 'host'
      ? (next.hostTreasure !== null && s.guestTreasure !== null)
      : (next.guestTreasure !== null && s.hostTreasure !== null);
    if (both) {
      sendGameAction({ ...next, phase: 'hunting' });
    } else {
      sendGameAction(next);
    }
  };

  const guess = (cell: number) => {
    if (!isMyTurn || state.phase !== 'hunting') return;
    if (myGuesses.includes(cell)) return;
    const s = stateRef.current;
    const newMyGuesses = [...myGuesses, cell];
    const hit = cell === theirTreasure;

    const next: TreasureState = role === 'host'
      ? { ...s, hostGuesses: newMyGuesses, currentTurn: 'guest' }
      : { ...s, guestGuesses: newMyGuesses, currentTurn: 'host' };

    if (hit) {
      const winner = role!;
      sendGameAction({
        ...next,
        phase: 'won', winner,
        hostScore: winner === 'host' ? s.hostScore + 1 : s.hostScore,
        guestScore: winner === 'guest' ? s.guestScore + 1 : s.guestScore,
      });
    } else {
      sendGameAction(next);
    }
  };

  const nextRound = () => {
    const s = stateRef.current;
    sendGameAction({ ...INITIAL, hostScore: s.hostScore, guestScore: s.guestScore, round: s.round + 1, currentTurn: s.winner === 'host' ? 'guest' : 'host' });
  };

  const resetGame = () => sendGameAction({ ...INITIAL });
  const iWon = state.winner === role;

  return (
    <div className="container-cute" style={{ maxWidth: '640px' }}>
      <div className="card-cute" style={{ background: '#fff8f0', border: '1.5px solid #fed7aa' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span style={{ background: 'linear-gradient(135deg,#d97706,#f59e0b)', color: '#fff', padding: '0.3rem 0.9rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 700 }}>
            🗺️ Treasure Hunt
          </span>
          <button onClick={resetGame} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.6rem' }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Scores */}
        <div style={{ display: 'flex', justifyContent: 'space-around', background: '#fff', borderRadius: '14px', padding: '0.7rem', border: '1px solid #fed7aa', marginBottom: '1.2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>You 🗺️</div>
            <div className="font-cute" style={{ fontSize: '2rem', color: '#d97706' }}>{myScore}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Round {state.round}</div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Find the treasure!</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{opponentName || 'Partner'} 🗺️</div>
            <div className="font-cute" style={{ fontSize: '2rem', color: '#ea580c' }}>{theirScore}</div>
          </div>
        </div>

        {/* Placing phase */}
        {state.phase === 'placing' && (
          <div>
            <h3 className="font-cute" style={{ color: '#92400e', textAlign: 'center', marginBottom: '0.3rem', fontSize: '1.1rem' }}>
              {myTreasure !== null
                ? `✅ Treasure hidden! Waiting for ${opponentName || 'partner'}...`
                : 'Hide your treasure! 💎'}
            </h3>
            <p style={{ color: '#a16207', fontSize: '0.82rem', textAlign: 'center', marginBottom: '1rem' }}>
              {myTreasure !== null ? '' : 'Tap a cell to hide your treasure chest!'}
            </p>
            <div style={{
              display: 'grid', gridTemplateColumns: `repeat(${GRID}, 1fr)`, gap: '4px',
              borderRadius: '14px', overflow: 'hidden', border: '2px solid #fed7aa',
              maxWidth: '340px', margin: '0 auto',
            }}>
              {Array.from({ length: TOTAL }, (_, i) => (
                <button
                  key={i}
                  onClick={() => placeTreasure(i)}
                  disabled={myTreasure !== null}
                  style={{
                    aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', background: myTreasure === i ? '#fef9c3' : '#fff8f0',
                    border: 'none', cursor: myTreasure !== null ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: myTreasure === i ? 'inset 0 0 0 2px #f59e0b' : 'none',
                  }}
                >
                  {myTreasure === i ? '💎' : TERRAIN[i]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hunting phase */}
        {state.phase === 'hunting' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '0.8rem' }}>
              <div style={{
                display: 'inline-block', padding: '0.4rem 1.2rem', borderRadius: '50px',
                background: isMyTurn ? 'linear-gradient(135deg,#d97706,#f59e0b)' : '#f3f4f6',
                color: isMyTurn ? '#fff' : '#6b7280', fontWeight: 700, fontSize: '0.9rem',
                animation: isMyTurn ? 'pulse-gentle 1.5s infinite' : 'none',
              }}>
                {isMyTurn ? '🎯 Your turn to guess!' : `⏳ ${opponentName || 'Partner'}'s turn...`}
              </div>
            </div>

            {/* Opponent's grid — where we guess */}
            <h4 style={{ color: '#92400e', textAlign: 'center', fontSize: '0.88rem', marginBottom: '0.4rem' }}>
              Guess where {opponentName || 'partner'} hid their treasure 🔍
            </h4>
            <div style={{
              display: 'grid', gridTemplateColumns: `repeat(${GRID}, 1fr)`, gap: '4px',
              borderRadius: '14px', overflow: 'hidden', border: '2px solid #fed7aa',
              maxWidth: '340px', margin: '0 auto 1rem',
            }}>
              {Array.from({ length: TOTAL }, (_, i) => {
                const guessed = myGuesses.includes(i);
                const hit = guessed && i === theirTreasure;
                const miss = guessed && !hit;
                return (
                  <button
                    key={i}
                    onClick={() => isMyTurn && !guessed && guess(i)}
                    style={{
                      aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.3rem',
                      background: hit ? '#fef9c3' : miss ? '#fee2e2' : isMyTurn ? '#fff8f0' : '#f9fafb',
                      border: 'none', cursor: isMyTurn && !guessed ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                      transform: isMyTurn && !guessed ? 'scale(1)' : 'scale(1)',
                    }}
                    onMouseEnter={e => { if (isMyTurn && !guessed) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
                  >
                    {hit ? '💎' : miss ? '💦' : guessed ? '💦' : '❓'}
                  </button>
                );
              })}
            </div>

            {/* My grid — showing their guesses */}
            <h4 style={{ color: '#92400e', textAlign: 'center', fontSize: '0.88rem', marginBottom: '0.4rem' }}>
              Your treasure grid 💎 (their guesses shown)
            </h4>
            <div style={{
              display: 'grid', gridTemplateColumns: `repeat(${GRID}, 1fr)`, gap: '4px',
              borderRadius: '14px', overflow: 'hidden', border: '2px solid #fed7aa',
              maxWidth: '340px', margin: '0 auto',
            }}>
              {Array.from({ length: TOTAL }, (_, i) => {
                const isMyHidden = i === myTreasure;
                const theyGuessed = theirGuesses.includes(i);
                const theyHit = theyGuessed && isMyHidden;
                return (
                  <div
                    key={i}
                    style={{
                      aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem',
                      background: theyHit ? '#fee2e2' : isMyHidden ? '#fef9c3' : theyGuessed ? '#dbeafe' : '#fff8f0',
                    }}
                  >
                    {isMyHidden ? '💎' : theyGuessed ? '🎯' : TERRAIN[i]}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Won phase */}
        {state.phase === 'won' && (
          <div style={{ textAlign: 'center', padding: '2rem 0', animation: 'pop-in 0.5s ease' }}>
            <div style={{ fontSize: '4rem', marginBottom: '0.5rem', animation: 'float 1.5s ease infinite' }}>{iWon ? '🏆' : '💦'}</div>
            <h2 className="font-cute" style={{ fontSize: '2rem', color: iWon ? '#d97706' : '#6b7280', marginBottom: '0.5rem' }}>
              {iWon ? 'Found It! 🎉' : `${opponentName || 'Partner'} Found It! 💎`}
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>Score: {myScore} – {theirScore}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              {role === 'host' && (
                <button onClick={nextRound} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#d97706,#f59e0b)' }}>
                  Next Round 🗺️
                </button>
              )}
              <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary">Back to Lobby</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
