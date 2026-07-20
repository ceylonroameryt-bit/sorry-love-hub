import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw } from 'lucide-react';

// Battleship Online — Each player places 5 ships then takes turns shooting
interface BattleshipState {
  phase: 'placement' | 'playing' | 'ended';
  hostShips: number[];    // indices on 10x10 = 100 cells
  guestShips: number[];
  hostShots: number[];    // indices host shot on guest board
  guestShots: number[];   // indices guest shot on host board
  turn: 'host' | 'guest';
  winner: 'host' | 'guest' | null;
  hostScore: number;
  guestScore: number;
}

const GRID = 10;
const TOTAL = GRID * GRID;
const SHIP_SIZES = [4, 3, 3, 2, 2]; // sizes to place
const NUM_SHIPS = SHIP_SIZES.reduce((a, b) => a + b, 0); // total ship cells = 14

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
  const { role, sendGameAction, gameState, selectGame, opponentName, playerName } = useGamePeer();
  const state: BattleshipState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const myShips = role === 'host' ? state.hostShips : state.guestShips;
  const theirShips = role === 'host' ? state.guestShips : state.hostShips;
  const myShots = role === 'host' ? state.hostShots : state.guestShots;
  const theirShots = role === 'host' ? state.guestShots : state.hostShots;
  const myPlaced = myShips.length >= NUM_SHIPS;
  const theirPlaced = theirShips.length >= NUM_SHIPS;
  const isMyTurn = state.turn === role && state.phase === 'playing';

  const toggleShipPlacement = (idx: number) => {
    const s = stateRef.current;
    if (myPlaced) return;
    const key = role === 'host' ? 'hostShips' : 'guestShips';
    const current = [...myShips];
    const pos = current.indexOf(idx);
    if (pos >= 0) {
      current.splice(pos, 1);
    } else {
      if (current.length >= NUM_SHIPS) return;
      current.push(idx);
    }
    sendGameAction({ ...s, [key]: current });
  };

  const confirmPlacement = () => {
    const s = stateRef.current;
    if (myShips.length !== NUM_SHIPS) return;
    const hostDone = role === 'host' || theirPlaced;
    const guestDone = role === 'guest' || theirPlaced;
    if (hostDone && guestDone) {
      sendGameAction({ ...s, phase: 'playing' });
    } else {
      sendGameAction({ ...s }); // just notify opponent placement
    }
  };

  const shoot = (idx: number) => {
    const s = stateRef.current;
    if (!isMyTurn || myShots.includes(idx)) return;
    const key = role === 'host' ? 'hostShots' : 'guestShots';
    const newShots = [...myShots, idx];
    const hits = newShots.filter(i => theirShips.includes(i));
    let winner: 'host' | 'guest' | null = null;
    let phase = s.phase;
    let nextHostScore = s.hostScore;
    let nextGuestScore = s.guestScore;
    if (hits.length >= NUM_SHIPS) {
      winner = role;
      phase = 'ended';
      if (role === 'host') nextHostScore++;
      else nextGuestScore++;
    }
    sendGameAction({
      ...s,
      [key]: newShots,
      turn: s.turn === 'host' ? 'guest' : 'host',
      winner,
      phase,
      hostScore: nextHostScore,
      guestScore: nextGuestScore,
    });
  };

  const resetGame = () => {
    const s = stateRef.current;
    sendGameAction({ ...INITIAL, hostScore: s.hostScore, guestScore: s.guestScore });
  };

  const fullReset = () => sendGameAction({ ...INITIAL });



  return (
    <div className="container-cute" style={{ maxWidth: '700px' }}>
      <div className="card-cute" style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Battleship Online 🚢</span>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#dbeafe', padding: '0.8rem',
          borderRadius: '15px', textAlign: 'center', marginBottom: '1.5rem', border: '2px solid #1e1b4b'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#1e40af' }}>{playerName} ⚓</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{role === 'host' ? state.hostScore : state.guestScore}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#1e40af' }}>{opponentName || 'Partner'} 🛥️</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{role === 'host' ? state.guestScore : state.hostScore}</div>
          </div>
        </div>

        {/* Placement phase */}
        {state.phase === 'placement' && !(myPlaced && theirPlaced) && (
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <p className="font-cute" style={{ color: '#1e40af', marginBottom: '0.5rem' }}>
              {myPlaced ? '✅ Ships placed! Waiting for partner...' : `Place your ${NUM_SHIPS} ship cells (${myShips.length}/${NUM_SHIPS})`}
            </p>
            <div style={{
              display: 'grid', gridTemplateColumns: `repeat(${GRID}, 1fr)`, gap: '2px',
              background: '#1e3a5f', padding: '8px', borderRadius: '12px', border: '3px solid #1e1b4b',
              maxWidth: '340px', margin: '0 auto 1rem',
            }}>
              {Array.from({ length: TOTAL }, (_, i) => (
                <button
                  key={i}
                  onClick={() => !myPlaced && toggleShipPlacement(i)}
                  disabled={myPlaced}
                  style={{
                    aspectRatio: '1', border: '1px solid rgba(255,255,255,0.1)',
                    background: myShips.includes(i) ? '#3b82f6' : '#0c4a6e',
                    cursor: myPlaced ? 'default' : 'pointer',
                    borderRadius: '2px', transition: 'all 0.1s',
                  }}
                />
              ))}
            </div>
            {!myPlaced && (
              <button onClick={confirmPlacement} disabled={myShips.length !== NUM_SHIPS} className="btn-cute btn-cute-primary">
                Confirm Ships ⚓
              </button>
            )}
          </div>
        )}

        {/* Playing phase */}
        {(state.phase === 'playing' || state.phase === 'ended') && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {state.phase === 'ended' ? (
                <span className="font-cute" style={{ fontSize: '1.2rem', color: '#1e40af' }}>
                  {state.winner === role ? '🏆 You sank all their ships!' : '💔 Partner sank your fleet!'}
                </span>
              ) : (
                <span className="font-cute" style={{ color: isMyTurn ? '#1d4ed8' : '#93c5fd', fontSize: '1.05rem' }}>
                  {isMyTurn ? 'Fire! Click the enemy grid 💥' : `Waiting for ${opponentName || 'partner'}... ⏳`}
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Enemy grid to shoot at */}
              <div>
                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#374151', marginBottom: '0.4rem' }}>
                  🎯 Enemy Waters
                </p>
                <div style={{
                  display: 'grid', gridTemplateColumns: `repeat(${GRID}, 1fr)`, gap: '2px',
                  background: '#1e3a5f', padding: '6px', borderRadius: '10px', border: '3px solid #1e1b4b',
                }}>
                  {Array.from({ length: TOTAL }, (_, i) => {
                    const shot = myShots.includes(i);
                    const isHit = shot && theirShips.includes(i);
                    return (
                      <button
                        key={i}
                        onClick={() => shoot(i)}
                        disabled={!isMyTurn || shot}
                        style={{
                          aspectRatio: '1', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px',
                          background: isHit ? '#ef4444' : shot ? '#3b82f6' : '#0c4a6e',
                          cursor: isMyTurn && !shot ? 'pointer' : 'default',
                          fontSize: '0.6rem', color: '#fff', transition: 'all 0.1s',
                        }}
                      >
                        {isHit ? '💥' : shot ? '💦' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* My grid showing their shots */}
              <div>
                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#374151', marginBottom: '0.4rem' }}>
                  🛡️ Your Waters
                </p>
                <div style={{
                  display: 'grid', gridTemplateColumns: `repeat(${GRID}, 1fr)`, gap: '2px',
                  background: '#1e3a5f', padding: '6px', borderRadius: '10px', border: '3px solid #1e1b4b',
                }}>
                  {Array.from({ length: TOTAL }, (_, i) => {
                    const isShip = myShips.includes(i);
                    const theyShot = theirShots.includes(i);
                    const isHit = theyShot && isShip;
                    return (
                      <div
                        key={i}
                        style={{
                          aspectRatio: '1', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px',
                          background: isHit ? '#ef4444' : theyShot ? '#3b82f6' : isShip ? '#22c55e' : '#0c4a6e',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.6rem',
                        }}
                      >
                        {isHit ? '💥' : theyShot ? '💦' : isShip ? '⚓' : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '1.5rem' }}>
          {state.phase === 'ended' && <button onClick={resetGame} className="btn-cute btn-cute-primary"><RefreshCw size={15} /> Play Again</button>}
          <button onClick={fullReset} className="btn-cute btn-cute-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>Reset All</button>
        </div>
      </div>
    </div>
  );
};
