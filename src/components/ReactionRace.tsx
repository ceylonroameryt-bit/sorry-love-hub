import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw, Zap } from 'lucide-react';

interface RaceState {
  phase: 'idle' | 'waiting' | 'active' | 'result' | 'ended';
  round: number;
  triggerTime: number; // Date.now() when screen turned green
  hostClickTime: number | null; // time taken in ms
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

export const ReactionRace: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName } = useGamePeer();
  const state: RaceState = gameState ?? INITIAL;


  const triggerTimeoutRef = useRef<number | null>(null);

  const startRound = () => {
    if (role !== 'host') return;

    // Reset round states
    sendGameAction({
      ...state,
      phase: 'waiting',
      triggerTime: 0,
      hostClickTime: null,
      guestClickTime: null,
    });

    const randomDelay = 2000 + Math.random() * 3500; // 2 to 5.5 seconds
    if (triggerTimeoutRef.current) clearTimeout(triggerTimeoutRef.current);
    
    triggerTimeoutRef.current = window.setTimeout(() => {
      sendGameAction({
        ...state,
        phase: 'active',
        triggerTime: Date.now(),
        hostClickTime: null,
        guestClickTime: null,
      });
    }, randomDelay);
  };

  useEffect(() => {
    // Clear timeout on unmount
    return () => {
      if (triggerTimeoutRef.current) clearTimeout(triggerTimeoutRef.current);
    };
  }, []);

  const handleClick = () => {
    if (state.phase === 'waiting') {
      // Early tap penalty: disqualified (set large time)
      const nextState = { ...state };
      if (role === 'host') nextState.hostClickTime = 99999;
      else nextState.guestClickTime = 99999;
      


      if (nextState.hostClickTime && nextState.guestClickTime) {
        resolveRound(nextState);
      } else {
        sendGameAction(nextState);
      }
      return;
    }

    if (state.phase !== 'active') return;

    const diff = Date.now() - state.triggerTime;
    const nextState = { ...state };
    if (role === 'host') nextState.hostClickTime = diff;
    else nextState.guestClickTime = diff;



    // If both clicked, resolve the round winner
    if (nextState.hostClickTime && nextState.guestClickTime) {
      resolveRound(nextState);
    } else {
      sendGameAction(nextState);
    }
  };

  const resolveRound = (curr: RaceState) => {
    const next = { ...curr };
    next.phase = 'result';

    const h = next.hostClickTime ?? 99999;
    const g = next.guestClickTime ?? 99999;

    if (h === 99999 && g === 99999) {
      // Both early tapped — no points
    } else if (h < g) {
      next.hostScore += 1;
    } else if (g < h) {
      next.guestScore += 1;
    }

    sendGameAction(next);
  };

  const resetGame = () => {
    sendGameAction({ ...INITIAL });

  };

  const myClick = role === 'host' ? state.hostClickTime : state.guestClickTime;
  const theirClick = role === 'host' ? state.guestClickTime : state.hostClickTime;

  return (
    <div className="container-cute" style={{ maxWidth: '640px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Reaction Race ⚡</span>
          <button onClick={resetGame} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} title="Reset game">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Scoreboard */}
        <div style={{
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          background: '#fff', borderRadius: '14px', padding: '0.8rem 1rem',
          border: '1px solid #ede9fe', marginBottom: '1.5rem',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Your Wins</div>
            <div className="font-cute" style={{ fontSize: '1.6rem', color: '#7c3aed' }}>
              {role === 'host' ? state.hostScore : state.guestScore}
            </div>
          </div>
          <span className="font-cute" style={{ fontSize: '1.2rem', color: '#ddd6fe' }}>VS</span>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{opponentName || 'Partner'}'s Wins</div>
            <div className="font-cute" style={{ fontSize: '1.6rem', color: '#8b5cf6' }}>
              {role === 'guest' ? state.hostScore : state.guestScore}
            </div>
          </div>
        </div>

        {/* IDLE PHASE */}
        {state.phase === 'idle' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <Zap size={60} color="#7c3aed" style={{ animation: 'float 2s ease infinite', margin: '0 auto 1rem' }} />
            <h3 className="heading-lg">Reaction Race</h3>
            <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '0.9rem' }}>
              Tap the giant button when the color turns green! Tapping early disqualifies you.
            </p>
            {role === 'host' ? (
              <button onClick={startRound} className="btn-cute btn-cute-primary" style={{ padding: '0.8rem 2.2rem' }}>
                Start Round 1 🎮
              </button>
            ) : (
              <p style={{ color: '#8b5cf6', fontWeight: 600 }}>
                Waiting for host to start...
              </p>
            )}
          </div>
        )}

        {/* WAITING or ACTIVE PLAYING BUTTON */}
        {(state.phase === 'waiting' || state.phase === 'active') && (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleClick}
              disabled={myClick !== null}
              style={{
                width: '100%',
                height: '240px',
                borderRadius: '24px',
                border: 'none',
                background: state.phase === 'active' ? '#10b981' : '#dc2626',
                color: '#fff',
                fontSize: '2rem',
                fontFamily: 'var(--font-cute)',
                fontWeight: 900,
                cursor: myClick === null ? 'pointer' : 'default',
                boxShadow: `0 12px 24px ${state.phase === 'active' ? 'rgba(16,185,129,0.3)' : 'rgba(220,38,38,0.3)'}`,
                transition: 'all 0.15s ease',
              }}
            >
              {myClick !== null ? (
                myClick === 99999 ? '🔴 EARLY TAP!' : '⏳ Wait...'
              ) : (
                state.phase === 'active' ? '💥 TAP NOW!' : '🔴 WAIT...'
              )}
            </button>
          </div>
        )}

        {/* RESULT PHASE */}
        {state.phase === 'result' && (
          <div style={{ textAlign: 'center', animation: 'pop-in 0.4s ease' }}>
            <h3 className="font-cute" style={{ color: '#4c1d95', fontSize: '1.6rem', marginBottom: '1.5rem' }}>
              Reaction Results
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: '#f5f3ff', border: '1.5px solid #ede9fe', borderRadius: '18px', padding: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 700 }}>Your Reaction</div>
                <div className="font-cute" style={{ fontSize: '1.6rem', color: '#4c1d95', marginTop: '0.3rem' }}>
                  {myClick === 99999 ? 'Disqualified' : `${myClick} ms`}
                </div>
              </div>

              <div style={{ background: '#fdf2f8', border: '1.5px solid #fbcfe8', borderRadius: '18px', padding: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#be185d', fontWeight: 700 }}>{opponentName || 'Partner'}'s Reaction</div>
                <div className="font-cute" style={{ fontSize: '1.6rem', color: '#4c1d95', marginTop: '0.3rem' }}>
                  {theirClick === 99999 ? 'Disqualified' : `${theirClick} ms`}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#7c3aed', marginBottom: '2rem' }}>
              {myClick === 99999 && theirClick === 99999 ? (
                <span>You both tapped too early! 😂</span>
              ) : (myClick ?? 99999) < (theirClick ?? 99999) ? (
                <span>🎉 You were faster! (+1 Score)</span>
              ) : (
                <span>{opponentName || 'Partner'} was faster! ⚡</span>
              )}
            </div>

            {role === 'host' ? (
              <button onClick={startRound} className="btn-cute btn-cute-primary" style={{ padding: '0.8rem 2rem' }}>
                Next Round ➡️
              </button>
            ) : (
              <p style={{ color: '#8b5cf6', fontSize: '0.9rem' }}>
                Waiting for host to load next round...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
