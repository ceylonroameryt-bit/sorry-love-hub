import React, { useState, useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw, Clock } from 'lucide-react';
import { GameHeader } from './GameHeader';

interface Riddle {
  emojis: string;
  question: string;
  options: string[];
  answer: string;
}

const RIDDLES: Riddle[] = [
  { emojis: '🐱+🍼', question: 'What is this?', options: ['Kitten milk', 'Cat bottle', 'Milky paw', 'Baby tiger'], answer: 'Kitten milk' },
  { emojis: '🍕+🌙', question: 'What does this mean?', options: ['Daytime snack', 'Midnight pizza', 'Cheese moon', 'Sleepy chef'], answer: 'Midnight pizza' },
  { emojis: '🍿+🎬', question: 'Where are we?', options: ['Watching TV', 'Movie theater', 'Soda factory', 'Popcorn party'], answer: 'Movie theater' },
  { emojis: '🌧️+🌈', question: 'What comes after?', options: ['Rainbow in rain', 'Sunny day', 'Thunderstorm', 'Muddy puddle'], answer: 'Rainbow in rain' },
  { emojis: '🐈+📦', question: 'Classic cat behavior:', options: ['Box trap', 'Cat delivery', 'If it fits I sits', 'Lazy packing'], answer: 'If it fits I sits' },
  { emojis: '🍩+☕', question: 'A perfect breakfast:', options: ['Bagel coffee', 'Sweet morning', 'Coffee and Donut', 'Glazed run'], answer: 'Coffee and Donut' },
  { emojis: '✈️+🏖️', question: 'What is this plan?', options: ['Business trip', 'Flying sand', 'Beach holiday', 'Island runway'], answer: 'Beach holiday' },
  { emojis: '🚀+🌕', question: 'Where is it going?', options: ['Star flight', 'Moon landing', 'Planet cruise', 'Comet tail'], answer: 'Moon landing' },
  { emojis: '🧸+💤', question: 'Time for:', options: ['Teddy nap', 'Sleepy bear', 'Soft hug', 'Pillow fight'], answer: 'Teddy nap' },
  { emojis: '🍔+🍟+🥤', question: 'Name the combo:', options: ['Fancy lunch', 'Happy meal', 'Fast food feast', 'Picnic pack'], answer: 'Fast food feast' },
  { emojis: '🍓+🍦', question: 'Yummy dessert:', options: ['Strawberry sundae', 'Fruit cone', 'Berry scoop', 'Pink dream'], answer: 'Strawberry sundae' },
  { emojis: '🎈+🎂+🥳', question: 'What is happening?', options: ['Surprise party', 'Birthday bash', 'Cake baking', 'Balloon pop'], answer: 'Birthday bash' },
  { emojis: '📚+🤓', question: 'Who is this?', options: ['Smart boy', 'Bookworm', 'Exam stress', 'Library guard'], answer: 'Bookworm' },
  { emojis: '🐶+🦴', question: 'Happy pet:', options: ['Dog with bone', 'Crunchy toy', 'Burying bones', 'Puppy treats'], answer: 'Dog with bone' },
  { emojis: '🏰+👑', question: 'Fairytale setting:', options: ['Princess tower', 'Royal castle', 'Knight guard', 'Golden throne'], answer: 'Royal castle' },
  { emojis: '💃+🕺+🎵', question: 'What are we doing?', options: ['Dance party', 'Karaoke club', 'Singing duet', 'Tango night'], answer: 'Dance party' },
  { emojis: '💍+💒', question: 'Huge milestone:', options: ['Royal church', 'Proposal ring', 'Wedding day', 'Love bells'], answer: 'Wedding day' },
  { emojis: '🌹+🕯️', question: 'Dinner vibe:', options: ['Romantic dinner', 'Flower light', 'Rose bath', 'Cosy room'], answer: 'Romantic dinner' },
  { emojis: '🍵+🌸', question: 'Soothing drink:', options: ['Herbal water', 'Cherry blossom tea', 'Green petals', 'Warm garden'], answer: 'Cherry blossom tea' },
  { emojis: '🎨+🖌️', question: 'Creative hobby:', options: ['Wall painting', 'Art session', 'Colour splash', 'Brush wash'], answer: 'Art session' }
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface BattleState {
  phase: 'playing' | 'round_end' | 'ended';
  round: number;
  riddleIndex: number;
  riddleOrder: number[];
  hostChoice: string | null;
  guestChoice: string | null;
  hostScore: number;
  guestScore: number;
}

const TOTAL_ROUNDS = 10;

function makeInitial(): BattleState {
  const order = shuffle(RIDDLES.map((_, i) => i));
  return {
    phase: 'playing',
    round: 1,
    riddleIndex: 0,
    riddleOrder: order.slice(0, TOTAL_ROUNDS),
    hostChoice: null,
    guestChoice: null,
    hostScore: 0,
    guestScore: 0
  };
}

export const EmojiBattle: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization for fresh shuffled riddles
  useEffect(() => {
    if (role === 'host' && (!gameState || !gameState.riddleOrder)) {
      sendGameAction(makeInitial());
    }
  }, [role, gameState, sendGameAction]);

  const state: BattleState = gameState ?? makeInitial();

  const [timeLeft, setTimeLeft] = useState(10);
  const timerRef = useRef<number | null>(null);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const riddleOrder = state.riddleOrder ?? RIDDLES.map((_, i) => i).slice(0, TOTAL_ROUNDS);
  const currentRiddleIdx = riddleOrder[state.riddleIndex % riddleOrder.length] ?? 0;
  const currentRiddle = RIDDLES[currentRiddleIdx];

  const myChoice = role === 'host' ? state.hostChoice : state.guestChoice;
  const theirChoice = role === 'host' ? state.guestChoice : state.hostChoice;

  // Timer logic
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (state.phase !== 'playing') return;
    setTimeLeft(10);

    timerRef.current = window.setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          if (role === 'host') {
            const ns = { ...stateRef.current };
            if (!ns.hostChoice) ns.hostChoice = 'timeout';
            if (!ns.guestChoice) ns.guestChoice = 'timeout';
            ns.phase = 'round_end';
            if (ns.hostChoice === currentRiddle.answer) ns.hostScore += 1;
            if (ns.guestChoice === currentRiddle.answer) ns.guestScore += 1;
            sendGameAction(ns);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.phase, state.riddleIndex, role, currentRiddle, sendGameAction]);

  const selectAnswer = (ans: string) => {
    if (myChoice !== null || state.phase !== 'playing') return;
    const ns = { ...state };
    if (role === 'host') ns.hostChoice = ans;
    else ns.guestChoice = ans;

    if (ns.hostChoice && ns.guestChoice) {
      ns.phase = 'round_end';
      if (ns.hostChoice === currentRiddle.answer) ns.hostScore += 1;
      if (ns.guestChoice === currentRiddle.answer) ns.guestScore += 1;
    }
    sendGameAction(ns);
  };

  const nextRound = () => {
    if (role !== 'host') return;
    if (state.round >= TOTAL_ROUNDS) {
      sendGameAction({ ...state, phase: 'ended' });
      return;
    }
    sendGameAction({
      ...state,
      phase: 'playing',
      round: state.round + 1,
      riddleIndex: state.riddleIndex + 1,
      hostChoice: null,
      guestChoice: null
    });
  };

  const resetAll = () => sendGameAction(makeInitial());
  const iWon = (role === 'host' && state.hostScore > state.guestScore) || (role === 'guest' && state.guestScore > state.hostScore);

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Emoji Battle"
        emoji="🎴"
        instructions={[
          "Solve 10 cute emoji riddles together!",
          "Pick your answer before the 10-second countdown runs out.",
          "Score 1 point for every correct answer. Highest score wins!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            Riddle {state.round} of {TOTAL_ROUNDS}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>Host: {state.hostScore}</span>
            <span style={{ color: '#ec4899' }}>Guest: {state.guestScore}</span>
          </div>
        </div>

        {/* Ended Phase */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>
              {state.hostScore === state.guestScore ? '🤝' : iWon ? '🏆' : '💔'}
            </div>
            <h2 className="heading-lg" style={{ color: '#ca8a04', marginBottom: '0.5rem' }}>
              {state.hostScore === state.guestScore ? "It's a Tie!" : iWon ? 'You Win!' : `${opponentName || 'Partner'} Wins!`}
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              Final Score: {state.hostScore} - {state.guestScore}
            </p>
            {role === 'host' && (
              <button onClick={resetAll} className="btn-cute btn-cute-primary" style={{ padding: '0.7rem 1.8rem', background: '#ca8a04', borderColor: '#ca8a04' }}>
                <RefreshCw size={18} /> Play Again
              </button>
            )}
          </div>
        )}

        {/* Playing or Round End Phase */}
        {state.phase !== 'ended' && (
          <div>
            {/* Timer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '1.2rem', color: timeLeft <= 3 ? '#dc2626' : '#ca8a04', fontWeight: 700 }}>
              <Clock size={16} />
              <span>{state.phase === 'playing' ? `${timeLeft}s left` : 'Round Over!'}</span>
            </div>

            {/* Emoji Card */}
            <div style={{
              background: '#ffffff',
              border: '2px solid #ca8a04',
              borderRadius: '20px',
              padding: '1.5rem 1rem',
              textAlign: 'center',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 14px rgba(202,138,4,0.08)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{currentRiddle.emojis}</div>
              <p style={{ fontSize: '1.1rem', color: '#1e1b4b', fontWeight: 700, margin: 0, fontFamily: 'var(--font-cute)' }}>
                {currentRiddle.question}
              </p>
            </div>

            {/* Options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.5rem' }}>
              {currentRiddle.options.map((opt, idx) => {
                const isSelected = myChoice === opt;
                let bg = '#ffffff';
                let border = '#e9d5ff';
                let textColor = '#1e1b4b';

                if (state.phase === 'round_end') {
                  if (opt === currentRiddle.answer) {
                    bg = '#dcfce7'; border = '#22c55e'; textColor = '#15803d';
                  } else if (isSelected && opt !== currentRiddle.answer) {
                    bg = '#fee2e2'; border = '#ef4444'; textColor = '#b91c1c';
                  }
                } else if (isSelected) {
                  bg = '#fef9c3'; border = '#ca8a04'; textColor = '#a16207';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => selectAnswer(opt)}
                    disabled={myChoice !== null || state.phase !== 'playing'}
                    style={{
                      background: bg,
                      border: `2px solid ${border}`,
                      color: textColor,
                      borderRadius: '14px',
                      padding: '0.85rem 0.6rem',
                      fontFamily: 'var(--font-cute)',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: myChoice === null && state.phase === 'playing' ? 'pointer' : 'default',
                      transition: 'all 0.15s ease',
                      textAlign: 'center'
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Status */}
            <div style={{ textAlign: 'center', minHeight: '40px' }}>
              {state.phase === 'playing' && (
                <div style={{ color: myChoice ? '#059669' : '#6b7280', fontSize: '0.9rem', fontWeight: 600 }}>
                  {myChoice
                    ? (theirChoice ? 'Both answered! Resolving...' : `Waiting for ${opponentName || 'partner'}... ⏳`)
                    : 'Tap an option to guess!'}
                </div>
              )}

              {state.phase === 'round_end' && (
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#4c1d95', marginBottom: '0.5rem' }}>
                    Correct Answer: <span style={{ color: '#15803d' }}>{currentRiddle.answer}</span>
                  </div>
                  {role === 'host' && (
                    <button onClick={nextRound} className="btn-cute btn-cute-primary" style={{ padding: '0.5rem 1.4rem', background: '#ca8a04', borderColor: '#ca8a04' }}>
                      Next Riddle ➔
                    </button>
                  )}
                  {role === 'guest' && (
                    <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Waiting for host to continue...</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
