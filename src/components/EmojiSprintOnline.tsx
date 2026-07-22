import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw, Play, Zap } from 'lucide-react';
import { GameHeader } from './GameHeader';

const FINISH_LINE = 30;

interface EmojiSprintState {
  phase: 'waiting' | 'countdown' | 'racing' | 'ended';
  hostTaps: number;
  guestTaps: number;
  winner: 'host' | 'guest' | null;
  countdown: number;
  hostScore: number;
  guestScore: number;
}

const INITIAL: EmojiSprintState = {
  phase: 'waiting',
  hostTaps: 0,
  guestTaps: 0,
  winner: null,
  countdown: 3,
  hostScore: 0,
  guestScore: 0,
};

const EMOJIS = ['🐢', '🐇', '🐆', '🦅', '🚀'];

export const EmojiSprintOnline: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INITIAL);
    }
  }, [role, gameState, sendGameAction]);

  const state: EmojiSprintState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Countdown timer
  useEffect(() => {
    if (state.phase !== 'countdown' || role !== 'host') return;
    if (state.countdown > 0) {
      const t = setTimeout(() => {
        const s = stateRef.current;
        sendGameAction({ ...s, countdown: s.countdown - 1 });
      }, 1000);
      return () => clearTimeout(t);
    } else {
      sendGameAction({ ...stateRef.current, phase: 'racing' });
    }
  }, [state.phase, state.countdown, role, sendGameAction]);

  const startGame = () => {
    if (role !== 'host') return;
    sendGameAction({
      ...state,
      phase: 'countdown',
      countdown: 3,
      hostTaps: 0,
      guestTaps: 0,
      winner: null,
    });
  };

  const handleTap = () => {
    if (state.phase !== 'racing' || state.winner) return;

    const s = stateRef.current;
    const isHost = role === 'host';
    const newTaps = (isHost ? s.hostTaps : s.guestTaps) + 1;
    const isFinished = newTaps >= FINISH_LINE;

    let hTaps = isHost ? newTaps : s.hostTaps;
    let gTaps = !isHost ? newTaps : s.guestTaps;
    let winner: 'host' | 'guest' | null = null;
    let hScore = s.hostScore;
    let gScore = s.guestScore;

    if (isFinished) {
      winner = role;
      if (role === 'host') hScore += 1;
      else gScore += 1;
    }

    sendGameAction({
      ...s,
      hostTaps: hTaps,
      guestTaps: gTaps,
      winner,
      hostScore: hScore,
      guestScore: gScore,
      phase: isFinished ? 'ended' : 'racing',
    });
  };


  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Emoji Sprint"
        emoji="🏁"
        instructions={[
          "Wait for 3-second countdown to finish.",
          "Mash your sprint button as fast as possible to run!",
          "First runner to reach 30 taps crosses the finish line and wins!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: state.phase === 'racing' ? '#dcfce7' : '#ede9fe', color: state.phase === 'racing' ? '#15803d' : '#6d28d9' }}>
            {state.phase === 'countdown' ? `⏳ Countdown: ${state.countdown}` : state.phase === 'racing' ? '🏃 SPRINT NOW!' : 'Ready'}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>Host: {state.hostScore}</span>
            <span style={{ color: '#ec4899' }}>Guest: {state.guestScore}</span>
          </div>
        </div>

        {/* WAITING PHASE */}
        {state.phase === 'waiting' && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem', animation: 'float 2.5s ease infinite' }}>🏁🏃</div>
            <h3 className="heading-lg" style={{ fontSize: '1.4rem', color: '#7c3aed', marginBottom: '0.6rem' }}>
              Ready for Emoji Sprint?
            </h3>
            {role === 'host' ? (
              <button onClick={startGame} className="btn-cute btn-cute-primary" style={{ padding: '0.75rem 1.8rem' }}>
                <Play size={18} /> Start Race!
              </button>
            ) : (
              <p style={{ color: '#6b7280' }}>Waiting for {opponentName || 'host'} to start...</p>
            )}
          </div>
        )}

        {/* COUNTDOWN PHASE */}
        {state.phase === 'countdown' && (
          <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
            <div style={{ fontSize: '5rem', fontWeight: 900, color: '#7c3aed', animation: 'pulse-gentle 0.5s infinite', fontFamily: 'var(--font-world)' }}>
              {state.countdown}
            </div>
            <p style={{ color: '#6b7280', fontWeight: 600, fontSize: '1.1rem' }}>Get ready to sprint...</p>
          </div>
        )}

        {/* RACING OR ENDED PHASE */}
        {(state.phase === 'racing' || state.phase === 'ended') && (
          <div>
            {/* Host Track */}
            <div style={{ background: '#ffffff', border: '1.5px solid #7c3aed', borderRadius: '16px', padding: '0.8rem 1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 700, marginBottom: '0.3rem' }}>👑 Host Progress ({state.hostTaps} / {FINISH_LINE})</div>
              <div style={{ position: 'relative', height: '24px', background: '#f3e8ff', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute',
                  left: `${(state.hostTaps / FINISH_LINE) * 90}%`,
                  top: '0', bottom: '0',
                  fontSize: '1.2rem',
                  lineHeight: '24px'
                }}>
                  {EMOJIS[Math.min(4, Math.floor((state.hostTaps / FINISH_LINE) * 5))]}
                </div>
              </div>
            </div>

            {/* Guest Track */}
            <div style={{ background: '#ffffff', border: '1.5px solid #ec4899', borderRadius: '16px', padding: '0.8rem 1rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#ec4899', fontWeight: 700, marginBottom: '0.3rem' }}>🌸 Guest Progress ({state.guestTaps} / {FINISH_LINE})</div>
              <div style={{ position: 'relative', height: '24px', background: '#fce7f3', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute',
                  left: `${(state.guestTaps / FINISH_LINE) * 90}%`,
                  top: '0', bottom: '0',
                  fontSize: '1.2rem',
                  lineHeight: '24px'
                }}>
                  {EMOJIS[Math.min(4, Math.floor((state.guestTaps / FINISH_LINE) * 5))]}
                </div>
              </div>
            </div>

            {/* Tap Sprint Button */}
            {state.phase === 'racing' && (
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <button
                  onClick={handleTap}
                  className="btn-cute btn-cute-primary"
                  style={{ width: '100%', padding: '1.6rem', fontSize: '1.3rem', justifyContent: 'center' }}
                >
                  <Zap size={24} /> SPRINT SPRINT SPRINT!
                </button>
              </div>
            )}

            {/* Winner Banner */}
            {state.phase === 'ended' && (
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.4rem', color: state.winner === role ? '#059669' : '#dc2626', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
                  {state.winner === role ? '🎉 Sprint Champion!' : `💔 ${opponentName || 'Partner'} Crossed First!`}
                </h3>
                {role === 'host' && (
                  <button onClick={startGame} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem' }}>
                    <RefreshCw size={16} /> Play Next Race
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
