import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Zap, Award } from 'lucide-react';

interface TFQuestion {
  statement: string;
  answer: boolean;
  explanation: string;
}

const ALL_QUESTIONS: TFQuestion[] = [
  { statement: "Honey never expires and has been found in 3000-year-old Egyptian tombs. 🍯", answer: true, explanation: "Archaeologists found 3,000-year-old honey in Egyptian tombs — still edible!" },
  { statement: "Sharks are the only fish that can blink with both eyes. 🦈", answer: false, explanation: "Sharks don't blink. They have no eyelids! Some have a nictitating membrane instead." },
  { statement: "A group of flamingos is called a flamboyance. 🦩", answer: true, explanation: "Yes! A flamboyance of flamingos is the official collective noun." },
  { statement: "The Eiffel Tower grows taller in summer due to heat expansion. 🗼", answer: true, explanation: "Metal expands in heat — the tower can grow up to 15cm taller in summer!" },
  { statement: "Cats always land on their feet because of magic. 🐱", answer: false, explanation: "It's physics! Cats have a 'righting reflex' that helps them rotate mid-air." },
  { statement: "Octopuses have three hearts. 🐙", answer: true, explanation: "Two hearts pump blood to the gills; one pumps it to the rest of the body." },
  { statement: "A day on Venus is longer than a year on Venus. ☀️", answer: true, explanation: "Venus rotates so slowly that one day on Venus = 243 Earth days, but its year is 225 days!" },
  { statement: "Bananas are technically berries, but strawberries are not. 🍌🍓", answer: true, explanation: "Botanically, bananas qualify as berries. Strawberries are accessory fruits!" },
  { statement: "Humans share 60% of their DNA with bananas. 🍌", answer: true, explanation: "We share about 60% of our genes with bananas. Life is surprisingly similar!" },
  { statement: "The Great Wall of China is visible from space with the naked eye. 🏯", answer: false, explanation: "It is too narrow to be seen from space with the naked eye — this is a common myth!" },
  { statement: "Cleopatra lived closer in time to the Moon landing than to the pyramids' construction. 🏺", answer: true, explanation: "Pyramids built ~2500 BC; Cleopatra ~69 BC; Moon landing 1969 AD. She's closer to 1969!" },
  { statement: "A group of crows is called a murder. 🐦‍⬛", answer: true, explanation: "A murder of crows is the correct collective noun. Spooky but true!" },
  { statement: "Water can boil and freeze at the same time. 💧", answer: true, explanation: "At the 'triple point' — a specific pressure and temperature — water can exist as solid, liquid, and gas simultaneously." },
  { statement: "The shortest war in history lasted 38 minutes. ⚔️", answer: true, explanation: "The Anglo-Zanzibar War of 1896 lasted between 38 and 45 minutes." },
  { statement: "A snail can sleep for 3 years. 🐌", answer: true, explanation: "Snails can hibernate (or estivate) for up to 3 years when conditions are unfavorable." },
  { statement: "The human eye can distinguish about 1 million colors. 👁️", answer: true, explanation: "The human eye can detect around 1 million different color variations." },
  { statement: "Lightning never strikes the same place twice. ⚡", answer: false, explanation: "Lightning frequently strikes the same place multiple times — especially tall structures!" },
  { statement: "Penguins propose to their mates with pebbles. 🐧", answer: true, explanation: "Male Adelie penguins search for the perfect pebble to give to their chosen mate!" },
  { statement: "The average person walks about 100,000 miles in a lifetime. 🚶", answer: true, explanation: "The average person walks roughly 100,000 miles over the course of their lifetime." },
  { statement: "Butterflies taste with their feet. 🦋", answer: true, explanation: "Butterflies have taste sensors on their feet — they taste food just by landing on it!" },
  { statement: "A dog's nose print is as unique as a human fingerprint. 🐶", answer: true, explanation: "Every dog has a unique nose print pattern, just like human fingerprints." },
  { statement: "Wombats produce cube-shaped droppings. 🐨", answer: true, explanation: "Wombats are the only animals known to produce cube-shaped feces — used for marking territory!" },
  { statement: "There are more trees on Earth than stars in the Milky Way. 🌳", answer: true, explanation: "Earth has roughly 3 trillion trees — more than the estimated 200–400 billion stars in the Milky Way." },
  { statement: "Goldfish have a 3-second memory. 🐟", answer: false, explanation: "Goldfish can actually remember things for months! The 3-second memory is a complete myth." },
  { statement: "The first oranges were not orange — they were green. 🍊", answer: true, explanation: "Oranges from tropical climates stay green even when ripe. Orange-colored oranges are a result of cold weather." },
  { statement: "You can hear a blue whale's heartbeat from 2 miles away. 🐋", answer: true, explanation: "A blue whale's heart is so massive and powerful, it can be detected from miles away." },
  { statement: "Mozart was left-handed. 🎹", answer: false, explanation: "Mozart was actually ambidextrous but primarily right-handed according to most historians." },
  { statement: "Hot water freezes faster than cold water under certain conditions. 🌡️", answer: true, explanation: "This is known as the Mpemba effect — hot water can freeze faster than cold water in some conditions." },
  { statement: "The moon has moonquakes. 🌙", answer: true, explanation: "The Moon experiences its own quakes, caused by tidal forces from Earth's gravity." },
  { statement: "You can cry underwater. 💦", answer: true, explanation: "Your tear ducts still function underwater — you just can't see the tears since they mix with water!" },
];

