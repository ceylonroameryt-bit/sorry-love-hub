import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Heart, Smile } from 'lucide-react';

interface ApologyScreenProps {
  onForgiven: () => void;
}

const DODGE_MESSAGES = [
  "No 😢",
  "Are you sure? 🥺",
  "Think again! 💔",
  "I'll give you hugs! 🤗",
  "I'll buy you snacks! 🍩",
  "Please click Yes! 🙏",
  "Pretty please? 💕",
  "Puppy eyes 🐶",
  "No = not an option 😂",
  "Just click Yes! 😘",
];

export const ApologyScreen: React.FC<ApologyScreenProps> = ({ onForgiven }) => {
  const [noCount, setNoCount] = useState(0);
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });
  const [noMoved, setNoMoved] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; left: number; delay: number; size: number }[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const noRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setHearts(Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 95,
      delay: Math.random() * 8,
      size: Math.random() * 14 + 10,
    })));
  }, []);

  const dodgeNo = () => {
    if (!cardRef.current || !noRef.current) return;
    const cr = cardRef.current.getBoundingClientRect();
    const nr = noRef.current.getBoundingClientRect();
    const safeX = cr.width - nr.width - 16;
    const safeY = cr.height - nr.height - 16;
    setNoPos({
      x: Math.random() * safeX - safeX / 2,
      y: Math.random() * safeY - (cr.height / 2),
    });
    setNoMoved(true);
    setNoCount(c => c + 1);
  };

  const handleYes = () => {
    const dur = 2500;
    const end = Date.now() + dur;
    const colors = ['#7c3aed', '#a78bfa', '#ddd6fe', '#c4b5fd', '#8b5cf6'];
    const shoot = () => {
      confetti({ particleCount: 40, spread: 80, colors, origin: { x: Math.random() * 0.4 + 0.1, y: 0.6 } });
      confetti({ particleCount: 40, spread: 80, colors, origin: { x: Math.random() * 0.4 + 0.5, y: 0.6 } });
      if (Date.now() < end) requestAnimationFrame(shoot);
    };
    shoot();
    setTimeout(onForgiven, 1600);
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', position: 'relative', padding: '1.5rem', background: 'linear-gradient(135deg, #fafafa 0%, #f5f3ff 100%)' }}>
      {/* Floating hearts */}
      <div className="hearts-bg">
        {hearts.map(h => (
          <Heart
            key={h.id}
            className="floating-heart"
            style={{
              left: `${h.left}%`,
              animationDelay: `${h.delay}s`,
              animationDuration: `${10 + h.delay}s`,
              width: h.size,
              height: h.size,
            }}
            fill="currentColor"
          />
        ))}
      </div>

      <div
        ref={cardRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '620px',
          background: '#fff',
          border: '2px solid #ddd6fe',
          borderRadius: '28px',
          boxShadow: '0 20px 60px rgba(124,58,237,0.15)',
          padding: '2.5rem',
          textAlign: 'center',
          zIndex: 10,
          animation: 'pop-in 0.5s ease',
        }}
      >
        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: '#f5f3ff', borderRadius: '50%', padding: '1.2rem', animation: 'float 3s ease-in-out infinite', display: 'inline-flex' }}>
            <Heart size={48} fill="#7c3aed" color="#7c3aed" />
          </div>
        </div>

        <h1 className="font-cute" style={{ fontSize: '2.2rem', color: '#4c1d95', margin: '0 0 1.2rem 0' }}>
          Hey, I'm SO Sorry! 🥺💜
        </h1>

        {/* Letter */}
        <div style={{
          background: '#faf5ff',
          border: '1.5px solid #e9d5ff',
          borderRadius: '16px',
          padding: '1.4rem 1.6rem',
          marginBottom: '2rem',
          textAlign: 'left',
          lineHeight: 1.7,
          fontSize: '1rem',
          color: '#374151',
          borderLeft: '4px solid #7c3aed',
        }}>
          <p style={{ margin: '0 0 0.8rem' }}>
            I know I made a mistake, and I feel really bad about it. You mean the absolute world to me, and the last thing I ever want is to make you sad or upset. 💔
          </p>
          <p style={{ margin: '0 0 0.8rem' }}>
            To make it up to you, I built this cozy little space just for us — with cute games we can play online together in real time! 🎮✨
          </p>
          <p style={{ margin: 0, fontWeight: 600, color: '#6d28d9' }}>
            Will you forgive me and play with me? Please? 👉👈
          </p>
        </div>

        {/* Buttons */}
        <div style={{ position: 'relative', minHeight: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
          <button
            onClick={handleYes}
            className="btn-cute btn-cute-primary"
            style={{ fontSize: '1.15rem', padding: '0.9rem 2.2rem' }}
          >
            <Smile size={22} /> Yes, I forgive you! 💜
          </button>

          <button
            ref={noRef}
            onMouseEnter={dodgeNo}
            onTouchStart={e => { e.preventDefault(); dodgeNo(); }}
            onClick={dodgeNo}
            className="btn-cute btn-cute-secondary"
            style={{
              position: noMoved ? 'absolute' : 'relative',
              left: noMoved ? `calc(50% + ${noPos.x}px)` : 'auto',
              top: noMoved ? `${noPos.y}px` : 'auto',
              transition: noMoved ? 'left 0.18s ease, top 0.18s ease' : 'none',
              zIndex: 20,
            }}
          >
            {DODGE_MESSAGES[Math.min(noCount, DODGE_MESSAGES.length - 1)]}
          </button>
        </div>

        {noCount >= 3 && (
          <p className="font-cute" style={{ marginTop: '1.2rem', color: '#8b5cf6', fontSize: '0.95rem', animation: 'wiggle 0.6s ease infinite' }}>
            {noCount >= 7 ? "Okay you're just testing my reflexes 😂" : "Oops, the button is running away! 🤭"}
          </p>
        )}
      </div>
    </div>
  );
};
