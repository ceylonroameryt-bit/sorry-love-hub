import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Play } from 'lucide-react';

const SECTORS = [
  { text: 'Give a 10s hug! 🤗', color: '#ffedd5', textCol: '#c2410c' },
  { text: 'Say a secret compliment 🤫', color: '#fce7f3', textCol: '#be185d' },
  { text: 'Sing a song snippet 🎵', color: '#dbeafe', textCol: '#1d4ed8' },
  { text: 'Make a funny face 😜', color: '#e0e7ff', textCol: '#4338ca' },
  { text: 'Share a sweet memory 💭', color: '#f3e8ff', textCol: '#6b21a8' },
  { text: 'Show a silly dance 💃', color: '#ecfdf5', textCol: '#047857' },
  { text: 'Give a cute kiss 💋', color: '#ffe4e6', textCol: '#be123c' },
  { text: 'Tell a funny joke 😂', color: '#fef9c3', textCol: '#a16207' },
];

interface Props { onBack: () => void; }

export const OfflineSpinWheel: React.FC<Props> = ({ onBack }) => {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);

  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 10;

    ctx.clearRect(0, 0, w, h);

    const arc = (Math.PI * 2) / SECTORS.length;

    SECTORS.forEach((sec, i) => {
      const startAngle = i * arc + angle;
      const endAngle = (i + 1) * arc + angle;

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.fillStyle = sec.color;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#fff';
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = sec.textCol;
      ctx.font = 'bold 11px sans-serif';
      
      // Limit text length to avoid overflow
      const txt = sec.text.length > 20 ? sec.text.slice(0, 18) + '..' : sec.text;
      ctx.fillText(txt, r - 15, 4);
      ctx.restore();
    });

    // Center pin
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#7c3aed';
    ctx.stroke();
  };

  useEffect(() => {
    drawWheel(0);
  }, []);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    const extraSpins = 4 + Math.random() * 4;
    const totalRotation = extraSpins * Math.PI * 2;
    const duration = 3500;
    const startTime = performance.now();

    const initialRotation = rotationRef.current;

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentAngle = initialRotation + totalRotation * ease;
      rotationRef.current = currentAngle;

      drawWheel(currentAngle);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        // Calculate resulting sector
        // The pointer is at angle 0 (right side).
        // Angle points clockwise. So the landing index depends on current angle mod 2pi.
        const normalized = (currentAngle % (Math.PI * 2));
        const arc = (Math.PI * 2) / SECTORS.length;
        
        // Find which sector aligns with the arrow pointer on the right (0 rad)
        // Since wheel rotates clockwise, a slice at index `i` is located at `[i*arc, (i+1)*arc]`.
        // To see what matches 0 rad, we calculate:
        const sectorIndex = (SECTORS.length - Math.floor(normalized / arc)) % SECTORS.length;
        setResult(SECTORS[sectorIndex].text);
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="container-cute" style={{ maxWidth: '500px' }}>
      <div className="card-cute" style={{ background: '#faf5ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <span className="badge-cute">Spin the Wheel 🎡</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', margin: '2rem 0' }}>
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            style={{ borderRadius: '50%', boxShadow: '0 8px 24px rgba(124,58,237,0.15)', display: 'block' }}
          />
          {/* Arrow pointer indicator */}
          <div style={{
            position: 'absolute',
            right: '-6px',
            top: '50%',
            transform: 'translateY(-50%) rotate(180deg)',
            width: 0,
            height: 0,
            borderTop: '12px solid transparent',
            borderBottom: '12px solid transparent',
            borderRight: '20px solid #7c3aed',
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.15))',
            zIndex: 10,
          }} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={spin}
            disabled={spinning}
            className="btn-cute btn-cute-primary"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', padding: '0.8rem 2.2rem' }}
          >
            <Play size={14} /> {spinning ? 'Spinning...' : 'Spin the Wheel!'}
          </button>

          {result && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1.2rem',
              background: '#fdf2f8',
              border: '2.5px dashed #fbcfe8',
              borderRadius: '16px',
              animation: 'pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
              <div style={{ fontSize: '0.8rem', color: '#be185d', fontWeight: 700, marginBottom: '4px' }}>🎯 YOUR CHALLENGE</div>
              <div className="font-cute" style={{ fontSize: '1.2rem', color: '#9d174d' }}>{result}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
