import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';

interface Pipe {
  x: number;
  topHeight: number;
  bottomHeight: number;
  passed: boolean;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 460;
const GAP_SIZE = 125;
const PIPE_WIDTH = 50;
const PIPE_SPEED = 2.2;
const GRAVITY = 0.32;
const FLAP_FORCE = -5.8;

interface Props { onBack: () => void; }

export const OfflineFlappyHeart: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem('flappy_best') || '0'));
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game states in ref to bypass closure issues in requestAnimationFrame
  const yRef = useRef(200);
  const vyRef = useRef(0);
  const pipesRef = useRef<Pipe[]>([]);
  const frameIdRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const phaseRef = useRef<'idle' | 'playing' | 'ended'>('idle');

  const spawnPipe = (xOffset: number) => {
    const minHeight = 40;
    const maxVariation = CANVAS_HEIGHT - GAP_SIZE - minHeight * 2;
    const topHeight = Math.floor(Math.random() * maxVariation) + minHeight;
    const bottomHeight = CANVAS_HEIGHT - GAP_SIZE - topHeight;
    return { x: xOffset, topHeight, bottomHeight, passed: false };
  };

  const startPlaying = () => {
    yRef.current = 200;
    vyRef.current = 0;
    pipesRef.current = [spawnPipe(CANVAS_WIDTH + 50), spawnPipe(CANVAS_WIDTH + 260)];
    scoreRef.current = 0;
    setScore(0);
    phaseRef.current = 'playing';
    setPhase('playing');
  };

  const handleFlap = () => {
    if (phaseRef.current === 'idle') {
      startPlaying();
    } else if (phaseRef.current === 'playing') {
      vyRef.current = FLAP_FORCE;
    }
  };

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      // 1. CLEAR & BACKGROUND
      ctx.fillStyle = '#faf5ff';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw clouds background
      ctx.fillStyle = 'rgba(167,139,250,0.15)';
      ctx.beginPath();
      ctx.arc(80, 80, 40, 0, Math.PI * 2);
      ctx.arc(120, 80, 50, 0, Math.PI * 2);
      ctx.arc(160, 80, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(280, 180, 30, 0, Math.PI * 2);
      ctx.arc(310, 180, 40, 0, Math.PI * 2);
      ctx.arc(340, 180, 30, 0, Math.PI * 2);
      ctx.fill();

      if (phaseRef.current === 'playing') {
        // 2. UPDATE POSITION
        vyRef.current += GRAVITY;
        yRef.current += vyRef.current;

        // Floor / ceiling collision
        if (yRef.current < 12) {
          yRef.current = 12;
          vyRef.current = 0;
        }
        if (yRef.current > CANVAS_HEIGHT - 12) {
          setPhase('ended');
        }

        // 3. PIPES LOGIC
        const pipes = pipesRef.current;
        pipes.forEach(pipe => {
          pipe.x -= PIPE_SPEED;

          // Collision detection with pipe
          const heartX = 80;
          const heartY = yRef.current;
          const r = 13;

          const inXRange = heartX + r > pipe.x && heartX - r < pipe.x + PIPE_WIDTH;
          const hitTop = inXRange && heartY - r < pipe.topHeight;
          const hitBottom = inXRange && heartY + r > CANVAS_HEIGHT - pipe.bottomHeight;

          if (hitTop || hitBottom) {
            setPhase('ended');
          }

          // Score check
          if (!pipe.passed && pipe.x + PIPE_WIDTH < heartX) {
            pipe.passed = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);
          }
        });

        // Remove offscreen, spawn new
        if (pipes.length > 0 && pipes[0].x < -PIPE_WIDTH) {
          pipes.shift();
          pipes.push(spawnPipe(pipes[pipes.length - 1].x + 210));
        }
      }

      // 4. DRAW PIPES
      pipesRef.current.forEach(pipe => {
        // Gradient color for pipes
        const gradTop = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
        gradTop.addColorStop(0, '#c084fc');
        gradTop.addColorStop(1, '#a855f7');
        ctx.fillStyle = gradTop;

        // Top pipe
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#7e22ce';
        ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);

        // Bottom pipe
        const gradBottom = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
        gradBottom.addColorStop(0, '#c084fc');
        gradBottom.addColorStop(1, '#a855f7');
        ctx.fillStyle = gradBottom;
        ctx.fillRect(pipe.x, CANVAS_HEIGHT - pipe.bottomHeight, PIPE_WIDTH, pipe.bottomHeight);
        ctx.strokeRect(pipe.x, CANVAS_HEIGHT - pipe.bottomHeight, PIPE_WIDTH, pipe.bottomHeight);
      });

      // 5. DRAW HEART
      ctx.save();
      ctx.translate(80, yRef.current);
      // Tilt heart based on velocity
      ctx.rotate(Math.min(Math.max(vyRef.current * 0.05, -0.4), 0.6));
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      // Simple heart vector formula
      const d = 14;
      ctx.moveTo(0, -d / 3);
      ctx.bezierCurveTo(-d / 2, -d, -d, -d / 2, -0, d / 2 + 2);
      ctx.bezierCurveTo(d, -d / 2, d / 2, -d, 0, -d / 3);
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      ctx.restore();

      frameIdRef.current = requestAnimationFrame(loop);
    };

    frameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase === 'ended') {
      if (score > best) {
        setBest(score);
        localStorage.setItem('flappy_best', String(score));
      }
    }
  }, [phase, score, best]);

  return (
    <div className="container-cute" style={{ maxWidth: '440px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <span className="badge-cute">Flappy Heart 💖</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', background: '#fff', borderRadius: '14px', padding: '0.6rem', border: '1px solid #ede9fe', marginBottom: '1rem' }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.72rem', color: '#6b7280' }}>Score</div><div className="font-cute" style={{ fontSize: '1.3rem', color: '#ec4899' }}>{score}</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.72rem', color: '#6b7280' }}>Best 🏆</div><div className="font-cute" style={{ fontSize: '1.3rem', color: '#d97706' }}>{best}</div></div>
        </div>

        {/* Canvas area */}
        <div
          onClick={handleFlap}
          style={{
            border: '3px solid #ddd6fe',
            borderRadius: '16px',
            overflow: 'hidden',
            background: '#faf5ff',
            cursor: 'pointer',
            position: 'relative',
            touchAction: 'none',
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{ display: 'block', width: '100%' }}
          />

          {phase === 'idle' && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.7)',
              textAlign: 'center',
              padding: '1rem',
            }}>
              <div style={{ fontSize: '3rem', animation: 'float 1.5s ease infinite', marginBottom: '0.5rem' }}>💖</div>
              <h3 className="heading-lg" style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Flappy Heart</h3>
              <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '1rem', maxWidth: '240px' }}>
                Tap the screen to flap your heart upwards and avoid purple pipes!
              </p>
              <button className="btn-cute btn-cute-primary" style={{ pointerEvents: 'none' }}>
                <Play size={13} /> Tap to Play
              </button>
            </div>
          )}

          {phase === 'ended' && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.85)',
              textAlign: 'center',
              padding: '1rem',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💀</div>
              <h3 className="font-cute" style={{ color: '#dc2626', fontSize: '1.4rem', margin: '0 0 0.5rem' }}>Oops! Crashed</h3>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>
                You scored <strong style={{ color: '#7c3aed' }}>{score}</strong> pipes!
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startPlaying();
                }}
                className="btn-cute btn-cute-primary"
              >
                <RotateCcw size={13} /> Restart
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
