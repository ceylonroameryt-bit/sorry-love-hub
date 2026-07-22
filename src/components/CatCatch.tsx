import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw, Play } from 'lucide-react';
import { GameHeader } from './GameHeader';

interface FallingItem {
  id: string;
  x: number;
  y: number;
  type: 'cat' | 'heart' | 'yarn';
  speed: number;
}

interface CatState {
  phase: 'lobby' | 'playing' | 'ended';
  items: FallingItem[];
  hostX: number;
  guestX: number;
  hostScore: number;
  guestScore: number;
  timeLeft: number;
}

const INIT: CatState = { phase: 'lobby', items: [], hostX: 50, guestX: 50, hostScore: 0, guestScore: 0, timeLeft: 45 };
const EMOJI: Record<string, string> = { cat: '🐱', heart: '💜', yarn: '🧶' };

export const CatCatch: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INIT);
    }
  }, [role, gameState, sendGameAction]);

  const state: CatState = gameState ?? INIT;

  const containerRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<number | null>(null);
  const spawnRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const stateRef = useRef(state);
  const localXRef = useRef(50);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const handleMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (state.phase !== 'playing' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    if (!clientX) return;
    const x = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    localXRef.current = x;

    if (role === 'guest') {
      sendGameAction({ ...stateRef.current, guestX: x });
    }
  };

  const startGame = () => {
    if (role !== 'host') return;
    sendGameAction({ ...INIT, phase: 'playing' });
  };

  // Host runs physics loop
  useEffect(() => {
    if (role !== 'host' || state.phase !== 'playing') {
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
      if (spawnRef.current) clearInterval(spawnRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      const s = stateRef.current;
      if (s.timeLeft <= 1) {
        clearInterval(timerRef.current!);
        clearInterval(spawnRef.current!);
        cancelAnimationFrame(loopRef.current!);
        sendGameAction({ ...s, phase: 'ended', timeLeft: 0 });
      } else {
        sendGameAction({ ...s, timeLeft: s.timeLeft - 1 });
      }
    }, 1000);

    spawnRef.current = window.setInterval(() => {
      const s = stateRef.current;
      if (s.items.length > 8) return;
      const types: ('cat' | 'heart' | 'yarn')[] = ['cat', 'cat', 'heart', 'yarn'];
      const type = types[Math.floor(Math.random() * types.length)];
      const newItem: FallingItem = {
        id: Math.random().toString(),
        x: Math.floor(Math.random() * 86) + 7,
        y: 0,
        type,
        speed: Math.random() * 0.8 + 0.6,
      };
      sendGameAction({ ...s, items: [...s.items, newItem] });
    }, 800);

    let lastTick = performance.now();
    const tick = (now: number) => {
      const delta = (now - lastTick) / 16;
      lastTick = now;
      const s = stateRef.current;
      const hX = localXRef.current;
      const gX = s.guestX;

      let hScore = s.hostScore;
      let gScore = s.guestScore;

      const updated = s.items.map(item => ({ ...item, y: item.y + item.speed * delta }))
        .filter(item => {
          if (item.y >= 82 && item.y <= 92) {
            if (Math.abs(item.x - hX) < 10) { hScore += 1; return false; }
            if (Math.abs(item.x - gX) < 10) { gScore += 1; return false; }
          }
          return item.y < 100;
        });

      sendGameAction({
        ...s,
        hostX: hX,
        items: updated,
        hostScore: hScore,
        guestScore: gScore,
      });

      loopRef.current = requestAnimationFrame(tick);
    };

    loopRef.current = requestAnimationFrame(tick);

    return () => {
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
      if (spawnRef.current) clearInterval(spawnRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [role, state.phase, sendGameAction]);

  const iWon = (role === 'host' && state.hostScore > state.guestScore) || (role === 'guest' && state.guestScore > state.hostScore);

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Cat Catching"
        emoji="🐱"
        instructions={[
          "Move your basket horizontally by dragging your finger/mouse across the play area.",
          "Catch falling cats 🐱, hearts 💜, and yarn 🧶 to score points.",
          "Highest score caught in 45 seconds wins!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            ⏱️ {state.timeLeft}s left
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>Host 🧺: {state.hostScore}</span>
            <span style={{ color: '#ec4899' }}>Guest 🧺: {state.guestScore}</span>
          </div>
        </div>

        {/* LOBBY PHASE */}
        {state.phase === 'lobby' && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem', animation: 'float 2.5s ease infinite' }}>🐱🧺</div>
            <h3 className="heading-lg" style={{ fontSize: '1.4rem', color: '#ec4899', marginBottom: '0.6rem' }}>
              Ready to catch falling cats?
            </h3>
            {role === 'host' ? (
              <button onClick={startGame} className="btn-cute btn-cute-primary" style={{ padding: '0.75rem 1.8rem', background: '#ec4899', borderColor: '#ec4899' }}>
                <Play size={18} /> Start Catching!
              </button>
            ) : (
              <p style={{ color: '#6b7280' }}>Waiting for {opponentName || 'host'} to start...</p>
            )}
          </div>
        )}

        {/* PLAYING PHASE */}
        {state.phase === 'playing' && (
          <div
            ref={containerRef}
            onMouseMove={handleMove}
            onTouchMove={handleMove}
            className="canvas-responsive"
            style={{
              height: '340px',
              background: '#fce7f3',
              border: '2px solid #ec4899',
              borderRadius: '20px',
              position: 'relative',
              overflow: 'hidden',
              userSelect: 'none',
              marginBottom: '1rem'
            }}
          >
            {/* Falling items */}
            {state.items.map(item => (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  transform: 'translate(-50%, -50%)',
                  fontSize: '1.8rem'
                }}
              >
                {EMOJI[item.type]}
              </div>
            ))}

            {/* Host Basket */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: `${role === 'host' ? localXRef.current : state.hostX}%`,
              transform: 'translateX(-50%)',
              fontSize: '2rem',
              transition: 'left 0.05s linear'
            }}>
              🧺<span style={{ fontSize: '0.7rem', display: 'block', textAlign: 'center', color: '#7c3aed', fontWeight: 700 }}>Host</span>
            </div>

            {/* Guest Basket */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: `${role === 'guest' ? localXRef.current : state.guestX}%`,
              transform: 'translateX(-50%)',
              fontSize: '2rem',
              transition: 'left 0.05s linear'
            }}>
              🧺<span style={{ fontSize: '0.7rem', display: 'block', textAlign: 'center', color: '#ec4899', fontWeight: 700 }}>Guest</span>
            </div>
          </div>
        )}

        {/* ENDED PHASE */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <h3 style={{ fontSize: '1.5rem', color: state.hostScore === state.guestScore ? '#ca8a04' : iWon ? '#059669' : '#dc2626', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
              {state.hostScore === state.guestScore ? "It's a Tie!" : iWon ? '🎉 Ultimate Cat Catcher!' : `💔 ${opponentName || 'Partner'} Won!`}
            </h3>
            {role === 'host' && (
              <button onClick={startGame} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem', background: '#ec4899', borderColor: '#ec4899' }}>
                <RefreshCw size={16} /> Play Again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
