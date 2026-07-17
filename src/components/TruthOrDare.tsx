import React from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

interface TodState {
  phase: 'select' | 'reveal';
  turn: 'host' | 'guest';
  type: 'truth' | 'dare' | null;
  text: string;
  hostTurns: number;
  guestTurns: number;
}

const INITIAL: TodState = {
  phase: 'select',
  turn: 'host',
  type: null,
  text: '',
  hostTurns: 0,
  guestTurns: 0,
};

const TRUTHS = [
  "What was your very first impression of me? 💕",
  "If you could change one thing about our relationship, what would it be? ✨",
  "What is the funniest text message you have received from me? 📱",
  "When did you first realize you had feelings for me? 👀",
  "What is your favourite physical feature of mine? 😊",
  "If you had to describe me in three words, what would they be? 📝",
  "What is a silly fear that you have never told anyone? 🤫",
  "What was your most embarrassing moment this year? 🙈",
  "What dream memory do you want us to create together? ✈️",
  "If you could relive one day with me, which would it be and why? 📅",
  "What is something I do that always makes you smile? 😁",
  "If we could move to any country tomorrow, where would you pick? 🌍",
  "What is one thing you love about yourself? 💛",
  "What do you think is the most romantic gesture? 🌹",
  "What is something you have always wanted to tell me but never did? 💬",
  "What song reminds you of me and why? 🎵",
  "What is your love language and do you think I speak it? ❤️",
  "Describe our relationship in one emoji and explain it! 😂",
  "What is something small I do that means a lot to you? 🌟",
  "If you could give me one superpower, what would it be and why? 🦸",
  "What is your favourite memory of us together? 📸",
  "What is one thing you admire about how I handle life? 💪",
  "What was the moment you knew I was special to you? 🌈",
  "What is one habit of mine you secretly love? 💜",
  "If we could go on a dream date right now, what would it be? 🍽️",
  "What celebrity couple do you think we are most like? ⭐",
  "What would you do if I said something that really hurt you? 🕊️",
  "What is one thing you want to do together before the end of the year? 🗓️",
  "How do you usually know when I am upset, even before I say anything? 🤍",
  "What is something that makes our relationship special compared to others? 🔐",
];

const DARES = [
  "Send your partner the most recent selfie in your camera roll! 📸",
  "Whisper a sweet or cheesy compliment in voice chat or type it in caps! 🗣️",
  "Send a screenshot of your most frequently used emojis! 📊",
  "Make a funny face, take a picture, and send it to your partner! 🤪",
  "Write a short 3-line poem about your partner right now! ✍️",
  "Sing the chorus of your favourite love song out loud! 🎵",
  "Gently mimic your partner's favourite habit or gesture! 🎭",
  "Tell your partner one reason you are proud of them! ❤️",
  "Change your WhatsApp status to something sweet about your partner for 1 hour! 💜",
  "Send your partner a voice note saying 3 things you love about them! 🎤",
  "Draw a quick doodle of your partner and send it (no matter how bad)! 🎨",
  "List 5 things you would take on a desert island trip with your partner! 🏝️",
  "Recreate your partner's most iconic pose from a photo! 📷",
  "Write your partner's name using only emojis! 😄",
  "Text your partner's favourite compliment to give them right now! 💌",
  "Share the most recent photo in your gallery — no filter allowed! 😂",
  "Tell your partner their most attractive quality without using any common words! ✨",
  "Tell a joke that you think your partner would find hilarious! 😂",
  "Reveal a silly song you listen to when no one is watching! 🎶",
  "Act out your partner's go-to reaction when something embarrassing happens! 🤭",
  "Share your lock screen photo and explain why it's there! 📱",
  "Tell your partner one thing you have never admitted to being afraid of! 👻",
  "Write a 3-sentence love story where you and your partner are the main characters! 📖",
  "Say one thing you wish more people knew about your partner! 🌟",
  "Show your partner your most embarrassing song that is on repeat! 🎵",
  "Do your best impression of your partner — video or voice note! 😂",
  "Tell your partner the most ridiculous thing you have ever Googled! 🔍",
  "Share the weirdest food combination you actually enjoy! 🍕",
  "Read out loud the last 5 things you searched for online! 🌐",
  "Tell your partner the most thoughtful gift you have imagined giving them! 🎁",
];

