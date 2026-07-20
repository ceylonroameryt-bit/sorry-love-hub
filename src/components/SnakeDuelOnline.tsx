import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw } from 'lucide-react';

type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
interface Pt { x: number; y: number; }

interface SnakeState {
  hostSnake: Pt[];
  guestSnake: Pt[];
  hostDir: Dir | null;
  guestDir: Dir | null;
  food: Pt;
  winner: 'host' | 'guest' | 'draw' | null;
  phase: 'setup' | 'playing' | 'ended';
  hostScore: number;
  guestScore: number;
}

const ROWS = 12;
const COLS = 12;

const INITIAL = (): SnakeState => ({
  hostSnake: [{ x: 2, y: 2 }],
  guestSnake: [{ x: 9, y: 9 }],
  hostDir: null,
  guestDir: null,
  food: { x: 5, y: 5 },
  winner: null,
  phase: 'setup',
  hostScore: 0,
  guestScore: 0,
});

export const SnakeDuelOnline: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName, playerName } = useGamePeer();
  const state: SnakeState = gameState ?? INITIAL();
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const mySnake = role === 'host' ? state.hostSnake : state.guestSnake;
  const myDir = role === 'host' ? state.hostDir : state.guestDir;
  const theirDir = role === 'host' ? state.guestDir : state.hostDir;

  const isMyChoiceSelected = myDir !== null;
  const isTheirChoiceSelected = theirDir !== null;

  const handleDirSelect = (dir: Dir) => {
    if (state.phase !== 'playing' || myDir !== null) return;

    // Check 180-degree turn block if snake size > 1
    const head = mySnake[0];
    const neck = mySnake[1];
    if (neck) {
      let nextX = head.x;
      let nextY = head.y;
      if (dir === 'UP') nextY--;
      else if (dir === 'DOWN') nextY++;
      else if (dir === 'LEFT') nextX--;
      else if (dir === 'RIGHT') nextX++;

      if (nextX === neck.x && nextY === neck.y) {
        return; // Prevent running directly back into neck
      }
    }

    const s = stateRef.current;
    const nextState: SnakeState = role === 'host'
      ? { ...s, hostDir: dir }
      : { ...s, guestDir: dir };

    // If both have chosen, advance game!
    if (nextState.hostDir !== null && nextState.guestDir !== null) {
      advanceRound(nextState);
    } else {
      sendGameAction(nextState);
    }
  };

  const advanceRound = (s: SnakeState) => {
    const hostHead = s.hostSnake[0];
    const guestHead = s.guestSnake[0];

    // Compute next heads
    const nextHostHead = getNextCell(hostHead, s.hostDir!);
    const nextGuestHead = getNextCell(guestHead, s.guestDir!);

    // Check collisions
    const hostCrashed = checkCrash(nextHostHead, s.hostSnake, s.guestSnake);
    const guestCrashed = checkCrash(nextGuestHead, s.guestSnake, s.hostSnake);

    let roundWinner: 'host' | 'guest' | 'draw' | null = null;
    let nextPhase = s.phase;
    let nextHostScore = s.hostScore;
    let nextGuestScore = s.guestScore;

    if (hostCrashed && guestCrashed) {
      roundWinner = 'draw';
      nextPhase = 'ended';
    } else if (hostCrashed) {
      roundWinner = 'guest';
      nextPhase = 'ended';
      nextGuestScore++;
    } else if (guestCrashed) {
      roundWinner = 'host';
      nextPhase = 'ended';
      nextHostScore++;
    }

    // If no crash, move snakes
    let nextHostSnake = [...s.hostSnake];
    let nextGuestSnake = [...s.guestSnake];
    let nextFood = s.food;

    if (!roundWinner) {
      const hostAte = nextHostHead.x === s.food.x && nextHostHead.y === s.food.y;
      const guestAte = nextGuestHead.x === s.food.x && nextGuestHead.y === s.food.y;

      nextHostSnake.unshift(nextHostHead);
      if (!hostAte) nextHostSnake.pop();

      nextGuestSnake.unshift(nextGuestHead);
      if (!guestAte) nextGuestSnake.pop();

      // Relocate food if eaten
      if (hostAte || guestAte) {
        nextFood = relocateFood(nextHostSnake, nextGuestSnake);
      }
    }

    sendGameAction({
      ...s,
      hostSnake: nextHostSnake,
      guestSnake: nextGuestSnake,
      hostDir: null,
      guestDir: null,
      food: nextFood,
      winner: roundWinner,
      phase: nextPhase,
      hostScore: nextHostScore,
      guestScore: nextGuestScore,
    });
  };

  const getNextCell = (head: Pt, dir: Dir): Pt => {
    let x = head.x;
    let y = head.y;
    if (dir === 'UP') y--;
    else if (dir === 'DOWN') y++;
    else if (dir === 'LEFT') x--;
    else if (dir === 'RIGHT') x++;
    return { x, y };
  };

  const checkCrash = (head: Pt, myBody: Pt[], oppBody: Pt[]): boolean => {
    // Wall crash
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) return true;
    // Self crash
    if (myBody.some(p => p.x === head.x && p.y === head.y)) return true;
    // Opponent crash
    if (oppBody.some(p => p.x === head.x && p.y === head.y)) return true;
    return false;
  };

  const relocateFood = (s1: Pt[], s2: Pt[]): Pt => {
    const emptyCells: Pt[] = [];
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        const occupied = s1.some(p => p.x === x && p.y === y) || s2.some(p => p.x === x && p.y === y);
        if (!occupied) emptyCells.push({ x, y });
      }
    }
    if (emptyCells.length === 0) return { x: 5, y: 5 };
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  };

  const startMatch = () => {
    sendGameAction({
      ...INITIAL(),
      phase: 'playing',
      hostScore: state.hostScore,
      guestScore: state.guestScore,
    });
  };

  const restartGame = () => {
    sendGameAction(INITIAL());
  };

  return (
    <div className="container-cute" style={{ maxWidth: '650px' }}>
      <div className="card-cute" style={{ background: '#f5faf8', border: '1.5px solid #a7f3d0' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Snake Duel Online 🐍⚔️</span>
        </div>

        {/* Scores */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
          background: '#d1fae5', padding: '0.8rem', borderRadius: '15px',
          textAlign: 'center', marginBottom: '1.5rem', border: '2px solid #1e1b4b'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#059669' }}>{playerName} (You)</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e1b4b' }}>
              {role === 'host' ? state.hostScore : state.guestScore}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#059669' }}>{opponentName || 'Partner'}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e1b4b' }}>
              {role === 'host' ? state.guestScore : state.hostScore}
            </div>
          </div>
        </div>

        {/* Status text */}
        <div style={{ textAlign: 'center', marginBottom: '1rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {state.phase === 'setup' && (
            <span className="font-cute" style={{ color: '#059669', fontSize: '1.1rem' }}>
              Strategic turn-based Snake Battle! ⚔️
            </span>
          )}
          {state.phase === 'playing' && (
            <span className="font-cute" style={{ color: '#059669', fontSize: '1.1rem' }}>
              {isMyChoiceSelected ? (
                isTheirChoiceSelected ? 'Advancing round...' : `Waiting for ${opponentName || 'partner'}... ⏳`
              ) : 'Pick your next step direction! 👇'}
            </span>
          )}
          {state.phase === 'ended' && (
            <span className="font-cute animate-pulse" style={{ color: '#dc2626', fontSize: '1.25rem', fontWeight: 'bold' }}>
              {state.winner === 'draw' ? "Both crashed! It's a draw! 🤝" : state.winner === role ? '🎉 You won! Opponent crashed.' : '💀 You crashed! Partner wins.'}
            </span>
          )}
        </div>

        {/* Game Arena Grid */}
        {state.phase !== 'setup' && (
          <div style={{
            display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gridTemplateRows: `repeat(${ROWS}, 1fr)`, gap: '1.5px',
            background: '#1e1b4b', border: '4px solid #1e1b4b',
            borderRadius: '12px', overflow: 'hidden', width: '100%',
            maxWidth: '300px', margin: '0 auto 1.5rem', boxShadow: '3px 3px 0 #1e1b4b'
          }}>
            {Array.from({ length: ROWS }).map((_, y) =>
              Array.from({ length: COLS }).map((_, x) => {
                const isHostHead = state.hostSnake[0].x === x && state.hostSnake[0].y === y;
                const isHostBody = state.hostSnake.slice(1).some(p => p.x === x && p.y === y);
                const isGuestHead = state.guestSnake[0].x === x && state.guestSnake[0].y === y;
                const isGuestBody = state.guestSnake.slice(1).some(p => p.x === x && p.y === y);
                const isFood = state.food.x === x && state.food.y === y;

                let bg = '#34d399'; // empty grass green
                let content = '';

                if (isHostHead) {
                  bg = '#7c3aed';
                  content = '💜';
                } else if (isHostBody) {
                  bg = '#a78bfa';
                } else if (isGuestHead) {
                  bg = '#ec4899';
                  content = '🩷';
                } else if (isGuestBody) {
                  bg = '#fce7f3';
                } else if (isFood) {
                  content = '❤️';
                }

                return (
                  <div
                    key={`${x}-${y}`}
                    style={{
                      aspectRatio: '1', backgroundColor: bg, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.8rem',
                    }}
                  >
                    {content}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          {state.phase === 'setup' && (
            <button onClick={startMatch} className="btn-cute btn-cute-primary" style={{ padding: '0.8rem 2.5rem' }}>
              Start Duel 🐍
            </button>
          )}

          {state.phase === 'playing' && !isMyChoiceSelected && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', width: '220px' }}>
              <div></div>
              <button onClick={() => handleDirSelect('UP')} className="btn-cute btn-cute-primary" style={{ padding: '0.6rem 0' }}>▲</button>
              <div></div>
              <button onClick={() => handleDirSelect('LEFT')} className="btn-cute btn-cute-primary" style={{ padding: '0.6rem 0' }}>◀</button>
              <button onClick={() => handleDirSelect('DOWN')} className="btn-cute btn-cute-primary" style={{ padding: '0.6rem 0' }}>▼</button>
              <button onClick={() => handleDirSelect('RIGHT')} className="btn-cute btn-cute-primary" style={{ padding: '0.6rem 0' }}>▶</button>
            </div>
          )}

          {state.phase === 'ended' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={startMatch} className="btn-cute btn-cute-primary">
                <RefreshCw size={15} /> Next Round
              </button>
              <button onClick={restartGame} className="btn-cute btn-cute-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                Reset Scores
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
