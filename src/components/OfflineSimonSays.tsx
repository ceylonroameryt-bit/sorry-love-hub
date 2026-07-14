import React, { useState, useCallback, useRef } from 'react';
import { ArrowLeft, Play } from 'lucide-react';

const COLORS = [
  { id: 0, emoji: '🔴', light: '#fca5a5', dark: '#dc2626' },
  { id: 1, emoji: '🔵', light: '#93c5fd', dark: '#2563eb' },
  { id: 2, emoji: '🟢', light: '#86efac', dark: '#16a34a' },
  { id: 3, emoji: '🟡', light: '#fde68a', dark: '#ca8a04' },
];
type Phase = 'idle' | 'showing' | 'input' | 'lose';
const SPEED = 700;
const GAP = 250;

interface Props { onBack: () => void; }
export const OfflineSimonSays: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [level, setLevel] = useState(0);
  const [flash, setFlash] = useState<number | null>(null);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem('simon_best') || '0'));
  const phaseRef = useRef<Phase>('idle');

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const playSequence = useCallback(async (seq: number[]) => {
    phaseRef.current = 'showing';
    setPhase('showing');
    setPlayerIndex(0);
    await sleep(600);
    for (const c of seq) {
      if (phaseRef.current !== 'showing') return;
      setFlash(c);
      await sleep(SPEED);
      setFlash(null);
      await sleep(GAP);
    }
    phaseRef.current = 'input';
    setPhase('input');
  }, []);

  const startGame = () => {
    const seq = [Math.floor(Math.random() * 4)];
    setSequence(seq);
    setLevel(1);
    playSequence(seq);
  };

  const handleClick = (id: number) => {
    if (phase !== 'input') return;
    setFlash(id);
    setTimeout(() => setFlash(null), 180);

    if (id !== sequence[playerIndex]) {
      phaseRef.current = 'lose';
      setPhase('lose');
      setBest(p => { const n = Math.max(p, level); localStorage.setItem('simon_best', String(n)); return n; });
      return;
    }
    const next = playerIndex + 1;
    if (next >= sequence.length) {
      const nextSeq = [...sequence, Math.floor(Math.random() * 4)];
      setSequence(nextSeq);
      const nextLevel = level + 1;
      setLevel(nextLevel);
      setTimeout(() => playSequence(nextSeq), 700);
    } else {
      setPlayerIndex(next);
    }
  };

  return (
    <div className="container-cute" style={{ maxWidth: '480px' }}>
      <div className="card-cute" style={{ background: '#faf5ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}><ArrowLeft size={14} /> Back</button>
          <span className="badge-cute">Simon Says 🎯</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', background: '#fff', borderRadius: '14px', padding: '0.6rem', border: '1px solid #ede9fe', marginBottom: '1.2rem' }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.72rem', color: '#6b7280' }}>Level</div><div className="font-cute" style={{ fontSize: '1.3rem', color: '#7c3aed' }}>{level}</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.72rem', color: '#6b7280' }}>Best 🏆</div><div className="font-cute" style={{ fontSize: '1.3rem', color: '#d97706' }}>{best}</div></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>Status</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: phase === 'input' ? '#059669' : '#6b7280' }}>
              {phase === 'showing' ? '👀 Watch' : phase === 'input' ? '🎮 Go!' : phase === 'lose' ? '💔 Oops' : '—'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: phase === 'idle' || phase === 'lose' ? '1.2rem' : 0 }}>
          {COLORS.map(c => (
            <button key={c.id} onClick={() => handleClick(c.id)} disabled={phase !== 'input'}
              style={{
                aspectRatio: '1', borderRadius: '20px', border: 'none', cursor: phase === 'input' ? 'pointer' : 'default',
                background: flash === c.id ? c.dark : c.light,
                boxShadow: flash === c.id ? `0 0 30px ${c.dark}99, 0 4px 20px rgba(0,0,0,0.2)` : '0 4px 14px rgba(0,0,0,0.08)',
                transform: flash === c.id ? 'scale(1.06)' : 'scale(1)',
                transition: 'all 0.1s ease',
              }} />
          ))}
        </div>

        {(phase === 'idle' || phase === 'lose') && (
          <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
            {phase === 'lose' && <><div style={{ fontSize: '2.5rem' }}>💔</div><h3 className="font-cute" style={{ color: '#dc2626', fontSize: '1.4rem', margin: '0 0 0.2rem' }}>Wrong!</h3><p style={{ color: '#6b7280', margin: '0 0 1rem', fontSize: '0.9rem' }}>You reached level {level}</p></>}
            {phase === 'idle' && <><div style={{ fontSize: '2.5rem', animation: 'float 2s ease infinite' }}>🎯</div><h3 className="font-cute" style={{ color: '#7c3aed', fontSize: '1.4rem', margin: '0.5rem 0' }}>Simon Says!</h3><p style={{ color: '#6b7280', margin: '0 0 1rem', fontSize: '0.88rem' }}>Watch the pattern, then repeat it exactly!</p></>}
            <button onClick={startGame} className="btn-cute btn-cute-primary"><Play size={14} /> {phase === 'lose' ? 'Try Again' : 'Start'}</button>
          </div>
        )}
      </div>
    </div>
  );
};
