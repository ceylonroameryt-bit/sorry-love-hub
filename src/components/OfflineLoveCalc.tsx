import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, Heart } from 'lucide-react';

const QUESTIONS = [
  { q: "What color makes you happiest? 🎨", opts: ["Purple 💜", "Pink 🩷", "Blue 💙", "Yellow 💛"], scores: [10, 8, 6, 7] },
  { q: "Pick a dream date! 🌙", opts: ["Stargazing picnic 🌟", "Cozy movie night 🎬", "Cooking together 🍳", "Surprise adventure 🗺️"], scores: [9, 8, 9, 10] },
  { q: "What are you like in the morning? ☀️", opts: ["Happy early bird 🐦", "Grumpy sleepy bear 🐻", "Slow and peaceful 😌", "Depends on coffee ☕"], scores: [8, 6, 8, 7] },
  { q: "Your love language is mainly... ❤️", opts: ["Words of affirmation 💬", "Acts of service 🛠️", "Quality time ⏰", "Physical touch 🤗"], scores: [9, 8, 9, 9] },
  { q: "Favorite season? 🍂", opts: ["Spring blossoms 🌸", "Sunny summer ☀️", "Cozy autumn 🍁", "Magical winter ❄️"], scores: [8, 9, 9, 10] },
  { q: "Pick a pet! 🐾", opts: ["Fluffy cat 🐱", "Loyal dog 🐶", "Cute bunny 🐰", "Exotic parrot 🦜"], scores: [8, 9, 8, 7] },
  { q: "Describe your vibe today... ✨", opts: ["Soft and dreamy 💭", "Energetic and fun 🌟", "Calm and thoughtful 🧘", "Silly and chaotic 😂"], scores: [8, 9, 8, 7] },
  { q: "Ideal weekend? 🗓️", opts: ["Sleep in and relax 😴", "Go out and explore 🌍", "Create something 🎨", "Cook and binge TV 🍿"], scores: [7, 9, 9, 8] },
  { q: "Pick a fictional world! 🌏", opts: ["Harry Potter 🧙", "Studio Ghibli 🌿", "Star Wars ⭐", "Disney fairytale 🏰"], scores: [9, 10, 8, 9] },
  { q: "How do you show love? 💕", opts: ["Sweet texts all day 📱", "Thoughtful little gifts 🎁", "Making time for them ⏰", "Always listening 👂"], scores: [9, 9, 10, 9] },
];

interface Props { onBack: () => void; }

export const OfflineLoveCalc: React.FC<Props> = ({ onBack }) => {
  const [idx, setIdx] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [done, setDone] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const current = QUESTIONS[idx];
  const maxScore = QUESTIONS.reduce((s, q) => s + Math.max(...q.scores), 0);

  const handleSelect = (optIdx: number) => {
    if (selectedIdx !== null) return;
    setSelectedIdx(optIdx);
  };

  const handleNext = () => {
    if (selectedIdx === null) return;
    const points = current.scores[selectedIdx];
    const newTotal = totalScore + points;
    setTotalScore(newTotal);
    setSelectedIdx(null);
    if (idx + 1 >= QUESTIONS.length) {
      setDone(true);
    } else {
      setIdx(i => i + 1);
    }
  };

  const reset = () => { setIdx(0); setTotalScore(0); setDone(false); setSelectedIdx(null); };

  const pct = Math.round((totalScore / maxScore) * 100);
  const getMessage = () => {
    if (pct >= 90) return { msg: "💜 You are a certified romantic! Your partner is so lucky!", emoji: '🌟' };
    if (pct >= 75) return { msg: "❤️ You have a beautiful heart full of love and warmth!", emoji: '💖' };
    if (pct >= 60) return { msg: "💛 Your love is genuine and growing stronger every day!", emoji: '🌻' };
    return { msg: "💙 You love in your own unique way — that's perfectly beautiful!", emoji: '✨' };
  };

  return (
    <div className="container-cute" style={{ maxWidth: '520px' }}>
      <div className="card-cute" style={{ background: 'linear-gradient(160deg, #faf5ff, #fff1f2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <span className="badge-cute">Love Calculator 💕</span>
          <button onClick={reset} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <RotateCcw size={14} />
          </button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', animation: 'pop-in 0.5s ease' }}>
            {/* Animated love meter */}
            <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto 1.5rem' }}>
              <svg viewBox="0 0 160 160" style={{ width: '100%', height: '100%' }}>
                <circle cx="80" cy="80" r="68" fill="none" stroke="#ede9fe" strokeWidth="14" />
                <circle cx="80" cy="80" r="68" fill="none" stroke="url(#grad)" strokeWidth="14"
                  strokeDasharray={`${2 * Math.PI * 68 * pct / 100} ${2 * Math.PI * 68}`}
                  strokeLinecap="round" strokeDashoffset={2 * Math.PI * 68 * 0.25}
                  style={{ transition: 'stroke-dasharray 1s ease' }} />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem' }}>{getMessage().emoji}</div>
                <div className="font-cute" style={{ fontSize: '1.6rem', color: '#4c1d95', lineHeight: 1 }}>{pct}%</div>
              </div>
            </div>

            <h2 className="font-cute" style={{ fontSize: '1.8rem', color: '#4c1d95', marginBottom: '1rem' }}>Your Love Score!</h2>
            <div style={{ background: '#fff', border: '2px solid #ddd6fe', borderRadius: '20px', padding: '1.2rem', marginBottom: '2rem', fontSize: '1rem', color: '#374151', lineHeight: 1.6 }}>
              {getMessage().msg}
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
              <button onClick={reset} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }}>
                <RotateCcw size={14} /> Try Again
              </button>
              <button onClick={onBack} className="btn-cute btn-cute-secondary">Back</button>
            </div>
          </div>
        ) : (
          <div>
            {/* Progress */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              <span>Question {idx + 1} of {QUESTIONS.length}</span>
              <span style={{ color: '#7c3aed' }}>
                {'♥'.repeat(idx)} {'♡'.repeat(QUESTIONS.length - idx)}
              </span>
            </div>
            <div style={{ height: '6px', background: '#ede9fe', borderRadius: '99px', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div style={{ height: '100%', width: `${(idx / QUESTIONS.length) * 100}%`, background: 'linear-gradient(to right, #7c3aed, #ec4899)', borderRadius: '99px', transition: 'width 0.4s' }} />
            </div>

            <div style={{ background: '#fff', border: '1px solid #ede9fe', borderRadius: '20px', padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              <Heart size={24} color="#ec4899" fill="#ec4899" style={{ marginBottom: '0.5rem', animation: 'pulse-gentle 1.5s infinite' }} />
              <h3 className="font-cute" style={{ fontSize: '1.3rem', color: '#4c1d95', margin: 0, lineHeight: 1.4 }}>{current.q}</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1rem' }}>
              {current.opts.map((opt, i) => (
                <button key={i} onClick={() => handleSelect(i)} className="btn-cute"
                  style={{ padding: '0.9rem 1.2rem', fontWeight: 700, justifyContent: 'center', color: '#4c1d95', border: `2px solid ${selectedIdx === i ? '#7c3aed' : '#ddd6fe'}`, background: selectedIdx === i ? '#f5f3ff' : '#fff', transition: 'all 0.2s', fontSize: '0.95rem' }}>
                  {opt}
                </button>
              ))}
            </div>

            {selectedIdx !== null && (
              <button onClick={handleNext} className="btn-cute btn-cute-primary" style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', animation: 'pop-in 0.2s ease' }}>
                {idx + 1 >= QUESTIONS.length ? 'See My Result! 💕' : 'Next Question ➡️'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
