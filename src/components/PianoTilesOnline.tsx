import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw } from 'lucide-react';

// Piano Tiles Online — Host sets a rhythm pattern, Guest copies; compare accuracy
// Simplified: random tile-press race on a 4-column piano grid
const COLS = 4;
const NOTES = ['🎵', '🎶', '🎼', '🎹'];
const COL_COLORS = ['#f472b6', '#a78bfa', '#60a5fa', '#34d399'];

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

function generateTiles(seed: number, count = 32): Tile[] {
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
  const { role, sendGameAction, gameState, selectGame, opponentName, playerName } = useGamePeer();
  const state: PianoTilesState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [localScroll, setLocalScroll] = useState(0);
  const [myHits, setMyHits] = useState(0);
  const [myMisses, setMyMisses] = useState(0);

  useEffect(() => { stateRef.current = state; }, [state]);

  // Countdown timer for host
  useEffect(() => {
    if (state.phase === 'countdown' && role === 'host') {
      if (state.countdown > 0) {
        const t = setTimeout(() => {
          const s = stateRef.current;
          sendGameAction({ ...s, countdown: s.countdown - 1 });
        }, 1000);
        return () => clearTimeout(t);
      } else {
        const seed = Date.now() % 999983;
        sendGameAction({
          ...stateRef.current,
          phase: 'playing',
          tiles: generateTiles(seed),
          seed,
          countdown: 0,
          hostHits: 0,
          guestHits: 0,
          hostMisses: 0,
          guestMisses: 0,
        });
      }
    }
  }, [state.phase, state.countdown, role]);

  // Auto scroll tiles
  useEffect(() => {
    if (state.phase !== 'playing') return;
    setMyHits(0);
    setMyMisses(0);
    setLocalScroll(0);
    const interval = setInterval(() => {
      setLocalScroll(prev => {
        const next = prev + 1;
        if (next >= state.tiles.length) {
          clearInterval(interval);
          // Report done
          const s = stateRef.current;
          const hostHitsKey = role === 'host' ? 'hostHits' : 'guestHits';
          const hostMissKey = role === 'host' ? 'hostMisses' : 'guestMisses';
          sendGameAction({
            ...s,
            [hostHitsKey]: myHits,
            [hostMissKey]: myMisses,
            phase: 'ended',
            winner: null,
          });
        }
        return next;
      });
    }, 500);
    timerRef.current = interval;
    return () => clearInterval(interval);
  }, [state.phase]);

  // Determine winner when both done
  useEffect(() => {
    const s = stateRef.current;
    if (s.phase === 'ended' && s.winner === null && s.hostHits + s.guestHits > 0) {
      const winner = s.hostHits > s.guestHits ? 'host' : s.guestHits > s.hostHits ? 'guest' : 'draw';
      const nextHostScore = s.hostScore + (winner === 'host' ? 1 : 0);
      const nextGuestScore = s.guestScore + (winner === 'guest' ? 1 : 0);
      sendGameAction({ ...s, winner, hostScore: nextHostScore, guestScore: nextGuestScore });
    }
  }, [state.hostHits, state.guestHits]);

  const handleTilePress = useCallback((tile: Tile) => {
    if (state.phase !== 'playing') return;
    if (tile.row !== localScroll) { setMyMisses(p => p + 1); return; }
    setMyHits(p => p + 1);
  }, [state.phase, localScroll]);

  const missPress = useCallback((col: number) => {
    if (state.phase !== 'playing') return;
    const tile = state.tiles[localScroll];
    if (!tile || tile.col !== col) { setMyMisses(p => p + 1); }
  }, [state.phase, localScroll, state.tiles]);

  const resetGame = () => {
    const s = stateRef.current;
    sendGameAction({ ...INITIAL, hostScore: s.hostScore, guestScore: s.guestScore });
  };
  const fullReset = () => sendGameAction({ ...INITIAL });

  const visibleTiles = state.tiles.filter(t => t.row >= localScroll && t.row < localScroll + 6);

  return (
    <div className="container-cute" style={{ maxWidth: '520px' }}>
      <div className="card-cute" style={{ background: '#0f172a', border: '3px solid #1e1b4b', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', background: '#1e293b', color: '#fff' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Piano Tiles Online 🎹</span>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#1e293b', padding: '0.8rem',
          borderRadius: '15px', textAlign: 'center', marginBottom: '1.5rem', border: '2px solid #f472b6'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#f472b6' }}>{playerName} 🎹</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{role === 'host' ? state.hostScore : state.guestScore}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Hits: {myHits}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#60a5fa' }}>{opponentName || 'Partner'} 🎶</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{role === 'host' ? state.guestScore : state.hostScore}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Hits: {role === 'host' ? state.guestHits : state.hostHits}
            </div>
          </div>
        </div>

        {state.phase === 'countdown' && (
          <div style={{ textAlign: 'center', padding: '3rem', fontFamily: 'var(--font-cute)', fontSize: '5rem', color: '#f472b6' }}>
            {state.countdown > 0 ? state.countdown : '🎵'}
          </div>
        )}

        {state.phase === 'playing' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: '4px', height: '320px', overflow: 'hidden', position: 'relative', borderRadius: '14px', border: '2px solid #475569' }}>
              {Array.from({ length: COLS }, (_, col) => (
                <div
                  key={col}
                  onClick={() => missPress(col)}
                  style={{ background: '#1e293b', position: 'relative', cursor: 'pointer', borderRight: col < COLS - 1 ? '1px solid #475569' : 'none' }}
                >
                  {visibleTiles.filter(t => t.col === col).map(tile => (
                    <div
                      key={tile.id}
                      onClick={e => { e.stopPropagation(); handleTilePress(tile); }}
                      style={{
                        position: 'absolute',
                        top: `${((tile.row - localScroll) / 6) * 100}%`,
                        left: '4px', right: '4px', height: 'calc(100% / 6 - 6px)',
                        background: COL_COLORS[col],
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.3rem', cursor: 'pointer',
                        boxShadow: tile.row === localScroll ? `0 0 15px ${COL_COLORS[col]}` : 'none',
                        border: tile.row === localScroll ? '2px solid #fff' : 'none',
                        transition: 'all 0.1s',
                      }}
                    >
                      {NOTES[col]}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
              Hit: {myHits} | Miss: {myMisses} | Progress: {Math.min(100, Math.round((localScroll / state.tiles.length) * 100))}%
            </div>
          </div>
        )}

        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{state.winner === role ? '🏆' : state.winner === 'draw' ? '🤝' : '💔'}</div>
            <div className="font-cute" style={{ fontSize: '1.3rem', color: '#f472b6', marginBottom: '0.5rem' }}>
              {state.winner === 'draw' ? "It's a draw!" : state.winner === role ? 'You hit more notes!' : 'Partner hit more notes!'}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Your hits: {myHits} | Partner: {role === 'host' ? state.guestHits : state.hostHits}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '1.5rem' }}>
          {state.phase === 'ended' && role === 'host' && <button onClick={resetGame} className="btn-cute btn-cute-primary"><RefreshCw size={15} /> Play Again</button>}
          <button onClick={fullReset} className="btn-cute btn-cute-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: '#1e293b', color: '#fff' }}>Reset Scores</button>
        </div>
      </div>
    </div>
  );
};
