import React from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw, Award, Heart, Check, X } from 'lucide-react';

interface Question {
  optionA: string;
  optionB: string;
}

const ALL_QUESTIONS: Question[] = [
  { optionA: "Live in a cozy cabin in the snowy mountains 🏔️", optionB: "Live in a sunny beach cottage 🏖️" },
  { optionA: "Have unlimited free pizzas forever 🍕", optionB: "Have unlimited free sushi & mochi 🍣" },
  { optionA: "Be able to fly anywhere ✈️", optionB: "Be able to teleport anywhere 🌀" },
  { optionA: "Go on a road trip across the country 🚗", optionB: "Go on a luxury cruise across the ocean 🚢" },
  { optionA: "Have a cute pet panda 🐼", optionB: "Have a cute pet koala 🐨" },
  { optionA: "Only watch movies/shows 🎬", optionB: "Only listen to music 🎵" },
  { optionA: "Wake up early for sunrise 🌅", optionB: "Stay up late for the stars 🌙" },
  { optionA: "Always tell the truth 🤫", optionB: "Always know when someone is lying 🕵️" },
  { optionA: "Explore a futuristic space station 🚀", optionB: "Explore an ancient underwater castle 🏰" },
  { optionA: "Be 10 minutes early to everything ⏰", optionB: "Be 10 minutes late but look amazing 💅" },
  { optionA: "Live without your phone for a month 📵", optionB: "Live without the internet for a month 🌐" },
  { optionA: "Have the ability to speak every language 🗣️", optionB: "Have the ability to play every instrument 🎸" },
  { optionA: "Always eat your favourite food every day 🍜", optionB: "Travel the world and try new foods 🌍" },
  { optionA: "Be famous but unhappy 🌟", optionB: "Be unknown but very happy 😊" },
  { optionA: "Have a dog for life 🐶", optionB: "Have a cat for life 🐱" },
  { optionA: "Read minds for a day 🧠", optionB: "Be invisible for a day 👻" },
  { optionA: "Never be cold again ❄️", optionB: "Never be hot again 🔥" },
  { optionA: "Meet your idol once 🌟", optionB: "Go on your dream vacation 🌴" },
  { optionA: "Be a billionaire for a year 💰", optionB: "Be healthy forever 💚" },
  { optionA: "Live with no stress ever 😌", optionB: "Have 5 extra hours per day ⏳" },
  { optionA: "Have a cute tiny house all yours 🏡", optionB: "Have a massive mansion to share 🏰" },
  { optionA: "Always win every argument 🏅", optionB: "Always have the last laugh 😂" },
  { optionA: "See the future 🔮", optionB: "Change the past ⏪" },
  { optionA: "Work from home forever 🏠", optionB: "Work at an amazing office 🏢" },
  { optionA: "Eat sweets every meal 🍰", optionB: "Eat savoury every meal 🧀" },
];

interface WyrState {
  phase: 'voting' | 'reveal' | 'ended';
  round: number;
  questionIndex: number;
  questionOrder: number[];
  hostVote: 'A' | 'B' | null;
  guestVote: 'A' | 'B' | null;
  matches: number;
}

const TOTAL_ROUNDS = 10;

function makeInitial(): WyrState {
  const order = ALL_QUESTIONS.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    phase: 'voting',
    round: 1,
    questionIndex: 0,
    questionOrder: order.slice(0, TOTAL_ROUNDS),
    hostVote: null,
    guestVote: null,
    matches: 0,
  };
}

