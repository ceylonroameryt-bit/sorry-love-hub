import React, { useEffect, useRef, useState } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw } from 'lucide-react';

// Archery Online — Both players aim and shoot an arrow at a target, closest to bullseye wins each round
// Tap/hold a moving slider to control aim angle, then release to shoot

interface Shot {
  angle: number;   // 0–100 (50 = perfect center)
  power: number;   // 0–100
  score: number;
}

interface ArcheryState {
  phase: 'waiting' | 'aiming' | 'results' | 'ended';
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

function calcScore(angle: number, power: number): number {
  const da = Math.abs(angle - 50) / 50;  // 0=perfect, 1=edge
  const dp = Math.abs(power - 50) / 50;
  const dist = Math.sqrt(da * da + dp * dp) / Math.sqrt(2);
  return Math.max(0, Math.round((1 - dist) * 10));
}

const INITIAL: ArcheryState = {
  phase: 'waiting',
  round: 0,
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
  const { role, sendGameAction, gameState, selectGame, opponentName, playerName } = useGamePeer();
  const state: ArcheryState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  const [animAngle, setAnimAngle] = useState(0);
  const [animPower, setAnimPower] = useState(0);
  const [animDir1, setAnimDir1] = useState(1);
  const [animDir2, setAnimDir2] = useState(1);
  const [shot, setShot] = useState(false);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { stateRef.current = state; }, [state]);

