import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, Award } from 'lucide-react';

interface TriviaQuestion {
  question: string;
  options: string[];
  answer: string;
}

const ALL_QUESTIONS: TriviaQuestion[] = [
  { question: "Which planet is known as the Red Planet? 🪐", options: ["Mars", "Venus", "Jupiter", "Saturn"], answer: "Mars" },
  { question: "What is the shape of a standard stop sign? 🛑", options: ["Octagon", "Hexagon", "Pentagon", "Triangle"], answer: "Octagon" },
  { question: "Which animal is known as the King of the Jungle? 🦁", options: ["Lion", "Tiger", "Elephant", "Leopard"], answer: "Lion" },
  { question: "What is the capital city of France? 🇫🇷", options: ["Paris", "Lyon", "Marseille", "Nice"], answer: "Paris" },
  { question: "How many bones are in an adult human body? 🦴", options: ["206", "300", "150", "212"], answer: "206" },
  { question: "Which is the largest ocean on Earth? 🌊", options: ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"], answer: "Pacific Ocean" },
  { question: "What fruit did Isaac Newton supposedly observe falling? 🍎", options: ["Apple", "Orange", "Peach", "Pear"], answer: "Apple" },
  { question: "What is the hardest natural substance on Earth? 💎", options: ["Diamond", "Gold", "Iron", "Platinum"], answer: "Diamond" },
  { question: "Which country is home to the Kangaroo? 🦘", options: ["Australia", "South Africa", "New Zealand", "Kenya"], answer: "Australia" },
  { question: "What is the boiling point of water in Celsius? 🌡️", options: ["100°C", "0°C", "50°C", "212°C"], answer: "100°C" },
  { question: "How many sides does a hexagon have? 🔷", options: ["5", "6", "7", "8"], answer: "6" },
  { question: "Which country invented pizza? 🍕", options: ["France", "Spain", "Greece", "Italy"], answer: "Italy" },
  { question: "What is the chemical symbol for gold? 🥇", options: ["Go", "Gd", "Au", "Ag"], answer: "Au" },
  { question: "How many planets are in our solar system? 🪐", options: ["7", "8", "9", "10"], answer: "8" },
  { question: "Who wrote Romeo and Juliet? 📖", options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"], answer: "William Shakespeare" },
  { question: "What is the largest land animal? 🐘", options: ["African Elephant", "Blue Whale", "Giraffe", "Hippopotamus"], answer: "African Elephant" },
  { question: "How many legs does a spider have? 🕷️", options: ["6", "8", "10", "12"], answer: "8" },
  { question: "What gas do plants breathe in? 🌿", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], answer: "Carbon Dioxide" },
  { question: "Which sport uses a shuttlecock? 🏸", options: ["Tennis", "Badminton", "Squash", "Table Tennis"], answer: "Badminton" },
  { question: "How many strings does a standard guitar have? 🎸", options: ["4", "5", "6", "7"], answer: "6" },
  { question: "What is the longest river in the world? 🌍", options: ["Amazon", "Nile", "Yangtze", "Mississippi"], answer: "Nile" },
  { question: "Which animal is the fastest on land? 🐆", options: ["Lion", "Horse", "Cheetah", "Gazelle"], answer: "Cheetah" },
  { question: "In what year did World War II end? 🕊️", options: ["1943", "1944", "1945", "1946"], answer: "1945" },
  { question: "Which country is home to the Great Wall? 🏯", options: ["Japan", "India", "China", "Korea"], answer: "China" },
  { question: "What is the capital of Japan? 🗾", options: ["Osaka", "Tokyo", "Kyoto", "Hiroshima"], answer: "Tokyo" },
  { question: "How many chambers does the human heart have? ❤️", options: ["2", "3", "4", "5"], answer: "4" },
  { question: "Which planet is closest to the Sun? ☀️", options: ["Venus", "Mercury", "Mars", "Earth"], answer: "Mercury" },
  { question: "What is 8 × 7? 🔢", options: ["54", "56", "58", "64"], answer: "56" },
  { question: "How many continents are there on Earth? 🌍", options: ["5", "6", "7", "8"], answer: "7" },
  { question: "What is the main ingredient in guacamole? 🥑", options: ["Tomato", "Avocado", "Lime", "Pepper"], answer: "Avocado" },
];

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

interface Props { onBack: () => void; }

export const OfflineTriviaQuiz: React.FC<Props> = ({ onBack }) => {
  const [questions] = useState(() => shuffled(ALL_QUESTIONS));
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const currentQ = questions[qIndex];

  const selectOption = (opt: string) => {
    if (selected !== null) return;
    setSelected(opt);
    if (opt === currentQ.answer) setScore(s => s + 1);
  };

  const nextQuestion = () => {
    setSelected(null);
    const nextIdx = qIndex + 1;
    if (nextIdx >= questions.length) { setDone(true); } else { setQIndex(nextIdx); }
  };

  const resetAll = () => { setQIndex(0); setScore(0); setSelected(null); setDone(false); };

  const pct = Math.round((score / questions.length) * 100);

  return (
    <div className="container-cute" style={{ maxWidth: '500px' }}>
      <div className="card-cute" style={{ background: '#faf5ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <span className="badge-cute">Trivia Quiz 🧠</span>
          {!done && <span style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 700 }}>Q: {qIndex + 1}/{questions.length}</span>}
          {done && <button onClick={resetAll} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}><RotateCcw size={14} /></button>}
        </div>

        {/* Progress bar */}
        {!done && (
          <div style={{ height: '6px', background: '#ede9fe', borderRadius: '99px', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <div style={{ height: '100%', width: `${(qIndex / questions.length) * 100}%`, background: 'linear-gradient(to right, #7c3aed, #a78bfa)', borderRadius: '99px', transition: 'width 0.3s' }} />
          </div>
        )}

        {!done ? (
          <div>
            <div style={{ background: '#fff', border: '1px solid #ede9fe', borderRadius: '16px', padding: '1.5rem 1.2rem', boxShadow: '0 4px 10px rgba(0,0,0,0.01)', marginBottom: '1.5rem', textAlign: 'center' }}>
              <h3 className="font-cute" style={{ color: '#4c1d95', fontSize: '1.25rem', margin: 0, lineHeight: 1.4 }}>
                {currentQ.question}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
              {currentQ.options.map((opt, i) => {
                let borderCol = '#ede9fe';
                let bgCol = '#fff';
                let textCol = '#4c1d95';
                if (selected !== null) {
                  if (opt === currentQ.answer) { borderCol = '#10b981'; bgCol = '#ecfdf5'; textCol = '#047857'; }
                  else if (opt === selected) { borderCol = '#dc2626'; bgCol = '#fef2f2'; textCol = '#b91c1c'; }
                  else { bgCol = '#f9fafb'; textCol = '#9ca3af'; }
                }
                return (
                  <button key={i} onClick={() => selectOption(opt)} disabled={selected !== null}
                    style={{ padding: '0.85rem 1.2rem', borderRadius: '14px', border: `2px solid ${borderCol}`, background: bgCol, color: textCol, fontWeight: 700, fontSize: '0.95rem', textAlign: 'left', cursor: selected !== null ? 'default' : 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}>
                    {opt}
                  </button>
                );
              })}
            </div>

            {selected !== null && (
              <button onClick={nextQuestion} className="btn-cute btn-cute-primary" style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', animation: 'pop-in 0.2s ease' }}>
                {qIndex + 1 >= questions.length ? 'See Results 🏆' : 'Next Question ➡️'}
              </button>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <Award size={60} color="#7c3aed" style={{ margin: '0 auto 1rem', animation: 'float 3s ease infinite' }} />
            <h2 className="font-cute" style={{ fontSize: '2rem', color: '#4c1d95', margin: '0 0 0.5rem' }}>Quiz Complete! 🧠</h2>
            <div style={{ fontSize: '1.1rem', color: '#374151', marginBottom: '0.5rem' }}>
              You scored <strong style={{ color: '#7c3aed', fontSize: '1.6rem' }}>{score}</strong> / {questions.length}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '2rem' }}>
              {pct >= 90 ? '🌟 Genius level! Amazing!' : pct >= 70 ? '🎉 Great job! Very impressive!' : pct >= 50 ? '👍 Not bad! Keep learning!' : '📚 Keep practising — you\'ll get there!'}
            </div>
            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
              <button onClick={resetAll} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' }}>
                <RotateCcw size={14} /> Play Again
              </button>
              <button onClick={onBack} className="btn-cute btn-cute-secondary">Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
