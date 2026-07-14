import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Pencil, Eye } from 'lucide-react';
import { WORD_BANK, ALL_CATEGORIES } from '../utils/wordBank';

const TIMER_SECONDS = 60;
const COLORS = ['#7c3aed', '#ec4899', '#059669', '#d97706', '#2563eb', '#dc2626'];
const BRUSH_SIZES = [2, 5, 10, 18];

function pickWord(): { word: string; hint: string; category: string } {
  const cat = ALL_CATEGORIES[Math.floor(Math.random() * ALL_CATEGORIES.length)];
  const entries = WORD_BANK[cat];
  const entry = entries[Math.floor(Math.random() * entries.length)];
  return { ...entry, category: cat };
}

type Phase = 'start' | 'drawing' | 'guessing' | 'reveal';

interface Props { onBack: () => void; }

export const OfflineDoodle: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase] = useState<Phase>('start');
  const [current, setCurrent] = useState(pickWord);
  const [guess, setGuess] = useState('');
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [scores, setScores] = useState({ drawer: 0, guesser: 0 });
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [color, setColor] = useState('#7c3aed');
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1]);
  const [erasing, setErasing] = useState(false);
  const [round, setRound] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPt = useRef<{ x: number; y: number } | null>(null);
  const timerRef = useRef<number | null>(null);

  // ── Canvas helpers ─────────────────────────────────────────────────────────
  const clearCanvas = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (phase !== 'drawing') return;
    e.preventDefault();
    drawing.current = true;
    const pt = getPos(e);
    if (pt) lastPt.current = pt;
  }, [phase]);

  const continueDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current || phase !== 'drawing') return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pt = getPos(e);
    if (!pt || !lastPt.current) return;
    ctx.globalCompositeOperation = erasing ? 'destination-out' : 'source-over';
    ctx.strokeStyle = erasing ? 'rgba(255,255,255,1)' : color;
    ctx.lineWidth = erasing ? brushSize * 2 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPt.current.x, lastPt.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    lastPt.current = pt;
  }, [phase, color, brushSize, erasing]);

  const endDraw = useCallback(() => { drawing.current = false; lastPt.current = null; }, []);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'drawing') { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = window.setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setPhase('guessing');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const startDrawing = () => {
    setCurrent(pickWord());
    setGuess('');
    setCorrect(null);
    setTimeLeft(TIMER_SECONDS);
    setErasing(false);
    clearCanvas();
    setPhase('drawing');
  };

  const doneDrawing = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('guessing');
  };

  const submitGuess = () => {
    const isCorrect = guess.trim().toLowerCase() === current.word.toLowerCase();
    setCorrect(isCorrect);
    if (isCorrect) setScores(s => ({ ...s, guesser: s.guesser + 1 }));
    else setScores(s => ({ ...s, drawer: s.drawer + 1 }));
    setPhase('reveal');
  };

  const nextRound = () => {
    setRound(r => r + 1);
    startDrawing();
  };

  const timerPct = (timeLeft / TIMER_SECONDS) * 100;
  const timerCol = timerPct > 50 ? '#059669' : timerPct > 25 ? '#d97706' : '#dc2626';

  return (
    <div className="container-cute" style={{ maxWidth: '680px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Doodle Quiz 🎨</span>
          <span style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 700 }}>Round {round}</span>
        </div>

        {/* ── START ── */}
        {phase === 'start' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '3.5rem', animation: 'float 2s ease infinite', marginBottom: '1rem' }}>🎨✏️</div>
            <h2 className="heading-lg">Doodle Quiz!</h2>
            <p style={{ color: '#6b7280', maxWidth: '440px', margin: '0 auto 1rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
              <strong>Pass & Play!</strong> One person sees the word and draws it. The other person takes the phone and guesses!
            </p>
            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', margin: '1.5rem 0', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <Pencil size={28} color="#7c3aed" />
                <div style={{ fontWeight: 700, color: '#4c1d95', fontSize: '0.85rem', marginTop: '4px' }}>Drawer: {scores.drawer} pts</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Eye size={28} color="#ec4899" />
                <div style={{ fontWeight: 700, color: '#4c1d95', fontSize: '0.85rem', marginTop: '4px' }}>Guesser: {scores.guesser} pts</div>
              </div>
            </div>
            <button onClick={startDrawing} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', padding: '0.9rem 2.5rem', fontSize: '1.1rem' }}>
              <Pencil size={18} /> Start Drawing!
            </button>
          </div>
        )}

        {/* ── DRAWING ── */}
        {phase === 'drawing' && (
          <div>
            {/* Word reveal for drawer */}
            <div style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', borderRadius: '16px', padding: '1rem 1.5rem', marginBottom: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 600, marginBottom: '4px' }}>🤫 Only YOU can see this! Don't show your partner!</div>
              <div className="font-cute" style={{ fontSize: '2rem', color: '#4c1d95', letterSpacing: '0.1em' }}>{current.word}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>{current.category}</div>
            </div>

            {/* Timer */}
            <div style={{ marginBottom: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: timerCol, fontWeight: 700 }}>⏱️ {timeLeft}s</span>
                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Draw your best! 🖌️</span>
              </div>
              <div style={{ height: '6px', background: '#ede9fe', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${timerPct}%`, background: timerCol, borderRadius: '99px', transition: 'width 1s linear, background 0.5s' }} />
              </div>
            </div>

            {/* Canvas */}
            <div style={{ border: '2.5px solid #a78bfa', borderRadius: '14px', overflow: 'hidden', marginBottom: '0.8rem', background: '#fff', cursor: erasing ? 'cell' : 'crosshair', touchAction: 'none' }}>
              <canvas
                ref={canvasRef}
                width={600} height={340}
                style={{ display: 'block', width: '100%' }}
                onMouseDown={startDraw} onMouseMove={continueDraw} onMouseUp={endDraw} onMouseLeave={endDraw}
                onTouchStart={startDraw} onTouchMove={continueDraw} onTouchEnd={endDraw}
              />
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {/* Colors */}
              <div style={{ display: 'flex', gap: '5px' }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => { setColor(c); setErasing(false); }} style={{
                    width: '26px', height: '26px', borderRadius: '50%', background: c,
                    border: color === c && !erasing ? '3px solid #1e1b4b' : '2px solid rgba(0,0,0,0.15)',
                    cursor: 'pointer', transition: 'transform 0.1s',
                  }} />
                ))}
              </div>
              {/* Black & White */}
              {['#000000', '#ffffff'].map(c => (
                <button key={c} onClick={() => { setColor(c); setErasing(false); }} style={{
                  width: '26px', height: '26px', borderRadius: '50%', background: c,
                  border: color === c && !erasing ? '3px solid #7c3aed' : '2px solid #ddd6fe',
                  cursor: 'pointer',
                }} />
              ))}
              {/* Brush sizes */}
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {BRUSH_SIZES.map(s => (
                  <button key={s} onClick={() => setBrushSize(s)} style={{
                    width: `${s + 10}px`, height: `${s + 10}px`, borderRadius: '50%',
                    background: brushSize === s ? '#7c3aed' : '#ddd6fe',
                    border: 'none', cursor: 'pointer',
                  }} />
                ))}
              </div>
              <button onClick={() => setErasing(e => !e)} className="btn-cute btn-cute-secondary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem', background: erasing ? '#ede9fe' : undefined }}>
                {erasing ? '✏️ Draw' : '🧹 Erase'}
              </button>
              <button onClick={clearCanvas} className="btn-cute btn-cute-secondary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}>
                <RefreshCw size={13} /> Clear
              </button>
            </div>

            <button onClick={doneDrawing} className="btn-cute btn-cute-primary" style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' }}>
              Done Drawing! Pass the phone ➡️
            </button>
          </div>
        )}

        {/* ── GUESSING ── */}
        {phase === 'guessing' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: '#7c3aed', fontWeight: 700, marginBottom: '1rem' }}>
              🤔 What did they draw? Look at the canvas and guess!
            </div>
            <div style={{ border: '2.5px solid #a78bfa', borderRadius: '14px', overflow: 'hidden', marginBottom: '1.2rem', background: '#fff' }}>
              <canvas ref={canvasRef} width={600} height={340} style={{ display: 'block', width: '100%', pointerEvents: 'none' }} />
            </div>
            <div style={{ maxWidth: '380px', margin: '0 auto' }}>
              <input
                className="input-cute"
                placeholder="Type your guess..."
                value={guess}
                onChange={e => setGuess(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && guess.trim() && submitGuess()}
                style={{ textAlign: 'center', fontSize: '1.1rem', marginBottom: '1rem' }}
                autoFocus
              />
              <button onClick={submitGuess} disabled={!guess.trim()} className="btn-cute btn-cute-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Submit Guess! 🎯
              </button>
            </div>
          </div>
        )}

        {/* ── REVEAL ── */}
        {phase === 'reveal' && (
          <div style={{ textAlign: 'center', animation: 'pop-in 0.4s ease' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{correct ? '🎉' : '😅'}</div>
            <h3 className="font-cute" style={{ color: correct ? '#059669' : '#dc2626', fontSize: '2rem', margin: '0 0 0.5rem' }}>
              {correct ? 'Correct! 🎯' : 'Not quite!'}
            </h3>
            <p style={{ color: '#374151', marginBottom: '0.5rem' }}>
              The word was: <strong style={{ color: '#4c1d95', fontSize: '1.2rem' }}>{current.word}</strong>
            </p>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{current.hint}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
              <div style={{ textAlign: 'center', background: '#f5f3ff', borderRadius: '14px', padding: '0.7rem 1.5rem', border: '1px solid #ddd6fe' }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Drawer 🎨</div>
                <div className="font-cute" style={{ color: '#7c3aed', fontSize: '1.4rem' }}>{scores.drawer}</div>
              </div>
              <div style={{ textAlign: 'center', background: '#fdf2f8', borderRadius: '14px', padding: '0.7rem 1.5rem', border: '1px solid #f9a8d4' }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Guesser 🔍</div>
                <div className="font-cute" style={{ color: '#ec4899', fontSize: '1.4rem' }}>{scores.guesser}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={nextRound} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' }}>
                <Pencil size={15} /> Next Round (Swap!)
              </button>
              <button onClick={() => { setScores({ drawer: 0, guesser: 0 }); setRound(1); setPhase('start'); }} className="btn-cute btn-cute-secondary">
                Reset Game
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
