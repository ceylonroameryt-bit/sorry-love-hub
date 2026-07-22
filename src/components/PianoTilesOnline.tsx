import React, { useEffect, useRef, useState } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw } from 'lucide-react';
import { GameHeader } from './GameHeader';

const COLS = 4;
const NOTES = ['🎵', '🎶', '🎼', '🎹'];
const COL_COLORS = ['#ec4899', '#7c3aed', '#0284c7', '#059669'];

interface Tile {
  id: number;
  col: number;
  row: number;
  hit: boolean;
}

interface PianoTilesState {
  phase: 'countdown' | 'playing' | 'ended';
  tiles: Tile[];
  hostHits: number;
  guestHits: number;
  hostMisses: number;
  guestMisses: number;
  winner: 'host' | 'guest' | 'draw' | null;
  seed: number;
  hostScore: number;
  guestScore: number;
  countdown: number;
}

function generateTiles(seed: number, count = 28): Tile[] {
  let s = seed;
  const tiles: Tile[] = [];
  for (let i = 0; i < count; i++) {
    s = (s * 16807 + 0) % 2147483647;
    tiles.push({ id: i, col: s % COLS, row: i, hit: false });
  }
  return tiles;
}

const INITIAL: PianoTilesState = {
  phase: 'countdown',
  tiles: [],
  hostHits: 0,
  guestHits: 0,
  hostMisses: 0,
  guestMisses: 0,
  winner: null,
  seed: 12345,
  hostScore: 0,
  guestScore: 0,
  countdown: 3,
};

export const PianoTilesOnline: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      const seed = Math.floor(Math.random() * 99999) + 1;
      sendGameAction({
        ...INITIAL,
        seed,
        tiles: generateTiles(seed),
        phase: 'countdown',
      });
    }
  }, [role, gameState, sendGameAction]);

  const state: PianoTilesState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { stateRef.current = state; }, [state]);

  const [localHitIndex, setLocalHitIndex] = useState(0);

  // Host countdown loop
  useEffect(() => {
    if (role !== 'host') return;
    if (state.phase === 'countdown') {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const current = stateRef.current;
        if (current.countdown <= 1) {
          clearInterval(timerRef.current!);
          sendGameAction({ ...current, phase: 'playing', countdown: 0 });
        } else {
          sendGameAction({ ...current, countdown: current.countdown - 1 });
        }
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [role, state.phase, sendGameAction]);

  const handleTileTap = (tileId: number, col: number) => {
    if (state.phase !== 'playing') return;
    const s = stateRef.current;

    const currentTile = s.tiles.find(t => t.id === tileId);
    if (!currentTile || currentTile.hit) return;

    if (currentTile.id === localHitIndex && currentTile.col === col) {
      setLocalHitIndex(prev => prev + 1);
      const isHost = role === 'host';
      const hHits = isHost ? s.hostHits + 1 : s.hostHits;
      const gHits = !isHost ? s.guestHits + 1 : s.guestHits;

      const isDone = s.tiles.every((t, idx) => idx === localHitIndex || t.hit);

      let winner: 'host' | 'guest' | 'draw' | null = null;
      let hScore = s.hostScore;
      let gScore = s.guestScore;

      if (isDone) {
        if (hHits > gHits) { winner = 'host'; hScore += 1; }
        else if (gHits > hHits) { winner = 'guest'; gScore += 1; }
        else winner = 'draw';
      }

      sendGameAction({
        ...s,
        tiles: s.tiles.map(t => t.id === tileId ? { ...t, hit: true } : t),
        hostHits: hHits,
        guestHits: gHits,
        winner,
        hostScore: hScore,
        guestScore: gScore,
        phase: isDone ? 'ended' : 'playing',
      });
    }
  };

  const resetGame = () => {
    const seed = Math.floor(Math.random() * 99999) + 1;
    setLocalHitIndex(0);
    sendGameAction({
      ...INITIAL,
      seed,
      tiles: generateTiles(seed),
      phase: 'countdown',
      hostScore: state.hostScore,
      guestScore: state.guestScore,
    });
  };

  const visibleTiles = state.tiles.slice(localHitIndex, localHitIndex + 5);

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Piano Tiles Race"
        emoji="🎹"
        instructions={[
          "Wait for 3-second countdown, then tap active piano tiles.",
          "Tap tiles in exact sequential order to score hits.",
          "Highest hit score when all tiles are completed wins!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            {state.phase === 'countdown' ? `⏳ Countdown: ${state.countdown}` : '🎹 Playing'}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>Host Hits: {state.hostHits}</span>
            <span style={{ color: '#ec4899' }}>Guest Hits: {state.guestHits}</span>
          </div>
        </div>

        {/* 4-Column Piano Board */}
        <div className="game-board-responsive" style={{ height: '300px', background: '#1e1b4b', borderRadius: '18px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.2rem', padding: '0.4rem', marginBottom: '1.5rem' }}>
          {Array.from({ length: COLS }).map((_, colIdx) => {
            const activeInCol = visibleTiles.find(t => t.col === colIdx && !t.hit);
            return (
              <div
                key={colIdx}
                onClick={() => activeInCol && handleTileTap(activeInCol.id, colIdx)}
                style={{
                  background: activeInCol ? COL_COLORS[colIdx] : '#312e81',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  cursor: activeInCol ? 'pointer' : 'default',
                  transition: 'background 0.1s ease'
                }}
              >
                {activeInCol ? NOTES[colIdx] : ''}
              </div>
            );
          })}
        </div>

        {/* Winner Banner */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.4rem', color: state.winner === role ? '#059669' : '#dc2626', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
              {state.winner === 'draw' ? "It's a Tie!" : state.winner === role ? '🎉 Piano Virtuoso Champion!' : `💔 ${opponentName || 'Partner'} Won!`}
            </h3>
            {role === 'host' && (
              <button onClick={resetGame} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem' }}>
                <RefreshCw size={16} /> Play Next Race
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
