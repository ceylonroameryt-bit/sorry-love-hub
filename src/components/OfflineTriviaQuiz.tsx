import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, Award } from 'lucide-react';

interface TriviaQuestion {
  question: string;
  options: string[];
  answer: string;
}

const QUESTIONS: TriviaQuestion[] = [
  { question: "Which planet is known as the Red Planet? 🪐", options: ["Mars", "Venus", "Jupiter", "Saturn"], answer: "Mars" },
  { question: "What is the shape of a standard stop sign? 🛑", options: ["Octagon", "Hexagon", "Pentagon", "Triangle"], answer: "Octagon" },
  { question: "Which animal is known as the King of the Jungle? 🦁", options: ["Lion", "Tiger", "Elephant", "Leopard"], answer: "Lion" },
  { question: "What is the capital city of France? 🇫🇷", options: ["Paris", "Lyon", "Marseille", "Nice"], answer: "Paris" },
  { question: "How many bones are there in an adult human body? 🦴", options: ["206", "300", "150", "212"], answer: "206" },
  { question: "Which is the largest ocean on Earth? 🌊", options: ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"], answer: "Pacific Ocean" },
  { question: "What fruit did Isaac Newton supposedly observe falling? 🍎", options: ["Apple", "Orange", "Peach", "Pear"], answer: "Apple" },
  { question: "What is the hardest natural substance on Earth? 💎", options: ["Diamond", "Gold", "Iron", "Platinum"], answer: "Diamond" },
  { question: "Which country is home to the Kangaroo? 🦘", options: ["Australia", "South Africa", "New Zealand", "Kenya"], answer: "Australia" },
  { question: "What is the boiling point of water in Celsius? 🌡️", options: ["100°C", "0°C", "50°C", "212°C"], answer: "100°C" },
];

interface Props { onBack: () => void; }

export const OfflineTriviaQuiz: React.FC<Props> = ({ onBack }) => {
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const currentQ = QUESTIONS[qIndex];

  const selectOption = (opt: string) => {
    if (selected !== null) return;
    setSelected(opt);
    if (opt === currentQ.answer) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    setSelected(null);
    const nextIdx = qIndex + 1;
    if (nextIdx >= QUESTIONS.length) {
      setDone(true);
    } else {
      setQIndex(nextIdx);
    }
  };

  const resetAll = () => {
    setQIndex(0);
    setScore(0);
    setSelected(null);
    setDone(false);
  };

  return (
    <div className="container-cute" style={{ maxWidth: '500px' }}>
      <div className="card-cute" style={{ background: '#faf5ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <span className="badge-cute">Trivia Quiz 🧠</span>
          <span style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 700 }}>Q: {qIndex + 1}/{QUESTIONS.length}</span>
        </div>

        {!done ? (
          <div>
            <div style={{
              background: '#fff',
              border: '1px solid #ede9fe',
              borderRadius: '16px',
              padding: '1.5rem 1.2rem',
              boxShadow: '0 4px 10px rgba(0,0,0,0.01)',
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}>
              <h3 className="font-cute" style={{ color: '#4c1d95', fontSize: '1.3rem', margin: 0, lineHeight: 1.4 }}>
                {currentQ.question}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
              {currentQ.options.map((opt, i) => {
                let borderCol = '#ede9fe';
                let bgCol = '#fff';
                let textCol = '#4c1d95';

                if (selected !== null) {
                  if (opt === currentQ.answer) {
                    borderCol = '#10b981';
                    bgCol = '#ecfdf5';
                    textCol = '#047857';
                  } else if (opt === selected) {
                    borderCol = '#dc2626';
                    bgCol = '#fef2f2';
                    textCol = '#b91c1c';
                  } else {
                    bgCol = '#f9fafb';
                    borderCol = '#e5e7eb';
                    textCol = '#9ca3af';
                  }
                }

                return (
                  <button
                    key={i}
                    disabled={selected !== null}
                    onClick={() => selectOption(opt)}
                    className="btn-cute"
                    style={{
                      textAlign: 'left',
                      padding: '0.9rem 1.2rem',
                      borderRadius: '12px',
                      border: `2px solid ${borderCol}`,
                      background: bgCol,
                      color: textCol,
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      justifyContent: 'flex-start',
                      width: '100%',
                      cursor: selected === null ? 'pointer' : 'default',
                      transform: 'none',
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {selected !== null && (
              <button onClick={nextQuestion} className="btn-cute btn-cute-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {qIndex + 1 === QUESTIONS.length ? "Finish Quiz 🏁" : "Next Question ➡️"}
              </button>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem 0', animation: 'pop-in 0.4s ease' }}>
            <Award size={56} color="#7c3aed" style={{ animation: 'float 3s ease infinite', margin: '0 auto 1rem' }} />
            <h2 className="font-cute" style={{ color: '#7c3aed', fontSize: '2rem', margin: '0 0 0.5rem' }}>Quiz Finished!</h2>
            <p style={{ color: '#6b7280', fontSize: '1rem', marginBottom: '1.5rem' }}>
              You scored <strong style={{ color: '#7c3aed', fontSize: '1.4rem' }}>{score}</strong> out of <strong style={{ fontSize: '1.2rem' }}>{QUESTIONS.length}</strong>!
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={resetAll} className="btn-cute btn-cute-primary">
                <RotateCcw size={14} /> Retake Quiz
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
