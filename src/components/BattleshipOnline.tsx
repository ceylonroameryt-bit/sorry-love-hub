import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw } from 'lucide-react';
import { GameHeader } from './GameHeader';

interface BattleshipState {
  phase: 'placement' | 'playing' | 'ended';
  hostShips: number[];
  guestShips: number[];
  hostShots: number[];
  guestShots: number[];
  turn: 'host' | 'guest';
  winner: 'host' | 'guest' | null;
  hostScore: number;
  guestScore: number;
}

const SHIP_SIZES = [4, 3, 3, 2, 2];
const NUM_SHIPS = SHIP_SIZES.reduce((a, b) => a + b, 0); // 14 cells

const INITIAL: BattleshipState = {
  phase: 'placement',
  hostShips: [],
  guestShips: [],
  hostShots: [],
  guestShots: [],
  turn: 'host',
  winner: null,
  hostScore: 0,
  guestScore: 0,
};

export const BattleshipOnline: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INITIAL);
    }
  }, [role, gameState, sendGameAction]);

  const state: BattleshipState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const myShips = role === 'host' ? state.hostShips : state.guestShips;
  const theirShips = role === 'host' ? state.guestShips : state.hostShips;
  const myShots = role === 'host' ? state.hostShots : state.guestShots;
  const myPlaced = myShips.length >= NUM_SHIPS;
  const isMyTurn = state.turn === role && state.phase === 'playing';

  const toggleShipPlacement = (idx: number) => {
    const s = stateRef.current;
    if (s.phase !== 'placement') return;
    const current = [...myShips];
    const pos = current.indexOf(idx);
    if (pos >= 0) {
      current.splice(pos, 1);
    } else {
      if (current.length >= NUM_SHIPS) return;
      current.push(idx);
    }

    const nextState: BattleshipState = role === 'host'
      ? { ...s, hostShips: current }
      : { ...s, guestShips: current };

    if (nextState.hostShips.length >= NUM_SHIPS && nextState.guestShips.length >= NUM_SHIPS) {
      nextState.phase = 'playing';
    }

    sendGameAction(nextState);
  };

  const shoot = (targetIdx: number) => {
    if (!isMyTurn || myShots.includes(targetIdx)) return;
    const s = stateRef.current;
    const nextMyShots = [...myShots, targetIdx];

    // Check if target was a hit
    const hits = nextMyShots.filter(idx => theirShips.includes(idx)).length;
    const won = hits >= NUM_SHIPS;

    const nextState: BattleshipState = role === 'host'
      ? { ...s, hostShots: nextMyShots }
      : { ...s, guestShots: nextMyShots };

    if (won) {
      nextState.winner = role;
      nextState.phase = 'ended';
      if (role === 'host') nextState.hostScore += 1;
      else nextState.guestScore += 1;
    } else {
      nextState.turn = role === 'host' ? 'guest' : 'host';
    }

    sendGameAction(nextState);
  };

  const resetAll = () => sendGameAction(INITIAL);

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Battleship Fleet"
        emoji="🚢"
        instructions={[
          "Placement Phase: Tap 14 cells on your grid to place your naval fleet.",
          "Battle Phase: Take turns shooting at your opponent's grid.",
          "Hits reveal 🔥 explosion, while misses reveal 🌊 water.",
          "Sinking all 14 opponent ship cells wins the battle!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: isMyTurn ? '#dcfce7' : '#ede9fe', color: isMyTurn ? '#15803d' : '#6d28d9' }}>
            {state.phase === 'placement' ? '🚢 Placement Phase' : state.phase === 'ended' ? 'Battle Complete' : isMyTurn ? '✨ YOUR TURN TO FIRE' : `⏳ ${opponentName || 'Partner'}'s Turn`}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>Host: {state.hostScore}</span>
            <span style={{ color: '#ec4899' }}>Guest: {state.guestScore}</span>
          </div>
        </div>

        {/* PLACEMENT PHASE */}
        {state.phase === 'placement' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#0284c7', fontWeight: 700 }}>
                Place your ships ({myShips.length} / {NUM_SHIPS} cells placed)
              </span>
            </div>

            <div className="game-board-responsive" style={{ background: '#0284c7', padding: '0.4rem', borderRadius: '16px', display: 'grid', gridTemplateRows: 'repeat(10, 1fr)', gap: '0.2rem', marginBottom: '1.5rem' }}>
              {Array.from({ length: 100 }).map((_, idx) => {
                const isShip = myShips.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleShipPlacement(idx)}
                    style={{
                      aspectRatio: '1 / 1',
                      background: isShip ? '#7c3aed' : '#38bdf8',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem'
                    }}
                  >
                    {isShip ? '🚢' : ''}
                  </button>
                );
              })}
            </div>

            <div style={{ textAlign: 'center', color: myPlaced ? '#059669' : '#6b7280', fontSize: '0.9rem', fontWeight: 600 }}>
              {myPlaced ? `✅ Fleet deployed! Waiting for ${opponentName || 'partner'}... ⏳` : 'Tap 14 cells to deploy your fleet!'}
            </div>
          </div>
        )}

        {/* BATTLE / ENDED PHASE */}
        {(state.phase === 'playing' || state.phase === 'ended') && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '0.8rem', fontWeight: 700, color: '#0284c7', fontSize: '0.9rem' }}>
              Target Opponent Board:
            </div>

            <div className="game-board-responsive" style={{ background: '#0284c7', padding: '0.4rem', borderRadius: '16px', display: 'grid', gridTemplateRows: 'repeat(10, 1fr)', gap: '0.2rem', marginBottom: '1.5rem' }}>
              {Array.from({ length: 100 }).map((_, idx) => {
                const isShot = myShots.includes(idx);
                const isHit = isShot && theirShips.includes(idx);

                return (
                  <button
                    key={idx}
                    onClick={() => shoot(idx)}
                    disabled={!isMyTurn || isShot}
                    style={{
                      aspectRatio: '1 / 1',
                      background: isHit ? '#ef4444' : isShot ? '#0284c7' : '#38bdf8',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isMyTurn && !isShot ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem'
                    }}
                  >
                    {isHit ? '🔥' : isShot ? '🌊' : ''}
                  </button>
                );
              })}
            </div>

            {state.phase === 'ended' && (
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.4rem', color: state.winner === role ? '#059669' : '#dc2626', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
                  {state.winner === role ? '🎉 Enemy Fleet Destroyed!' : `💔 ${opponentName || 'Partner'} Sunk Your Fleet!`}
                </h3>
                {role === 'host' && (
                  <button onClick={resetAll} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem' }}>
                    <RefreshCw size={16} /> Play Next Battle
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
