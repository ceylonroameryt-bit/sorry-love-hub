import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface RaceState {
  phase: 'idle' | 'waiting' | 'active' | 'result';
  round: number;
  triggerTime: number;
  hostClickTime: number | null;
  guestClickTime: number | null;
  hostScore: number;
  guestScore: number;
}

const INITIAL: RaceState = {
  phase: 'idle',
  round: 1,
  triggerTime: 0,
  hostClickTime: null,
  guestClickTime: null,
  hostScore: 0,
  guestScore: 0,
};

const MAX_ROUNDS = 5;

export const ReactionRace: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName } = useGamePeer();
  const state: RaceState = gameState ?? INITIAL;

  // Use a ref so timeout closure always reads fresh state
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const triggerTimeoutRef = useRef<number | null>(null);

  const startRound = () => {
    if (role !== 'host') return;
    const freshState = stateRef.current;

    sendGameAction({
      ...freshState,
      phase: 'waiting',
      triggerTime: 0,
      hostClickTime: null,
      guestClickTime: null,
    });

    const randomDelay = 2000 + Math.random() * 3500;
    if (triggerTimeoutRef.current) clearTimeout(triggerTimeoutRef.current);

    triggerTimeoutRef.current = window.setTimeout(() => {
      const s = stateRef.current;
      sendGameAction({
        ...s,
        phase: 'active',
        triggerTime: Date.now(),
        hostClickTime: null,
        guestClickTime: null,
      });
    }, randomDelay);
  };

  useEffect(() => {
    return () => { if (triggerTimeoutRef.current) clearTimeout(triggerTimeoutRef.current); };
  }, []);

  const handleClick = () => {
    const s = stateRef.current;

    if (s.phase === 'waiting') {
      // Early tap — penalty
      const nextState = { ...s };
      if (role === 'host') nextState.hostClickTime = 99999;
      else nextState.guestClickTime = 99999;

      if (nextState.hostClickTime !== null && nextState.guestClickTime !== null) {
        resolveRound(nextState);
      } else {
        sendGameAction(nextState);
      }
      return;
    }

    if (s.phase !== 'active') return;

    const diff = Date.now() - s.triggerTime;
    const nextState = { ...s };
    if (role === 'host') nextState.hostClickTime = diff;
    else nextState.guestClickTime = diff;

    if (nextState.hostClickTime !== null && nextState.guestClickTime !== null) {
      resolveRound(nextState);
    } else {
      sendGameAction(nextState);
    }
  };

  const resolveRound = (curr: RaceState) => {
    const next = { ...curr, phase: 'result' as const };
    const h = next.hostClickTime ?? 99999;
    const g = next.guestClickTime ?? 99999;

    if (h !== 99999 || g !== 99999) {
      if (h < g) next.hostScore += 1;
      else if (g < h) next.guestScore += 1;
    }
    sendGameAction(next);
  };

  const resetGame = () => { sendGameAction({ ...INITIAL }); };

  const myScore = role === 'host' ? state.hostScore : state.guestScore;
  const theirScore = role === 'host' ? state.guestScore : state.hostScore;
  const myTime = role === 'host' ? state.hostClickTime : state.guestClickTime;
  const theirTime = role === 'host' ? state.guestClickTime : state.hostClickTime;
  const gameOver = state.hostScore >= MAX_ROUNDS || state.guestScore >= MAX_ROUNDS;
  const iWon = (role === 'host' && state.hostScore > state.guestScore) || (role === 'guest' && state.guestScore > state.hostScore);

  const bgColor = state.phase === 'active' ? '#dcfce7'
    : state.phase === 'waiting' ? '#fef9c3'
    : '#faf5ff';

  const formatMs = (ms: number | null) => ms === null ? '—' : ms === 99999 ? '⚡ Early tap!' : `${ms}ms`;

  return (
    <div className="container-cute" style={{ maxWidth: '640px' }}>
      <div className="card-cute" style={{ background: bgColor, border: '1.5px solid #ddd6fe', transition: 'background 0.3s' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Reaction Race ⚡</span>
          <button onClick={resetGame} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Scoreboard */}
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', background: 'rgba(255,255,255,0.7)', borderRadius: '14px', padding: '0.8rem 1rem', border: '1px solid #ede9fe', marginBottom: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>You</div>
            <div className="font-cute" style={{ fontSize: '2rem', color: '#7c3aed' }}>{myScore}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>First to {MAX_ROUNDS} wins!</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Round {state.round}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{opponentName || 'Partner'}</div>
            <div className="font-cute" style={{ fontSize: '2rem', color: '#8b5cf6' }}>{theirScore}</div>
          </div>
        </div>

        {/* IDLE / game over */}
        {(state.phase === 'idle' || gameOver) && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            {gameOver ? (
              <>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{iWon ? '🏆' : '🥈'}</div>
                <h2 className="font-cute" style={{ fontSize: '2rem', color: '#4c1d95', marginBottom: '0.5rem' }}>
                  {iWon ? 'You Won! 🎉' : `${opponentName || 'Partner'} Won! 👑`}
                </h2>
                <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Final Score: {myScore} – {theirScore}</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button onClick={resetGame} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' }}>Play Again</button>
                  <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary">Back to Lobby</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'float 2s ease infinite' }}>⚡</div>
                <h2 className="font-cute" style={{ fontSize: '1.8rem', color: '#4c1d95', marginBottom: '1rem' }}>Reaction Race!</h2>
                <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '0.95rem' }}>
                  Wait for the GREEN screen, then tap as fast as you can!<br />
                  <strong style={{ color: '#dc2626' }}>Tapping early = penalty! ⚠️</strong>
                </p>
                {role === 'host' ? (
                  <button onClick={startRound} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#059669,#10b981)', padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                    Start Round 1! 🚀
                  </button>
                ) : (
                  <p style={{ color: '#8b5cf6' }}>Waiting for host to start...</p>
                )}
              </>
            )}
          </div>
        )}

        {/* WAITING — yellow, watch out */}
        {state.phase === 'waiting' && !gameOver && (
          <div style={{ textAlign: 'center', padding: '2rem 0', cursor: 'pointer' }} onClick={handleClick}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'pulse-gentle 1s infinite' }}>👀</div>
            <h2 className="font-cute" style={{ fontSize: '2rem', color: '#854d0e', marginBottom: '0.5rem' }}>Get Ready...</h2>
            <p style={{ color: '#a16207', fontSize: '0.95rem' }}>Don't tap yet! Wait for GREEN.</p>
            <p style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '1rem' }}>Tap the screen to react when it turns green!</p>
          </div>
        )}

        {/* ACTIVE — green, tap now! */}
        {state.phase === 'active' && !gameOver && (
          <div style={{ textAlign: 'center', padding: '2rem 0', cursor: 'pointer' }} onClick={handleClick}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'pop-in 0.1s ease' }}>🟢</div>
            <h2 className="font-cute" style={{ fontSize: '2.5rem', color: '#14532d', marginBottom: '1rem', animation: 'wiggle 0.3s ease' }}>
              TAP NOW! ⚡
            </h2>
            {myTime !== null ? (
              <p style={{ color: '#059669', fontSize: '1rem', fontWeight: 700 }}>✅ You tapped! ({myTime}ms)</p>
            ) : (
              <button onClick={handleClick} className="btn-cute btn-cute-primary"
                style={{ background: 'linear-gradient(135deg,#059669,#10b981)', padding: '1.5rem 3rem', fontSize: '1.3rem', animation: 'pulse-gentle 0.5s infinite' }}>
                TAP! ⚡
              </button>
            )}
          </div>
        )}

        {/* RESULT */}
        {state.phase === 'result' && !gameOver && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0', animation: 'pop-in 0.4s ease' }}>
            <h3 className="font-cute" style={{ color: '#4c1d95', fontSize: '1.6rem', marginBottom: '1.2rem' }}>
              Round {state.round} Results!
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
              {[
                { label: 'You', time: myTime, color: '#7c3aed' },
                { label: opponentName || 'Partner', time: theirTime, color: '#8b5cf6' },
              ].map(({ label, time, color }) => (
                <div key={label} style={{ background: '#fff', border: `2px solid ${color}30`, borderRadius: '18px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 700 }}>{label}</div>
                  <div className="font-cute" style={{ fontSize: '1.3rem', color, marginTop: '0.3rem' }}>{formatMs(time)}</div>
                  {time !== null && time !== 99999 && myTime !== null && theirTime !== null && myTime !== 99999 && theirTime !== 99999 && (
                    <div style={{ marginTop: '0.3rem', fontSize: '1.2rem' }}>
                      {((label === 'You' && myTime < theirTime) || (label !== 'You' && theirTime < myTime)) ? '🏆' : '🥈'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {role === 'host' ? (
              <button onClick={startRound} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', padding: '0.8rem 2rem' }}>
                Next Round ➡️
              </button>
            ) : (
              <p style={{ color: '#8b5cf6', fontSize: '0.9rem' }}>Waiting for host to start next round...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
