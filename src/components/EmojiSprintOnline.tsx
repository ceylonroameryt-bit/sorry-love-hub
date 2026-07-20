import React, { useEffect, useRef, useState } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw } from 'lucide-react';

// Emoji Sprint Online — Emoji running race. Players tap their button as fast as possible!
// Both see each other's progress. First to finish 30 taps wins!

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
  const { role, sendGameAction, gameState, selectGame, opponentName, playerName } = useGamePeer();
  const state: EmojiSprintState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const myTaps = role === 'host' ? state.hostTaps : state.guestTaps;
  const theirTaps = role === 'host' ? state.guestTaps : state.hostTaps;
  const mySpeed = myTaps < 5 ? 0 : myTaps < 10 ? 1 : myTaps < 18 ? 2 : myTaps < 25 ? 3 : 4;
  const myEmoji = EMOJIS[mySpeed];

  const [lastTapTime, setLastTapTime] = useState(0);
  const [tapFlash, setTapFlash] = useState(false);

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
  }, [state.phase, state.countdown, role]);

  const startGame = () => {
    sendGameAction({ ...INITIAL, phase: 'countdown', hostScore: state.hostScore, guestScore: state.guestScore });
  };
  const fullReset = () => sendGameAction({ ...INITIAL });

  const handleTap = () => {
    const s = stateRef.current;
    if (s.phase !== 'racing') return;
    const now = Date.now();
    if (now - lastTapTime < 50) return; // debounce 50ms
    setLastTapTime(now);
    setTapFlash(true);
    setTimeout(() => setTapFlash(false), 100);

    const key = role === 'host' ? 'hostTaps' : 'guestTaps';
    const newTaps = (role === 'host' ? s.hostTaps : s.guestTaps) + 1;

    if (newTaps >= FINISH_LINE) {
      const nextHostScore = s.hostScore + (role === 'host' ? 1 : 0);
      const nextGuestScore = s.guestScore + (role === 'guest' ? 1 : 0);
      sendGameAction({
        ...s,
        [key]: newTaps,
        winner: role,
        phase: 'ended',
        hostScore: nextHostScore,
        guestScore: nextGuestScore,
      });
    } else {
      sendGameAction({ ...s, [key]: newTaps });
    }
  };

  const TrackRow = ({ taps, label, emoji, isMe }: { taps: number; label: string; emoji: string; isMe: boolean }) => {
    const progress = Math.min(taps, FINISH_LINE);
    const pct = (progress / FINISH_LINE) * 100;
    return (
      <div style={{ marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
          <span style={{ fontWeight: 700, color: isMe ? '#7c3aed' : '#ec4899' }}>{label}</span>
          <span style={{ color: '#6b7280' }}>{taps}/{FINISH_LINE} taps</span>
        </div>
        <div style={{
          height: '44px', background: '#f3f4f6', borderRadius: '12px',
          border: `3px solid ${isMe ? '#7c3aed' : '#ec4899'}`,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Track lines */}
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} style={{ position: 'absolute', left: `${(i + 1) * 16.67}%`, top: 0, bottom: 0, width: '1px', background: '#e5e7eb' }} />
          ))}
          {/* Progress */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${pct}%`,
            background: isMe ? 'linear-gradient(90deg,#c4b5fd,#7c3aed)' : 'linear-gradient(90deg,#fbcfe8,#ec4899)',
            borderRadius: '9px', transition: 'width 0.1s ease',
            minWidth: pct > 0 ? '40px' : '0',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '4px',
          }}>
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{emoji}</span>
          </div>
          {/* Finish flag */}
          <div style={{ position: 'absolute', right: '4px', top: 0, bottom: 0, display: 'flex', alignItems: 'center', fontSize: '1.2rem' }}>🏁</div>
        </div>
      </div>
    );
  };

  const opponentSpeedIdx = theirTaps < 5 ? 0 : theirTaps < 10 ? 1 : theirTaps < 18 ? 2 : theirTaps < 25 ? 3 : 4;
  const theirEmoji = EMOJIS[opponentSpeedIdx];

  return (
    <div className="container-cute" style={{ maxWidth: '560px' }}>
      <div className="card-cute" style={{ background: '#fdf4ff', border: '1.5px solid #e879f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Emoji Sprint Online 🏃</span>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center',
          background: '#fae8ff', padding: '0.8rem', borderRadius: '15px',
          textAlign: 'center', marginBottom: '1.5rem', border: '2px solid #1e1b4b'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#7e22ce' }}>{playerName} 💜</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{role === 'host' ? state.hostScore : state.guestScore}</div>
          </div>
          <div style={{ fontSize: '1.4rem' }}>🏁</div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#7e22ce' }}>{opponentName || 'Partner'} 💖</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{role === 'host' ? state.guestScore : state.hostScore}</div>
          </div>
        </div>

        {state.phase === 'waiting' && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏃💨</div>
            <p className="font-cute" style={{ color: '#7e22ce', marginBottom: '1.5rem' }}>
              TAP your button as fast as you can! First to {FINISH_LINE} taps wins! 🏁
            </p>
            {role === 'host' ? (
              <button onClick={startGame} className="btn-cute btn-cute-primary">Ready, Set... 🚀</button>
            ) : (
              <p style={{ color: '#a78bfa' }}>Waiting for {opponentName || 'host'} to start... ⏳</p>
            )}
          </div>
        )}

        {state.phase === 'countdown' && (
          <div style={{ textAlign: 'center', padding: '3rem', fontFamily: 'var(--font-cute)', fontSize: '6rem', color: '#7e22ce', lineHeight: 1 }}>
            {state.countdown > 0 ? state.countdown : '🏁'}
          </div>
        )}

        {(state.phase === 'racing' || state.phase === 'ended') && (
          <div>
            <TrackRow taps={myTaps} label={`${playerName} (You)`} emoji={myEmoji} isMe={true} />
            <TrackRow taps={theirTaps} label={opponentName || 'Partner'} emoji={theirEmoji} isMe={false} />

            {state.phase === 'ended' && (
              <div style={{ textAlign: 'center', margin: '1rem 0', fontFamily: 'var(--font-cute)', fontSize: '1.3rem', color: '#7e22ce' }}>
                {state.winner === role ? '🏆 You won the sprint!' : '💔 Partner crossed first!'}
              </div>
            )}

            {state.phase === 'racing' && (
              <button
                onClick={handleTap}
                style={{
                  width: '100%', padding: '2.5rem', marginTop: '1.5rem',
                  background: tapFlash
                    ? 'linear-gradient(135deg,#7c3aed,#ec4899)'
                    : 'linear-gradient(135deg,#a78bfa,#f472b6)',
                  border: '4px solid #1e1b4b', borderRadius: '20px',
                  fontSize: '2rem', fontFamily: 'var(--font-cute)', fontWeight: 900,
                  color: '#fff', cursor: 'pointer',
                  boxShadow: tapFlash ? '2px 2px 0 #1e1b4b' : '6px 6px 0 #1e1b4b',
                  transform: tapFlash ? 'translateY(4px)' : 'none',
                  transition: 'all 0.05s',
                  userSelect: 'none',
                }}
              >
                {myEmoji} TAP! TAP! TAP!
              </button>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '1.5rem' }}>
          {(state.phase === 'ended' || state.phase === 'waiting') && role === 'host' && (
            <button onClick={startGame} className="btn-cute btn-cute-primary"><RefreshCw size={15} /> {state.phase === 'ended' ? 'Race Again!' : 'Start'}</button>
          )}
          <button onClick={fullReset} className="btn-cute btn-cute-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>Reset Scores</button>
        </div>
      </div>
    </div>
  );
};
