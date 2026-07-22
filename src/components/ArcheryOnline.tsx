import React, { useEffect, useRef, useState } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw } from 'lucide-react';
import { GameHeader } from './GameHeader';

interface Shot {
  angle: number;
  power: number;
  score: number;
}

interface ArcheryState {
  phase: 'aiming' | 'results' | 'ended';
  round: number;
  totalRounds: number;
  hostShot: Shot | null;
  guestShot: Shot | null;
  hostPoints: number;
  guestPoints: number;
  winner: 'host' | 'guest' | 'draw' | null;
  hostScore: number;
  guestScore: number;
}

function calcScore(angle: number): number {
  const diff = Math.abs(angle - 50);
  if (diff <= 5) return 10;
  if (diff <= 15) return 8;
  if (diff <= 30) return 5;
  if (diff <= 45) return 2;
  return 0;
}

const INITIAL: ArcheryState = {
  phase: 'aiming',
  round: 1,
  totalRounds: 5,
  hostShot: null,
  guestShot: null,
  hostPoints: 0,
  guestPoints: 0,
  winner: null,
  hostScore: 0,
  guestScore: 0,
};

export const ArcheryOnline: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INITIAL);
    }
  }, [role, gameState, sendGameAction]);

  const state: ArcheryState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const [sliderPos, setSliderPos] = useState(0);
  const [movingRight, setMovingRight] = useState(true);

  const myShot = role === 'host' ? state.hostShot : state.guestShot;

  // Moving slider loop
  useEffect(() => {
    if (state.phase !== 'aiming' || myShot !== null) return;
    const interval = setInterval(() => {
      setSliderPos(pos => {
        if (pos >= 100) { setMovingRight(false); return 99; }
        if (pos <= 0) { setMovingRight(true); return 1; }
        return movingRight ? pos + 2.5 : pos - 2.5;
      });
    }, 25);
    return () => clearInterval(interval);
  }, [state.phase, myShot, movingRight]);

  const shootArrow = () => {
    if (myShot !== null || state.phase !== 'aiming') return;
    const shotScore = calcScore(sliderPos);
    const newShot: Shot = { angle: sliderPos, power: 50, score: shotScore };

    const s = stateRef.current;
    const nextState: ArcheryState = role === 'host'
      ? { ...s, hostShot: newShot, hostPoints: s.hostPoints + shotScore }
      : { ...s, guestShot: newShot, guestPoints: s.guestPoints + shotScore };

    if (nextState.hostShot !== null && nextState.guestShot !== null) {
      const isEnded = nextState.round >= nextState.totalRounds;
      let winner: 'host' | 'guest' | 'draw' | null = null;
      let hScore = nextState.hostScore;
      let gScore = nextState.guestScore;

      if (isEnded) {
        if (nextState.hostPoints > nextState.guestPoints) { winner = 'host'; hScore += 1; }
        else if (nextState.guestPoints > nextState.hostPoints) { winner = 'guest'; gScore += 1; }
        else winner = 'draw';
      }

      nextState.winner = winner;
      nextState.phase = isEnded ? 'ended' : 'results';
    }

    sendGameAction(nextState);
  };

  const nextRound = () => {
    if (role !== 'host') return;
    sendGameAction({
      ...state,
      round: state.round + 1,
      hostShot: null,
      guestShot: null,
      phase: 'aiming',
    });
  };

  const resetAll = () => sendGameAction(INITIAL);

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Archery Duel"
        emoji="🏹"
        instructions={[
          "Slider oscillates horizontally across the target.",
          "Tap 'RELEASE ARROW' when the slider aligns with the center bullseye 🎯!",
          "Scoring 10 points for bullseye center. Highest score after 5 rounds wins!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            Arrow {state.round} of {state.totalRounds}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#ea580c' }}>Host: {state.hostPoints} pts</span>
            <span style={{ color: '#ec4899' }}>Guest: {state.guestPoints} pts</span>
          </div>
        </div>

        {/* Target & Aiming Bar */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎯</div>

          {state.phase === 'aiming' && (
            <div>
              <div style={{
                position: 'relative',
                height: '36px',
                background: 'linear-gradient(90deg, #ef4444 0%, #eab308 35%, #22c55e 48%, #22c55e 52%, #eab308 65%, #ef4444 100%)',
                borderRadius: '50px',
                marginBottom: '1.2rem',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  left: `${sliderPos}%`,
                  top: '0',
                  bottom: '0',
                  width: '6px',
                  background: '#ffffff',
                  boxShadow: '0 0 10px #ffffff',
                  transform: 'translateX(-50%)'
                }} />
              </div>

              <button
                onClick={shootArrow}
                disabled={myShot !== null}
                className="btn-cute btn-cute-primary"
                style={{ padding: '0.8rem 2rem', fontSize: '1.1rem', background: '#ea580c', borderColor: '#ea580c' }}
              >
                🏹 RELEASE ARROW!
              </button>
            </div>
          )}
        </div>

        {/* RESULTS PHASE */}
        {state.phase === 'results' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              background: '#ffffff',
              padding: '1.2rem',
              borderRadius: '18px',
              border: '2px solid #ddd6fe',
              marginBottom: '1.5rem'
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 700 }}>👑 Host Shot</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#7c3aed', fontFamily: 'var(--font-world)' }}>
                  +{state.hostShot?.score} <span style={{ fontSize: '0.8rem' }}>pts</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#ec4899', fontWeight: 700 }}>🌸 Guest Shot</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ec4899', fontFamily: 'var(--font-world)' }}>
                  +{state.guestShot?.score} <span style={{ fontSize: '0.8rem' }}>pts</span>
                </div>
              </div>
            </div>

            {role === 'host' && (
              <button onClick={nextRound} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem', background: '#ea580c', borderColor: '#ea580c' }}>
                Next Arrow ➔
              </button>
            )}
          </div>
        )}

        {/* ENDED PHASE */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <h3 style={{ fontSize: '1.4rem', color: state.winner === 'draw' ? '#ca8a04' : state.winner === role ? '#059669' : '#dc2626', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
              {state.winner === 'draw' ? "It's a Tie!" : state.winner === role ? '🎉 Archery Champion!' : `💔 ${opponentName || 'Partner'} Won!`}
            </h3>
            {role === 'host' && (
              <button onClick={resetAll} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem', background: '#ea580c', borderColor: '#ea580c' }}>
                <RefreshCw size={16} /> Play Again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
