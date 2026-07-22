import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw } from 'lucide-react';
import { GameHeader } from './GameHeader';

const GRID = 6;
const TOTAL = GRID * GRID;

interface TreasureState {
  phase: 'placing' | 'hunting' | 'won';
  hostTreasure: number | null;
  guestTreasure: number | null;
  hostGuesses: number[];
  guestGuesses: number[];
  currentTurn: 'host' | 'guest';
  winner: 'host' | 'guest' | null;
  round: number;
  hostScore: number;
  guestScore: number;
}

const INITIAL: TreasureState = {
  phase: 'placing',
  hostTreasure: null, guestTreasure: null,
  hostGuesses: [], guestGuesses: [],
  currentTurn: 'host', winner: null,
  round: 1, hostScore: 0, guestScore: 0,
};

const TERRAIN = ['🌊','🌴','⛰️','🌿','🪨','🏖️','🌺','🦋','🌸','🍄','🌙','⭐','💎','🗺️','🔮','🌈','🦚','🦜','🌻','🦋','🌊','🏝️','🌴','🌿','⛰️','🌸','🍄','⭐','💎','🌙','🔮','🌈','🦚','🦜','🌺','🪨'];

export const TreasureHunt: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INITIAL);
    }
  }, [role, gameState, sendGameAction]);

  const state: TreasureState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const myTreasure = role === 'host' ? state.hostTreasure : state.guestTreasure;
  const theirTreasure = role === 'host' ? state.guestTreasure : state.hostTreasure;
  const myGuesses = role === 'host' ? state.hostGuesses : state.guestGuesses;
  const isMyTurn = state.currentTurn === role;
  const myScore = role === 'host' ? state.hostScore : state.guestScore;
  const theirScore = role === 'host' ? state.guestScore : state.hostScore;

  const placeTreasure = (cell: number) => {
    if (myTreasure !== null) return;
    const s = stateRef.current;
    const next = role === 'host' ? { ...s, hostTreasure: cell } : { ...s, guestTreasure: cell };
    const both = role === 'host'
      ? (next.hostTreasure !== null && s.guestTreasure !== null)
      : (next.guestTreasure !== null && s.hostTreasure !== null);
    if (both) {
      sendGameAction({ ...next, phase: 'hunting' });
    } else {
      sendGameAction(next);
    }
  };

  const makeGuess = (cell: number) => {
    if (!isMyTurn || state.phase !== 'hunting' || myGuesses.includes(cell)) return;
    const s = stateRef.current;
    const newGuesses = [...myGuesses, cell];
    const isHit = cell === theirTreasure;

    let hScore = s.hostScore;
    let gScore = s.guestScore;
    if (isHit) {
      if (role === 'host') hScore += 1;
      else gScore += 1;
    }

    const nextState: TreasureState = role === 'host'
      ? { ...s, hostGuesses: newGuesses, hostScore: hScore }
      : { ...s, guestGuesses: newGuesses, guestScore: gScore };

    if (isHit) {
      nextState.phase = 'won';
      nextState.winner = role;
    } else {
      nextState.currentTurn = role === 'host' ? 'guest' : 'host';
    }

    sendGameAction(nextState);
  };

  const resetAll = () => sendGameAction(INITIAL);

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Treasure Hunt"
        emoji="💎"
        instructions={[
          "Placement Phase: Tap any tile on the 6x6 grid to hide your 💎 treasure.",
          "Hunting Phase: Take turns digging up tiles on your partner's island.",
          "Hit tiles reveal 🌊 water splash or 💎 hidden treasure!",
          "First player to discover the opponent's treasure wins!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: isMyTurn ? '#dcfce7' : '#ede9fe', color: isMyTurn ? '#15803d' : '#6d28d9' }}>
            {state.phase === 'placing' ? '💎 Hiding Phase' : state.phase === 'won' ? 'Treasure Uncovered' : isMyTurn ? '✨ YOUR TURN TO DIG' : `⏳ ${opponentName || 'Partner'}'s Turn`}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>You: {myScore}</span>
            <span style={{ color: '#ec4899' }}>{opponentName || 'Partner'}: {theirScore}</span>
          </div>
        </div>

        {/* PLACING PHASE */}
        {state.phase === 'placing' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#0284c7', fontWeight: 700 }}>
                {myTreasure === null ? 'Tap a cell to hide your secret 💎 treasure!' : '✅ Treasure hidden! Waiting for partner... ⏳'}
              </span>
            </div>

            <div className="game-board-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.4rem', marginBottom: '1.5rem' }}>
              {Array.from({ length: TOTAL }).map((_, idx) => {
                const isMine = myTreasure === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => placeTreasure(idx)}
                    disabled={myTreasure !== null}
                    style={{
                      aspectRatio: '1 / 1',
                      background: isMine ? '#fef9c3' : '#ffffff',
                      border: isMine ? '2px solid #ca8a04' : '1.5px solid #ddd6fe',
                      borderRadius: '12px',
                      fontSize: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: myTreasure === null ? 'pointer' : 'default'
                    }}
                  >
                    {isMine ? '💎' : TERRAIN[idx]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* HUNTING / WON PHASE */}
        {(state.phase === 'hunting' || state.phase === 'won') && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '0.8rem', fontWeight: 700, color: '#0284c7', fontSize: '0.9rem' }}>
              Partner's Island Grid (Dig for 💎):
            </div>

            <div className="game-board-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.4rem', marginBottom: '1.5rem' }}>
              {Array.from({ length: TOTAL }).map((_, idx) => {
                const isGuessed = myGuesses.includes(idx);
                const isHit = isGuessed && idx === theirTreasure;

                return (
                  <button
                    key={idx}
                    onClick={() => makeGuess(idx)}
                    disabled={!isMyTurn || isGuessed}
                    style={{
                      aspectRatio: '1 / 1',
                      background: isHit ? '#fef9c3' : isGuessed ? '#e0f2fe' : '#ffffff',
                      border: isHit ? '2px solid #ca8a04' : isGuessed ? '1.5px solid #0284c7' : '1.5px solid #ddd6fe',
                      borderRadius: '12px',
                      fontSize: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isMyTurn && !isGuessed ? 'pointer' : 'default'
                    }}
                  >
                    {isHit ? '💎' : isGuessed ? '🌊' : TERRAIN[idx]}
                  </button>
                );
              })}
            </div>

            {state.phase === 'won' && (
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.4rem', color: state.winner === role ? '#059669' : '#dc2626', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
                  {state.winner === role ? '🎉 You Discovered the Treasure!' : `💔 ${opponentName || 'Partner'} Found Your Treasure!`}
                </h3>
                {role === 'host' && (
                  <button onClick={resetAll} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem' }}>
                    <RefreshCw size={16} /> Play Next Round
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
