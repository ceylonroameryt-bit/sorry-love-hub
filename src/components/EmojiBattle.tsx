import React, { useState, useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, Award, Heart, Check, X, Clock } from 'lucide-react';

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

interface BattleState {
  phase: 'playing' | 'round_end' | 'ended';
  round: number;
  riddleIndex: number;
  hostChoice: string | null;
  guestChoice: string | null;
  hostScore: number;
  guestScore: number;
}

const INITIAL: BattleState = {
  phase: 'playing',
  round: 1,
  riddleIndex: 0,
  hostChoice: null,
  guestChoice: null,
  hostScore: 0,
  guestScore: 0
};

export const EmojiBattle: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName } = useGamePeer();
  const state: BattleState = gameState ?? INITIAL;

  const [timeLeft, setTimeLeft] = useState(10);
  const timerRef = useRef<number | null>(null);

  const currentRiddle = RIDDLES[state.riddleIndex] || RIDDLES[0];
  const myChoice = role === 'host' ? state.hostChoice : state.guestChoice;
  const theirChoice = role === 'host' ? state.guestChoice : state.hostChoice;

  const selectAnswer = (ans: string) => {
    if (myChoice !== null || state.phase !== 'playing') return;

    const nextState = { ...state };
    if (role === 'host') nextState.hostChoice = ans;
    else nextState.guestChoice = ans;

    // Check if both have answered
    if (nextState.hostChoice && nextState.guestChoice) {
      resolveRound(nextState);
    } else {
      sendGameAction(nextState);
    }
  };

  const resolveRound = (currentState: BattleState) => {
    const nextState = { ...currentState };
    nextState.phase = 'round_end';

    // Award scores
    if (nextState.hostChoice === currentRiddle.answer) {
      nextState.hostScore += 1;
    }
    if (nextState.guestChoice === currentRiddle.answer) {
      nextState.guestScore += 1;
    }

    sendGameAction(nextState);
  };

  const nextRiddle = () => {
    const nextIdx = state.riddleIndex + 1;
    if (nextIdx >= RIDDLES.length) {
      sendGameAction({
        ...state,
        phase: 'ended'
      });
    } else {
      sendGameAction({
        ...state,
        phase: 'playing',
        round: state.round + 1,
        riddleIndex: nextIdx,
        hostChoice: null,
        guestChoice: null
      });
      setTimeLeft(10);
    }
  };

  // Timer logic
  useEffect(() => {
    if (state.phase !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          
          // Force end round
          const nextState = { ...state };
          if (!nextState.hostChoice) nextState.hostChoice = 'timeout';
          if (!nextState.guestChoice) nextState.guestChoice = 'timeout';
          resolveRound(nextState);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.phase, state.riddleIndex]);

  const resetAll = () => {
    sendGameAction({ ...INITIAL });
    setTimeLeft(10);
  };

  const iWon = (role === 'host' && state.hostScore > state.guestScore) || (role === 'guest' && state.guestScore > state.hostScore);
  const correctOption = currentRiddle.answer;

  return (
    <div className="container-cute" style={{ maxWidth: '700px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Emoji Battle 🎴</span>
          <span style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 700 }}>Riddle {state.round}</span>
        </div>

        {/* Score Board */}
        <div style={{
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          background: '#fff', borderRadius: '14px', padding: '0.8rem 1rem',
          border: '1px solid #ede9fe', marginBottom: '1.5rem',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Your Wins 🏆</div>
            <div className="font-cute" style={{ fontSize: '1.6rem', color: '#7c3aed' }}>
              {role === 'host' ? state.hostScore : state.guestScore}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f5f3ff', padding: '0.4rem 1.1rem', borderRadius: '50px', border: '1px solid #ddd6fe' }}>
            <Clock size={14} color="#7c3aed" />
            <span className="font-cute" style={{ fontSize: '0.9rem', color: '#7c3aed' }}>{timeLeft}s</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{opponentName}'s Wins</div>
            <div className="font-cute" style={{ fontSize: '1.6rem', color: '#8b5cf6' }}>
              {role === 'guest' ? state.hostScore : state.guestScore}
            </div>
          </div>
        </div>

        {/* PLAYING PHASE */}
        {state.phase === 'playing' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4.5rem', margin: '1rem 0', animation: 'float 3s ease infinite' }}>
              {currentRiddle.emojis}
            </div>
            <h2 className="heading-lg" style={{ fontSize: '1.3rem', color: '#4c1d95', marginBottom: '1.5rem' }}>
              {currentRiddle.question}
            </h2>

            {myChoice === null ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', maxWidth: '520px', margin: '0 auto' }}>
                {currentRiddle.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => selectAnswer(opt)}
                    className="btn-cute btn-cute-secondary"
                    style={{
                      padding: '1rem 1.2rem',
                      fontSize: '1rem',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: '#4c1d95',
                      border: '2px solid #ddd6fe',
                      background: '#fff',
                      boxShadow: '0 2px 8px rgba(124,58,237,0.08)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ animation: 'pop-in 0.3s ease', padding: '1rem 0' }}>
                <div className="font-cute" style={{ fontSize: '1.2rem', color: '#7c3aed', marginBottom: '0.5rem' }}>
                  You locked in: "{myChoice}"
                </div>
                <p style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  Waiting for {opponentName || 'partner'}...
                  <Heart size={15} fill="#7c3aed" color="#7c3aed" style={{ animation: 'pulse-gentle 1s infinite' }} />
                </p>
              </div>
            )}
          </div>
        )}

        {/* ROUND END REVEAL */}
        {state.phase === 'round_end' && (
          <div style={{ textAlign: 'center', animation: 'pop-in 0.4s ease' }}>
            <div style={{ fontSize: '4.5rem', margin: '0.5rem 0' }}>
              {currentRiddle.emojis}
            </div>

            <div style={{ background: '#ecfdf5', border: '2px solid #a7f3d0', borderRadius: '18px', padding: '1rem', maxWidth: '360px', margin: '0 auto 1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 700 }}>CORRECT ANSWER</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#065f46', marginTop: '0.2rem' }}>
                {correctOption}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{
                background: myChoice === correctOption ? '#ecfdf5' : '#fef2f2',
                border: `1.5px solid ${myChoice === correctOption ? '#a7f3d0' : '#fecaca'}`,
                borderRadius: '18px', padding: '1rem'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 700 }}>Your Answer</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: myChoice === correctOption ? '#047857' : '#b91c1c', marginTop: '0.3rem' }}>
                  {myChoice === 'timeout' ? '⏰ Timeout' : myChoice}
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  {myChoice === correctOption ? <Check color="#10b981" size={24} style={{ margin: '0 auto' }} /> : <X color="#dc2626" size={24} style={{ margin: '0 auto' }} />}
                </div>
              </div>

              <div style={{
                background: theirChoice === correctOption ? '#ecfdf5' : '#fef2f2',
                border: `1.5px solid ${theirChoice === correctOption ? '#a7f3d0' : '#fecaca'}`,
                borderRadius: '18px', padding: '1rem'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 700 }}>{opponentName}'s Answer</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: theirChoice === correctOption ? '#047857' : '#b91c1c', marginTop: '0.3rem' }}>
                  {theirChoice === 'timeout' ? '⏰ Timeout' : theirChoice}
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  {theirChoice === correctOption ? <Check color="#10b981" size={24} style={{ margin: '0 auto' }} /> : <X color="#dc2626" size={24} style={{ margin: '0 auto' }} />}
                </div>
              </div>
            </div>

            {role === 'host' ? (
              <button onClick={nextRiddle} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', padding: '0.8rem 2rem' }}>
                Next Riddle ➡️
              </button>
            ) : (
              <p style={{ color: '#8b5cf6', fontSize: '0.9rem' }}>
                Waiting for host to load next riddle...
              </p>
            )}
          </div>
        )}

        {/* GAME ENDED */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '2rem 0', animation: 'pop-in 0.4s ease' }}>
            <Award size={60} color="#7c3aed" style={{ animation: 'float 3s ease infinite', margin: '0 auto 1rem' }} />
            <h2 className="font-cute" style={{ fontSize: '2.2rem', color: '#4c1d95', margin: '0 0 0.5rem' }}>Battle Over! 🏁</h2>

            <div style={{ fontSize: '1.2rem', color: '#374151', marginBottom: '2rem' }}>
              {state.hostScore === state.guestScore ? (
                <span><strong>It's a perfect tie!</strong> 🤝</span>
              ) : iWon ? (
                <span><strong>You won the battle! 👑</strong></span>
              ) : (
                <span><strong>{opponentName || 'Partner'} won the battle! 👑</strong></span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={resetAll} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' }}>
                Play Again
              </button>
              <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary">
                Back to Lobby
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