  // Animate sliders
  useEffect(() => {
    if (state.phase !== 'aiming' || shot) return;
    animRef.current = setInterval(() => {
      setAnimAngle(prev => {
        const next = prev + animDir1 * 2;
        if (next >= 100 || next <= 0) setAnimDir1(d => -d);
        return Math.max(0, Math.min(100, next));
      });
      setAnimPower(prev => {
        const next = prev + animDir2 * 3;
        if (next >= 100 || next <= 0) setAnimDir2(d => -d);
        return Math.max(0, Math.min(100, next));
      });
    }, 50);
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, [state.phase, shot]);

  const fireShot = () => {
    const s = stateRef.current;
    if (s.phase !== 'aiming' || shot) return;
    if ((role === 'host' && s.hostShot) || (role === 'guest' && s.guestShot)) return;
    setShot(true);
    if (animRef.current) clearInterval(animRef.current);
    const myShot = { angle: animAngle, power: animPower, score: calcScore(animAngle, animPower) };
    const key = role === 'host' ? 'hostShot' : 'guestShot';
    const oppShot = role === 'host' ? s.guestShot : s.hostShot;
    const newState = { ...s, [key]: myShot };

    if (oppShot !== null) {
      // Both shot — evaluate round
      const hostShot = role === 'host' ? myShot : oppShot;
      const guestShot = role === 'guest' ? myShot : oppShot;
      const isLastRound = s.round >= s.totalRounds;
      const roundHostPts = s.hostPoints + hostShot.score;
      const roundGuestPts = s.guestPoints + guestShot.score;

      let winner: 'host' | 'guest' | 'draw' | null = null;
      let nextHostScore = s.hostScore;
      let nextGuestScore = s.guestScore;
      let phase: ArcheryState['phase'] = 'results';

      if (isLastRound) {
        winner = roundHostPts > roundGuestPts ? 'host' : roundGuestPts > roundHostPts ? 'guest' : 'draw';
        phase = 'ended';
        if (winner === 'host') nextHostScore++;
        else if (winner === 'guest') nextGuestScore++;
      }

      sendGameAction({
        ...newState,
        hostShot,
        guestShot,
        phase,
        hostPoints: roundHostPts,
        guestPoints: roundGuestPts,
        winner,
        hostScore: nextHostScore,
        guestScore: nextGuestScore,
      });
    } else {
      sendGameAction(newState);
    }
  };

  const nextRound = () => {
    const s = stateRef.current;
    sendGameAction({ ...s, phase: 'aiming', round: s.round + 1, hostShot: null, guestShot: null });
    setShot(false);
    setAnimAngle(Math.random() * 100);
    setAnimPower(Math.random() * 100);
  };

  const startGame = () => {
    sendGameAction({ ...INITIAL, phase: 'aiming', round: 1, hostScore: state.hostScore, guestScore: state.guestScore });
    setShot(false);
  };
  const fullReset = () => { sendGameAction({ ...INITIAL }); setShot(false); };

  const myShot = role === 'host' ? state.hostShot : state.guestShot;
  const oppShot = role === 'host' ? state.guestShot : state.hostShot;
const TargetSVG = ({ shot1, shot2 }: { shot1: Shot | null; shot2: Shot | null }) => (
    <svg viewBox="0 0 200 200" style={{ width: '200px', height: '200px', display: 'block', margin: '0 auto' }}>
      {[90, 70, 50, 30, 10].map((r, i) => (
        <circle key={r} cx="100" cy="100" r={r} fill={['#f9fafb','#fef9c3','#fde68a','#fca5a5','#ef4444'][i]} stroke="#fff" strokeWidth="1" />
      ))}
      <text x="100" y="104" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="bold">10</text>
      {shot1 && (
        <g>
          <circle cx={100 + (shot1.angle - 50) * 1.4} cy={100 + (shot1.power - 50) * 1.4} r="6" fill="#7c3aed" opacity="0.85" stroke="#fff" strokeWidth="1.5" />
          <text x={100 + (shot1.angle - 50) * 1.4} y={100 + (shot1.power - 50) * 1.4 - 9} textAnchor="middle" fontSize="8" fill="#7c3aed" fontWeight="bold">
            {role === 'host' ? playerName?.[0] : opponentName?.[0]}
          </text>
        </g>
      )}
      {shot2 && (
        <g>
          <circle cx={100 + (shot2.angle - 50) * 1.4} cy={100 + (shot2.power - 50) * 1.4} r="6" fill="#ec4899" opacity="0.85" stroke="#fff" strokeWidth="1.5" />
          <text x={100 + (shot2.angle - 50) * 1.4} y={100 + (shot2.power - 50) * 1.4 - 9} textAnchor="middle" fontSize="8" fill="#ec4899" fontWeight="bold">
            {role === 'guest' ? playerName?.[0] : opponentName?.[0]}
          </text>
        </g>
      )}
    </svg>
  );

  return (
    <div className="container-cute" style={{ maxWidth: '520px' }}>
      <div className="card-cute" style={{ background: '#fff8f0', border: '1.5px solid #fed7aa' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Archery Online 🎯</span>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center',
          background: '#fef3c7', padding: '0.8rem', borderRadius: '15px',
          textAlign: 'center', marginBottom: '1.5rem', border: '2px solid #1e1b4b'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#b45309' }}>{playerName} 💜</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{role === 'host' ? state.hostPoints : state.guestPoints}</div>
            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Win: {role === 'host' ? state.hostScore : state.guestScore}</div>
          </div>
          <div style={{ fontSize: '1.3rem' }}>🏹</div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#b45309' }}>{opponentName || 'Partner'} 💖</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{role === 'host' ? state.guestPoints : state.hostPoints}</div>
            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Win: {role === 'host' ? state.guestScore : state.hostScore}</div>
          </div>
        </div>

        {state.phase === 'waiting' && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
            <p className="font-cute" style={{ color: '#b45309', marginBottom: '1.5rem' }}>
              Watch the moving sliders and tap to shoot! Closest to center wins!
            </p>
            {role === 'host' ? (
              <button onClick={startGame} className="btn-cute btn-cute-primary">Start! 🏹</button>
            ) : (
              <p style={{ color: '#a78bfa' }}>Waiting for {opponentName || 'host'}... ⏳</p>
            )}
          </div>
        )}

        {state.phase === 'aiming' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '0.5rem', color: '#b45309', fontFamily: 'var(--font-cute)', fontSize: '0.95rem' }}>
              Round {state.round} / {state.totalRounds} — {shot ? `✅ Fired! Waiting for ${opponentName || 'partner'}...` : 'Tap to shoot! 🏹'}
            </div>
            <TargetSVG shot1={myShot} shot2={oppShot} />
            {!shot && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ marginBottom: '0.8rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#9d174d', marginBottom: '0.3rem' }}>Left/Right Aim</div>
                  <div style={{ height: '18px', background: '#fed7aa', borderRadius: '10px', position: 'relative', overflow: 'hidden', border: '2px solid #1e1b4b' }}>
                    <div style={{ position: 'absolute', left: `${animAngle}%`, transform: 'translateX(-50%)', width: '20px', height: '100%', background: '#f97316', borderRadius: '6px', transition: 'left 0.05s linear' }} />
                  </div>
                </div>
                <div style={{ marginBottom: '1.2rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#9d174d', marginBottom: '0.3rem' }}>Power</div>
                  <div style={{ height: '18px', background: '#fed7aa', borderRadius: '10px', position: 'relative', overflow: 'hidden', border: '2px solid #1e1b4b' }}>
                    <div style={{ position: 'absolute', left: `${animPower}%`, transform: 'translateX(-50%)', width: '20px', height: '100%', background: '#dc2626', borderRadius: '6px', transition: 'left 0.05s linear' }} />
                  </div>
                </div>
                <button onClick={fireShot} className="btn-cute btn-cute-primary" style={{ width: '100%', fontSize: '1.3rem', padding: '1rem' }}>
                  🏹 FIRE!
                </button>
              </div>
            )}
          </div>
        )}

        {state.phase === 'results' && (
          <div style={{ textAlign: 'center' }}>
            <TargetSVG shot1={state.hostShot} shot2={state.guestShot} />
            <div style={{ marginTop: '1rem', fontFamily: 'var(--font-cute)', color: '#b45309' }}>
              Your score: {myShot?.score ?? 0} | Partner: {oppShot?.score ?? 0}
            </div>
            {role === 'host' && state.round < state.totalRounds && (
              <button onClick={nextRound} className="btn-cute btn-cute-primary" style={{ marginTop: '1rem' }}>
                Next Round ➡️
              </button>
            )}
          </div>
        )}

        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '1.5rem' }}>
            <TargetSVG shot1={state.hostShot} shot2={state.guestShot} />
            <div style={{ fontSize: '3rem', marginTop: '1rem' }}>{state.winner === role ? '🏆' : state.winner === 'draw' ? '🤝' : '💔'}</div>
            <div className="font-cute" style={{ fontSize: '1.2rem', color: '#b45309', marginTop: '0.5rem' }}>
              {state.winner === 'draw' ? "It's a draw!" : state.winner === role ? 'Best shot wins! 🎉' : 'Partner is a better archer!'}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '1.5rem' }}>
          {(state.phase === 'ended' || state.phase === 'waiting') && role === 'host' && (
            <button onClick={startGame} className="btn-cute btn-cute-primary"><RefreshCw size={15} /> {state.phase === 'ended' ? 'Play Again' : 'Start'}</button>
          )}
          <button onClick={fullReset} className="btn-cute btn-cute-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>Reset Scores</button>
        </div>
      </div>
    </div>
  );
};