interface Props { onBack: () => void; }

export const OfflineFastFacts: React.FC<Props> = ({ onBack }) => {
  const [questions] = useState(() => {
    const q = [...ALL_QUESTIONS];
    for (let i = q.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [q[i], q[j]] = [q[j], q[i]]; }
    return q.slice(0, 15);
  });

  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [phase, setPhase] = useState<'playing' | 'result' | 'done'>('playing');
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  useEffect(() => {
    if (phase !== 'playing') return;
    const t = setInterval(() => {
      setTimeLeft(tt => {
        if (tt <= 1) { clearInterval(t); setPhase('done'); return 0; }
        return tt - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  const handleAnswer = (ans: boolean) => {
    if (phase !== 'playing') return;
    const correct = ans === questions[qIndex].answer;
    const newStreak = correct ? streak + 1 : 0;
    if (correct) { setScore(s => s + 10 + (newStreak >= 3 ? 5 : 0)); }
    setStreak(newStreak);
    setMaxStreak(m => Math.max(m, newStreak));
    setLastCorrect(correct);
    setPhase('result');
  };

  const next = () => {
    const nextIdx = qIndex + 1;
    if (nextIdx >= questions.length) { setPhase('done'); return; }
    setQIndex(nextIdx);
    setLastCorrect(null);
    setPhase('playing');
  };

  const reset = () => {
    setQIndex(0); setScore(0); setTimeLeft(60); setPhase('playing');
    setLastCorrect(null); setStreak(0); setMaxStreak(0);
  };

  const current = questions[qIndex];
  const timerColor = timeLeft <= 10 ? '#dc2626' : timeLeft <= 25 ? '#d97706' : '#7c3aed';

  return (
    <div className="container-cute" style={{ maxWidth: '520px' }}>
      <div className="card-cute" style={{ background: '#faf5ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <span className="badge-cute">Fast Facts ⚡</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: timerColor, fontWeight: 700 }}>
            ⏱ {timeLeft}s
          </div>
        </div>

        {/* Score & progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontSize: '0.82rem' }}>
          <span style={{ color: '#7c3aed', fontWeight: 700 }}>Score: {score}</span>
          <span style={{ color: streak >= 3 ? '#f59e0b' : '#6b7280' }}>{streak >= 3 ? `🔥 x${streak} Streak!` : `Q ${qIndex + 1}/${questions.length}`}</span>
        </div>
        <div style={{ height: '6px', background: '#ede9fe', borderRadius: '99px', overflow: 'hidden', marginBottom: '1.5rem' }}>
          <div style={{ height: '100%', width: `${(timeLeft / 60) * 100}%`, background: `linear-gradient(to right, ${timerColor}, #a78bfa)`, borderRadius: '99px', transition: 'width 1s linear' }} />
        </div>

        {phase === 'done' ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <Award size={60} color="#7c3aed" style={{ margin: '0 auto 1rem', animation: 'float 3s ease infinite' }} />
            <h2 className="font-cute" style={{ fontSize: '2rem', color: '#4c1d95', marginBottom: '0.5rem' }}>Time's Up! ⏱</h2>
            <div style={{ fontSize: '1.1rem', color: '#374151', marginBottom: '0.5rem' }}>Final Score: <strong style={{ color: '#7c3aed', fontSize: '1.5rem' }}>{score}</strong></div>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '2rem' }}>Max Streak: 🔥 x{maxStreak}</div>
            <button onClick={reset} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', marginRight: '0.5rem' }}>
              <RotateCcw size={14} /> Play Again
            </button>
            <button onClick={onBack} className="btn-cute btn-cute-secondary">Back</button>
          </div>
        ) : phase === 'result' ? (
          <div style={{ textAlign: 'center', animation: 'pop-in 0.3s ease' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.8rem' }}>{lastCorrect ? '✅' : '❌'}</div>
            <div className="font-cute" style={{ fontSize: '1.2rem', color: lastCorrect ? '#047857' : '#b91c1c', marginBottom: '0.8rem' }}>
              {lastCorrect ? `Correct! +${10 + (streak >= 3 ? 5 : 0)} pts${streak >= 3 ? ' 🔥 Streak Bonus!' : ''}` : 'Wrong!'}
            </div>
            <div style={{ background: '#fff', border: '1px solid #ede9fe', borderRadius: '14px', padding: '1rem', marginBottom: '1.2rem', fontSize: '0.9rem', color: '#374151', lineHeight: 1.5 }}>
              <strong style={{ color: '#4c1d95' }}>Answer: {current.answer ? 'TRUE ✅' : 'FALSE ❌'}</strong><br />
              {current.explanation}
            </div>
            <button onClick={next} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' }}>
              <Zap size={14} /> Next Fact!
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#fff', border: '1px solid #ede9fe', borderRadius: '20px', padding: '2rem 1.5rem', marginBottom: '2rem', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <h3 className="font-cute" style={{ color: '#4c1d95', fontSize: '1.25rem', margin: 0, lineHeight: 1.5 }}>
                {current.statement}
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => handleAnswer(true)} className="btn-cute btn-cute-primary"
                style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg,#059669,#10b981)', fontSize: '1.1rem', padding: '1rem' }}>
                ✅ TRUE
              </button>
              <button onClick={() => handleAnswer(false)} className="btn-cute btn-cute-primary"
                style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg,#dc2626,#ef4444)', fontSize: '1.1rem', padding: '1rem' }}>
                ❌ FALSE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