export const WouldYouRather: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName } = useGamePeer();
  const state: WyrState = gameState ?? makeInitial();

  const questionOrder = state.questionOrder ?? ALL_QUESTIONS.map((_, i) => i).slice(0, TOTAL_ROUNDS);
  const currentQ = ALL_QUESTIONS[questionOrder[state.questionIndex]] ?? ALL_QUESTIONS[0];
  const myVote = role === 'host' ? state.hostVote : state.guestVote;
  const theirVote = role === 'host' ? state.guestVote : state.hostVote;

  const handleVote = (vote: 'A' | 'B') => {
    if (myVote !== null || state.phase !== 'voting') return;
    const nextState = { ...state };
    if (role === 'host') nextState.hostVote = vote;
    else nextState.guestVote = vote;

    if (nextState.hostVote && nextState.guestVote) {
      nextState.phase = 'reveal';
      if (nextState.hostVote === nextState.guestVote) nextState.matches += 1;
    }
    sendGameAction(nextState);
  };

  const nextQuestion = () => {
    if (role !== 'host') return;
    const nextIdx = state.questionIndex + 1;
    if (nextIdx >= TOTAL_ROUNDS) {
      sendGameAction({ ...state, phase: 'ended' });
    } else {
      sendGameAction({
        ...state,
        phase: 'voting',
        round: state.round + 1,
        questionIndex: nextIdx,
        hostVote: null,
        guestVote: null,
      });
    }
  };

  const resetGame = () => { sendGameAction(makeInitial()); };

  const answeredRounds = state.round - (state.phase === 'voting' ? 1 : 0);
  const matchPct = answeredRounds > 0 ? Math.round((state.matches / answeredRounds) * 100) : 0;

  return (
    <div className="container-cute" style={{ maxWidth: '680px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Would You Rather 🤔</span>
          <button onClick={resetGame} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Match bar */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '0.8rem 1.2rem', border: '1px solid #ede9fe', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.82rem', color: '#6b7280', fontWeight: 600 }}>
            <span>Round {state.round}/{TOTAL_ROUNDS}</span>
            <span>Match Level: {matchPct}% ❤️</span>
          </div>
          <div style={{ height: '8px', background: '#f5f3ff', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${matchPct}%`, background: 'linear-gradient(to right, #a78bfa, #ec4899)', borderRadius: '99px', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* VOTING PHASE */}
        {state.phase === 'voting' && (
          <div style={{ textAlign: 'center' }}>
            <h3 className="font-cute" style={{ color: '#4c1d95', fontSize: '1.5rem', marginBottom: '1.5rem' }}>Would You Rather...</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '520px', margin: '0 auto 1.5rem' }}>
              {[
                { vote: 'A' as const, text: currentQ.optionA, color: '#7c3aed' },
                { vote: 'B' as const, text: currentQ.optionB, color: '#ec4899' },
              ].map(({ vote, text, color }) => (
                <button key={vote} onClick={() => handleVote(vote)} disabled={myVote !== null} className="btn-cute"
                  style={{ padding: '1.2rem', fontSize: '1rem', fontWeight: 700, justifyContent: 'center', background: myVote === vote ? `${color}15` : '#fff', border: `2px solid ${myVote === vote ? color : '#ddd6fe'}`, color: '#4c1d95', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', whiteSpace: 'normal', transition: 'all 0.2s' }}>
                  <span style={{ color, fontWeight: 800, marginRight: '6px' }}>{vote}.</span> {text}
                </button>
              ))}
            </div>
            {myVote !== null && (
              <p style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                Waiting for {opponentName || 'Partner'}...
                <Heart size={14} fill="#7c3aed" color="#7c3aed" style={{ animation: 'pulse-gentle 1s infinite' }} />
              </p>
            )}
          </div>
        )}

        {/* REVEAL PHASE */}
        {state.phase === 'reveal' && (
          <div style={{ textAlign: 'center', animation: 'pop-in 0.4s ease' }}>
            <h3 className="font-cute" style={{ color: '#4c1d95', fontSize: '1.5rem', marginBottom: '1.5rem' }}>Results Revealed! 🌟</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Your Pick', vote: myVote, border: '#ede9fe', bg: '#f5f3ff', color: '#7c3aed' },
                { label: `${opponentName || 'Partner'}'s Pick`, vote: theirVote, border: '#fbcfe8', bg: '#fdf2f8', color: '#be185d' },
              ].map(({ label, vote: v, border, bg, color }) => (
                <div key={label} style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: '18px', padding: '1.2rem 1rem' }}>
                  <div style={{ fontSize: '0.8rem', color, fontWeight: 700, marginBottom: '0.5rem' }}>{label}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#4c1d95', lineHeight: 1.3 }}>
                    {v === 'A' ? currentQ.optionA : v === 'B' ? currentQ.optionB : '—'}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 700, color: myVote === theirVote ? '#059669' : '#ca8a04', marginBottom: '2rem' }}>
              {myVote === theirVote ? <><Check color="#10b981" size={22} /><span>It's a Match! You both think alike! 💖</span></>
                : <><X color="#ca8a04" size={22} /><span>Different choices! Opposites attract! ✨</span></>}
            </div>

            {role === 'host' ? (
              <button onClick={nextQuestion} className="btn-cute btn-cute-primary" style={{ padding: '0.8rem 2rem' }}>
                {state.questionIndex + 1 >= TOTAL_ROUNDS ? 'See Final Results' : 'Next Question ➡️'}
              </button>
            ) : (
              <p style={{ color: '#8b5cf6', fontSize: '0.9rem' }}>Waiting for host to continue...</p>
            )}
          </div>
        )}

        {/* ENDED PHASE */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '2rem 0', animation: 'pop-in 0.4s ease' }}>
            <Award size={60} color="#7c3aed" style={{ animation: 'float 3s ease infinite', margin: '0 auto 1rem' }} />
            <h2 className="font-cute" style={{ fontSize: '2rem', color: '#4c1d95', margin: '0 0 0.5rem' }}>Match Complete! 💕</h2>
            <div style={{ fontSize: '1.1rem', color: '#374151', marginBottom: '1.5rem' }}>
              You matched on <strong style={{ color: '#ec4899', fontSize: '1.5rem' }}>{state.matches}</strong> out of <strong>{TOTAL_ROUNDS}</strong> questions!
              <div style={{ color: '#7c3aed', fontWeight: 800, marginTop: '8px', fontSize: '1.2rem' }}>Relationship Match: {matchPct}% ❤️</div>
              <div style={{ color: '#6b7280', marginTop: '4px', fontSize: '0.9rem' }}>
                {matchPct >= 80 ? '💜 You are basically the same person!' : matchPct >= 60 ? '❤️ Great compatibility!' : matchPct >= 40 ? '💛 Opposites attract — interesting pair!' : '💙 Very different, but that makes it exciting!'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={resetGame} className="btn-cute btn-cute-primary">Play Again</button>
              <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary">Back to Lobby</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