export const TruthOrDare: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName } = useGamePeer();
  const state: TodState = gameState ?? INITIAL;

  const isMyTurn = (role === 'host' && state.turn === 'host') || (role === 'guest' && state.turn === 'guest');
  const totalTurns = state.hostTurns + state.guestTurns;

  const handleSelection = (type: 'truth' | 'dare') => {
    if (!isMyTurn || state.phase !== 'select') return;
    const pool = type === 'truth' ? TRUTHS : DARES;
    const randomText = pool[Math.floor(Math.random() * pool.length)];
    sendGameAction({ ...state, phase: 'reveal', type, text: randomText });
  };

  const nextTurn = () => {
    const nextHostTurns = state.turn === 'host' ? state.hostTurns + 1 : state.hostTurns;
    const nextGuestTurns = state.turn === 'guest' ? state.guestTurns + 1 : state.guestTurns;
    sendGameAction({
      phase: 'select',
      turn: state.turn === 'host' ? 'guest' : 'host',
      type: null,
      text: '',
      hostTurns: nextHostTurns,
      guestTurns: nextGuestTurns,
    });
  };

  const resetGame = () => { sendGameAction({ ...INITIAL }); };

  return (
    <div className="container-cute" style={{ maxWidth: '640px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Truth or Dare 🤫</span>
          <button onClick={resetGame} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Turn stats */}
        <div style={{ display: 'flex', justifyContent: 'space-around', background: '#fff', borderRadius: '14px', padding: '0.6rem 1rem', border: '1px solid #ede9fe', marginBottom: '1.5rem', fontSize: '0.82rem', color: '#6b7280' }}>
          <span>Your turns: <strong style={{ color: '#7c3aed' }}>{role === 'host' ? state.hostTurns : state.guestTurns}</strong></span>
          <span>Total played: <strong>{totalTurns}</strong></span>
          <span>{opponentName || 'Partner'}'s turns: <strong style={{ color: '#8b5cf6' }}>{role === 'host' ? state.guestTurns : state.hostTurns}</strong></span>
        </div>

        {/* Turn indicator */}
        <div style={{ textAlign: 'center', background: isMyTurn ? 'linear-gradient(135deg,#f5f3ff,#ede9fe)' : '#f9fafb', border: `1.5px solid ${isMyTurn ? '#c084fc' : '#e5e7eb'}`, borderRadius: '16px', padding: '0.8rem', marginBottom: '2rem', color: isMyTurn ? '#5b21b6' : '#6b7280', fontWeight: 700, fontSize: '0.95rem' }}>
          {isMyTurn ? "✨ IT'S YOUR TURN! ✨" : `⏳ Waiting for ${opponentName || 'Partner'} to pick...`}
        </div>

        {/* SELECT PHASE */}
        {state.phase === 'select' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', animation: 'float 2.5s ease infinite' }}>🤫🎭</div>
            <h3 className="heading-lg" style={{ fontSize: '1.6rem', color: '#4c1d95', marginBottom: '1.5rem' }}>
              {isMyTurn ? "Choose Your Fate!" : `${opponentName || 'Partner'} is choosing...`}
            </h3>
            {isMyTurn ? (
              <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center' }}>
                <button onClick={() => handleSelection('truth')} className="btn-cute btn-cute-primary"
                  style={{ flex: 1, padding: '1.5rem', fontSize: '1.2rem', justifyContent: 'center', background: '#7c3aed' }}>
                  Truth 💜
                </button>
                <button onClick={() => handleSelection('dare')} className="btn-cute btn-cute-primary"
                  style={{ flex: 1, padding: '1.5rem', fontSize: '1.2rem', justifyContent: 'center', background: '#db2777', borderColor: '#db2777' }}>
                  Dare 🔥
                </button>
              </div>
            ) : (
              <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>They can choose Truth or Dare to get a prompt!</p>
            )}
          </div>
        )}

        {/* REVEAL PHASE */}
        {state.phase === 'reveal' && (
          <div style={{ textAlign: 'center', animation: 'pop-in 0.4s ease' }}>
            <span className="badge-cute" style={{ background: state.type === 'truth' ? '#f5f3ff' : '#fff1f2', color: state.type === 'truth' ? '#7c3aed' : '#be123c', border: `1.5px solid ${state.type === 'truth' ? '#c084fc' : '#fecaca'}`, marginBottom: '1rem', fontSize: '0.9rem', padding: '0.5rem 1.5rem' }}>
              {state.type?.toUpperCase()} {state.type === 'truth' ? '💜' : '🔥'}
            </span>

            <div style={{ background: '#fff', border: '2px solid #ddd6fe', borderRadius: '20px', padding: '2rem 1.5rem', marginBottom: '2rem', boxShadow: '0 4px 14px rgba(124,58,237,0.05)' }}>
              <h3 className="font-cute" style={{ color: '#4c1d95', fontSize: '1.4rem', margin: 0, lineHeight: 1.5 }}>
                "{state.text}"
              </h3>
            </div>

            {isMyTurn ? (
              <div style={{ maxWidth: '360px', margin: '0 auto' }}>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1.2rem' }}>
                  Complete the prompt, then click next to pass the turn!
                </p>
                <button onClick={nextTurn} className="btn-cute btn-cute-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Done! Next Turn ➡️
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#8b5cf6' }}>
                <AlertCircle size={16} />
                <span>Waiting for {opponentName || 'Partner'} to complete...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
