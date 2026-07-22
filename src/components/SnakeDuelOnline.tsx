import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw, Play, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { GameHeader } from './GameHeader';

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
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INITIAL());
    }
  }, [role, gameState, sendGameAction]);

  const state: SnakeState = gameState ?? INITIAL();
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const myDir = role === 'host' ? state.hostDir : state.guestDir;

  const handleDirSelect = (dir: Dir) => {
    if (state.phase !== 'playing' || myDir !== null) return;

    const s = stateRef.current;
    const nextState = role === 'host' ? { ...s, hostDir: dir } : { ...s, guestDir: dir };

    if (nextState.hostDir !== null && nextState.guestDir !== null) {
      resolveTurn(nextState);
    } else {
      sendGameAction(nextState);
    }
  };

  const resolveTurn = (curr: SnakeState) => {
    let nextHost = [...curr.hostSnake];
    let nextGuest = [...curr.guestSnake];
    let food = { ...curr.food };

    const hHead = { ...nextHost[0] };
    if (curr.hostDir === 'UP') hHead.y--;
    if (curr.hostDir === 'DOWN') hHead.y++;
    if (curr.hostDir === 'LEFT') hHead.x--;
    if (curr.hostDir === 'RIGHT') hHead.x++;

    const gHead = { ...nextGuest[0] };
    if (curr.guestDir === 'UP') gHead.y--;
    if (curr.guestDir === 'DOWN') gHead.y++;
    if (curr.guestDir === 'LEFT') gHead.x--;
    if (curr.guestDir === 'RIGHT') gHead.x++;

    const hWall = hHead.x < 0 || hHead.x >= COLS || hHead.y < 0 || hHead.y >= ROWS;
    const gWall = gHead.x < 0 || gHead.x >= COLS || gHead.y < 0 || gHead.y >= ROWS;

    const hSelf = nextHost.some(p => p.x === hHead.x && p.y === hHead.y);
    const gSelf = nextGuest.some(p => p.x === gHead.x && p.y === gHead.y);

    const hOther = nextGuest.some(p => p.x === hHead.x && p.y === hHead.y);
    const gOther = nextHost.some(p => p.x === gHead.x && p.y === gHead.y);

    const headOn = hHead.x === gHead.x && hHead.y === gHead.y;

    const hDead = hWall || hSelf || hOther || headOn;
    const gDead = gWall || gSelf || gOther || headOn;

    let winner: 'host' | 'guest' | 'draw' | null = null;
    if (hDead && gDead) winner = 'draw';
    else if (hDead) winner = 'guest';
    else if (gDead) winner = 'host';

    if (winner) {
      let nextHScore = curr.hostScore;
      let nextGScore = curr.guestScore;
      if (winner === 'host') nextHScore++;
      if (winner === 'guest') nextGScore++;

      sendGameAction({
        ...curr,
        winner,
        phase: 'ended',
        hostScore: nextHScore,
        guestScore: nextGScore,
      });
      return;
    }

    // Move forward
    nextHost.unshift(hHead);
    if (hHead.x === food.x && hHead.y === food.y) {
      food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } else {
      nextHost.pop();
    }

    nextGuest.unshift(gHead);
    if (gHead.x === food.x && gHead.y === food.y) {
      food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } else {
      nextGuest.pop();
    }

    sendGameAction({
      ...curr,
      hostSnake: nextHost,
      guestSnake: nextGuest,
      hostDir: null,
      guestDir: null,
      food,
    });
  };

  const startGame = () => {
    sendGameAction({
      ...state,
      phase: 'playing',
      hostSnake: [{ x: 2, y: 2 }],
      guestSnake: [{ x: 9, y: 9 }],
      hostDir: null,
      guestDir: null,
      food: { x: 5, y: 5 },
      winner: null,
    });
  };


  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Snake Duel"
        emoji="🐍⚔️"
        instructions={[
          "Simultaneous turn-based Snake battle on a 12x12 grid.",
          "Pick your direction arrow each turn to advance & eat treats 🍎.",
          "Colliding with walls or snake bodies eliminates your snake!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: myDir ? '#dcfce7' : '#ede9fe', color: myDir ? '#15803d' : '#6d28d9' }}>
            {state.phase === 'playing' ? (myDir ? '✅ Direction Locked' : '✨ PICK DIRECTION') : 'Snake Setup'}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#059669' }}>Host 🟢: {state.hostScore}</span>
            <span style={{ color: '#ec4899' }}>Guest 🌸: {state.guestScore}</span>
          </div>
        </div>

        {/* SETUP PHASE */}
        {state.phase === 'setup' && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem', animation: 'float 2.5s ease infinite' }}>🐍⚔️</div>
            <h3 className="heading-lg" style={{ fontSize: '1.4rem', color: '#059669', marginBottom: '0.6rem' }}>
              Ready for Snake Battle?
            </h3>
            {role === 'host' ? (
              <button onClick={startGame} className="btn-cute btn-cute-primary" style={{ padding: '0.75rem 1.8rem', background: '#059669', borderColor: '#059669' }}>
                <Play size={18} /> Start Battle!
              </button>
            ) : (
              <p style={{ color: '#6b7280' }}>Waiting for {opponentName || 'host'} to start...</p>
            )}
          </div>
        )}

        {/* PLAYING PHASE */}
        {state.phase === 'playing' && (
          <div>
            <div className="game-board-responsive" style={{ background: '#059669', padding: '0.4rem', borderRadius: '18px', display: 'grid', gridTemplateRows: 'repeat(12, 1fr)', gap: '0.15rem', marginBottom: '1.2rem' }}>
              {Array.from({ length: ROWS }).map((_, r) => (
                <div key={r} style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '0.15rem' }}>
                  {Array.from({ length: COLS }).map((_, c) => {
                    const isHost = state.hostSnake.some(p => p.x === c && p.y === r);
                    const isGuest = state.guestSnake.some(p => p.x === c && p.y === r);
                    const isFood = state.food.x === c && state.food.y === r;

                    let bg = '#047857';
                    if (isHost) bg = '#7c3aed';
                    if (isGuest) bg = '#ec4899';

                    return (
                      <div
                        key={c}
                        style={{
                          aspectRatio: '1 / 1',
                          background: bg,
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem'
                        }}
                      >
                        {isFood ? '🍎' : ''}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* D-PAD Direction Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
              <button onClick={() => handleDirSelect('UP')} disabled={myDir !== null} className="btn-cute btn-cute-secondary" style={{ padding: '0.5rem 1rem' }}><ArrowUp size={20} /></button>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => handleDirSelect('LEFT')} disabled={myDir !== null} className="btn-cute btn-cute-secondary" style={{ padding: '0.5rem 1rem' }}><ArrowLeft size={20} /></button>
                <button onClick={() => handleDirSelect('RIGHT')} disabled={myDir !== null} className="btn-cute btn-cute-secondary" style={{ padding: '0.5rem 1rem' }}><ArrowRight size={20} /></button>
              </div>
              <button onClick={() => handleDirSelect('DOWN')} disabled={myDir !== null} className="btn-cute btn-cute-secondary" style={{ padding: '0.5rem 1rem' }}><ArrowDown size={20} /></button>
            </div>
          </div>
        )}

        {/* ENDED PHASE */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <h3 style={{ fontSize: '1.4rem', color: state.winner === 'draw' ? '#ca8a04' : state.winner === role ? '#059669' : '#dc2626', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
              {state.winner === 'draw' ? "Both Snakes Crashed!" : state.winner === role ? '🎉 Snake Victory!' : `💔 ${opponentName || 'Partner'} Won!`}
            </h3>
            {role === 'host' && (
              <button onClick={startGame} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem', background: '#059669', borderColor: '#059669' }}>
                <RefreshCw size={16} /> Play Next Battle
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
