import React, { useState, useRef, useEffect } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { triggerHaptic } from '../utils/haptics';
import {
  Play, Users, MessageCircle, Copy, Check,
  Send, LogOut, AlertCircle, Wifi, Crown, Zap, Star
} from 'lucide-react';

const ONLINE_GAMES = [
  { id: 'word-guess', title: 'Word Guessing 🔠', desc: 'One sets a secret word, the other guesses letter by letter!', emoji: '🔠', color: '#7c3aed', colorB: '#f3e8ff', tag: '🧠 Brain', tagColor: '#7c3aed' },
  { id: 'cat-catch', title: 'Cat Catching 🐱', desc: 'Move your basket to catch falling cats, hearts & yarn balls!', emoji: '🐱', color: '#ec4899', colorB: '#fce7f3', tag: '⚡ Fast', tagColor: '#ec4899' },
  { id: 'boyfriend-hit', title: 'Whack-a-BF 🔨', desc: 'Boyfriend pops from holes — girlfriend smacks him with a mallet!', emoji: '🔨', color: '#ea580c', colorB: '#ffedd5', tag: '⚡ Fast', tagColor: '#ea580c' },
  { id: 'rps', title: 'Paw Clash ✊', desc: 'Classic Rock Paper Scissors with cute cat paws!', emoji: '✊', color: '#059669', colorB: '#d1fae5', tag: '🎲 Luck', tagColor: '#059669' },
  { id: 'couples-quiz', title: 'Couples Quiz 💬', desc: 'How well do you know your partner? Ask and guess secret answers!', emoji: '💬', color: '#ec4899', colorB: '#fce7f3', tag: '💕 Love', tagColor: '#ec4899' },
  { id: 'emoji-battle', title: 'Emoji Battle 🎴', desc: 'Race against time to solve cute emoji riddles together!', emoji: '🎴', color: '#ca8a04', colorB: '#fef9c3', tag: '⏱️ Timed', tagColor: '#ca8a04' },
  { id: 'truth-or-dare', title: 'Truth or Dare 🤫', desc: 'Pick Truth or Dare and get 100 unique relationship prompts!', emoji: '🤫', color: '#db2777', colorB: '#fce7f3', tag: '💕 Love', tagColor: '#db2777' },
  { id: 'would-you-rather', title: 'Would You Rather 🤔', desc: 'Answer 100 questions in secret and see how much you match!', emoji: '🤔', color: '#0284c7', colorB: '#e0f2fe', tag: '💭 Think', tagColor: '#0284c7' },
  { id: 'reaction-race', title: 'Reaction Race ⚡', desc: 'Tap as fast as you can when the color changes — first to 5 wins!', emoji: '⚡', color: '#059669', colorB: '#d1fae5', tag: '⚡ Fast', tagColor: '#059669' },
  { id: 'number-duel', title: 'Number Duel 🔢', desc: 'Close to Target without going over. Double choice numbers duel!', emoji: '🔢', color: '#ca8a04', colorB: '#fef9c3', tag: '🧠 Brain', tagColor: '#ca8a04' },
  { id: 'trivia-battle', title: 'Trivia Battle 🧠', desc: 'Battle through 150 shuffled trivia questions — 20 seconds each!', emoji: '🧠', color: '#7c3aed', colorB: '#f3e8ff', tag: '🧠 Brain', tagColor: '#7c3aed' },
  { id: 'emoji-typerace', title: 'Emoji Typerace ⌨️', desc: 'Type the same phrase as fast as possible — best WPM wins!', emoji: '⌨️', color: '#059669', colorB: '#d1fae5', tag: '⚡ Fast', tagColor: '#059669' },
  { id: 'hot-or-not', title: 'Hot or Not 🔥', desc: 'Rate topics 1–10 simultaneously and see how in sync you are!', emoji: '🔥', color: '#ea580c', colorB: '#ffedd5', tag: '💕 Love', tagColor: '#ea580c' },
  { id: 'finish-sentence', title: 'Finish the Sentence ✍️', desc: 'Both complete the same prompt independently — read results together!', emoji: '✍️', color: '#ec4899', colorB: '#fce7f3', tag: '💕 Love', tagColor: '#ec4899' },
  { id: 'couple-confessions', title: 'Couple Confessions 🤭', desc: 'Secretly pick which option describes the same person. Do you agree?', emoji: '🤭', color: '#db2777', colorB: '#fce7f3', tag: '💕 Love', tagColor: '#db2777' },
  { id: 'this-or-that', title: 'This or That ⚡', desc: 'Rapid-fire 8-second simultaneous choices — see how much you match!', emoji: '⚡', color: '#7c3aed', colorB: '#f3e8ff', tag: '⚡ Fast', tagColor: '#7c3aed' },

  // Integrated Online Games
  { id: 'dream-date', title: 'Dream Date 🌅', desc: 'Build your perfect romantic date from categories and check compatibility!', emoji: '🌅', color: '#db2777', colorB: '#fce7f3', tag: '💕 Love', tagColor: '#db2777' },
  { id: 'mood-mirror', title: 'Mood Mirror 🪞', desc: "Guess each other's current mood in secret and check your sync score!", emoji: '🪞', color: '#7c3aed', colorB: '#f3e8ff', tag: '💭 Think', tagColor: '#7c3aed' },
  { id: 'star-gazing', title: 'Star Gazing ✨', desc: 'Silently pick 3 stars from a grid and see which ones you share!', emoji: '✨', color: '#ca8a04', colorB: '#fef9c3', tag: '💕 Love', tagColor: '#ca8a04' },
  { id: 'treasure-hunt', title: 'Treasure Hunt 💎', desc: 'Hide your treasure and take turns guessing on a coordinate grid!', emoji: '💎', color: '#0284c7', colorB: '#e0f2fe', tag: '🎲 Luck', tagColor: '#0284c7' },

  // New Online Games
  { id: 'ttt-online', title: 'Tic-Tac-Toe Online ❌⭕', desc: 'Play classic Tic-Tac-Toe duel with your partner online!', emoji: '❌', color: '#ec4899', colorB: '#fce7f3', tag: '🎲 Luck', tagColor: '#ec4899' },
  { id: 'connect4-online', title: 'Connect Four Online 💜💖', desc: 'Drop colored tokens. Align 4 in a line vertically, horizontally, or diagonally!', emoji: '💜', color: '#7c3aed', colorB: '#f3e8ff', tag: '🧠 Brain', tagColor: '#7c3aed' },
  { id: 'memory-online', title: 'Memory Match Online 🃏', desc: 'Turn-based memory match game. Pick pairs of sweet emojis!', emoji: '🃏', color: '#059669', colorB: '#d1fae5', tag: '🧠 Brain', tagColor: '#059669' },
  { id: 'ludo-online', title: 'Ludo Online 🎲', desc: 'Play classic Ludo board game online with live dice rolls and token knocking!', emoji: '🎲', color: '#7c3aed', colorB: '#f3e8ff', tag: '🎲 Luck', tagColor: '#7c3aed' },
  { id: 'doodle-online', title: 'Doodle Online 🎨', desc: 'One draws a secret word on canvas, the other guesses it in real-time!', emoji: '🎨', color: '#ca8a04', colorB: '#fef9c3', tag: '🎭 Art', tagColor: '#ca8a04' },
  { id: 'bubble-online', title: 'Bubble Pop Duel 🫧', desc: 'Pop numbered bubbles in ascending order. Speed and reaction time wins!', emoji: '🫧', color: '#ec4899', colorB: '#fce7f3', tag: '⚡ Fast', tagColor: '#ec4899' },
  { id: 'heart-tap-online', title: 'Heart Tap Duel ⚡', desc: 'A frantic tapping tug-of-war! Mash the heart to pull it to your side.', emoji: '⚡', color: '#db2777', colorB: '#fce7f3', tag: '⚡ Fast', tagColor: '#db2777' },
  { id: 'simon-online', title: 'Simon Says Duel 🔴🔵', desc: 'Repeat the pattern, add a step, and return. See who fails memory test first!', emoji: '🔴', color: '#0284c7', colorB: '#e0f2fe', tag: '🧠 Brain', tagColor: '#0284c7' },
  { id: 'reaction-online', title: 'Reaction Tap Online ⏱️', desc: 'Fastest finger first! Tap the heart when it flashes randomly on the grid.', emoji: '⏱️', color: '#ca8a04', colorB: '#fef9c3', tag: '⚡ Fast', tagColor: '#ca8a04' },
  { id: 'snake-online', title: 'Snake Duel Online 🐍⚔️', desc: 'Strategic turn-based simultaneous Snake battle. Trap the other snake to win!', emoji: '🐍', color: '#059669', colorB: '#d1fae5', tag: '🧠 Brain', tagColor: '#059669' },

  // Online Games Batch 2
  { id: 'reversi-online', title: 'Reversi Online ⬛💜', desc: "Classic Othello — flip your opponent's discs to dominate the board!", emoji: '⬛', color: '#7c3aed', colorB: '#f3e8ff', tag: '🧠 Brain', tagColor: '#7c3aed' },
  { id: 'checkers-online', title: 'Checkers Online 🔴🟣', desc: "Diagonal strategy — capture all of your partner's pieces to win!", emoji: '🔴', color: '#dc2626', colorB: '#fee2e2', tag: '🧠 Brain', tagColor: '#dc2626' },
  { id: 'battleship-online', title: 'Battleship Online 🚢', desc: "Place your fleet and hunt your partner's ships on a 10×10 grid!", emoji: '🚢', color: '#0284c7', colorB: '#e0f2fe', tag: '🎲 Luck', tagColor: '#0284c7' },
  { id: 'word-chain-online', title: 'Word Chain Online 🔗', desc: 'Keep the chain alive — each word must start with the last letter!', emoji: '🔗', color: '#059669', colorB: '#d1fae5', tag: '🧠 Brain', tagColor: '#059669' },
  { id: 'piano-tiles-online', title: 'Piano Tiles Online 🎹', desc: "Race to hit the most falling piano tiles — beat your partner's score!", emoji: '🎹', color: '#ec4899', colorB: '#fce7f3', tag: '⚡ Fast', tagColor: '#ec4899' },
  { id: 'color-clash-online', title: 'Color Clash Online 🎨', desc: 'STROOP challenge — identify the ink color of a word, not what it says!', emoji: '🎨', color: '#db2777', colorB: '#fce7f3', tag: '🧠 Brain', tagColor: '#db2777' },
  { id: 'block-stacker-online', title: 'Block Stacker Online 🧱', desc: 'Race Tetris! Stack blocks and clear lines faster than your partner!', emoji: '🧱', color: '#7c3aed', colorB: '#f3e8ff', tag: '⚡ Fast', tagColor: '#7c3aed' },
  { id: 'archery-online', title: 'Archery Online 🎯', desc: 'Stop the moving sliders at the right moment to hit closest to the bullseye!', emoji: '🏹', color: '#ea580c', colorB: '#ffedd5', tag: '🎲 Luck', tagColor: '#ea580c' },
  { id: 'minesweeper-online', title: 'Minesweeper Duel 💣', desc: 'Race to reveal safe cells on a shared board. Hit a mine and lose 3 points!', emoji: '💣', color: '#059669', colorB: '#d1fae5', tag: '🎲 Luck', tagColor: '#059669' },
  { id: 'emoji-sprint-online', title: 'Emoji Sprint Online 🏁', desc: 'Tap your button as fast as you can! First to 30 taps crosses the finish line!', emoji: '🏁', color: '#7c3aed', colorB: '#f3e8ff', tag: '⚡ Fast', tagColor: '#7c3aed' },
];

const OFFLINE_GAMES = [
  { id: 'offline-word-guess', title: 'Word Guess 🔠', desc: 'Guess the hidden sweet word from categories like Love, Animals & Treats!', emoji: '🔠', color: '#7c3aed', colorB: '#f3e8ff', tag: '🧠 Brain', tagColor: '#7c3aed' },
  { id: 'offline-memory', title: 'Memory Match 🃏', desc: 'Flip cute emoji cards and find all matching pairs!', emoji: '🃏', color: '#7c3aed', colorB: '#f3e8ff', tag: '🧠 Brain', tagColor: '#7c3aed' },
  { id: 'offline-bonk', title: 'Whack-a-BF Solo 🔨', desc: 'Bonk the boyfriend moles as fast as you can in 30 seconds!', emoji: '🔨', color: '#059669', colorB: '#d1fae5', tag: '⚡ Fast', tagColor: '#059669' },
  { id: 'offline-cupid', title: "Cupid's Catch 💖", desc: 'Catch falling hearts, stars & cupcakes. Dodge the bombs!', emoji: '💖', color: '#ec4899', colorB: '#fce7f3', tag: '⚡ Fast', tagColor: '#ec4899' },
  { id: 'offline-ttt', title: 'Tic-Tac-Love 💕', desc: 'Play Tic-Tac-Toe against an AI bot. Easy or unbeatable!', emoji: '💕', color: '#ca8a04', colorB: '#fef9c3', tag: '🎲 Luck', tagColor: '#ca8a04' },
  { id: 'offline-snake', title: 'Snake Love 🐍', desc: 'Control the snake, eat sweet hearts and grow without hitting the wall!', emoji: '🐍', color: '#7c3aed', colorB: '#f3e8ff', tag: '🧠 Brain', tagColor: '#7c3aed' },
  { id: 'offline-love2048', title: 'Love 2048 🌟', desc: 'Merge the love emojis to reach the ultimate star tile!', emoji: '🌟', color: '#db2777', colorB: '#fce7f3', tag: '🧠 Brain', tagColor: '#db2777' },
  { id: 'offline-doodle', title: 'Doodle Quiz 🎨', desc: 'Pass and play! Draw a prompt word while your partner guesses!', emoji: '🎨', color: '#0284c7', colorB: '#e0f2fe', tag: '🎭 Art', tagColor: '#0284c7' },
  { id: 'offline-simon', title: 'Simon Says 🎯', desc: 'Watch the flashing color patterns and repeat them exactly!', emoji: '🎯', color: '#059669', colorB: '#d1fae5', tag: '🧠 Brain', tagColor: '#059669' },
  { id: 'offline-typing', title: 'Typing Speed ⌨️', desc: 'Type love quotes as fast as you can. Measure WPM and accuracy!', emoji: '⌨️', color: '#7c3aed', colorB: '#f3e8ff', tag: '⚡ Fast', tagColor: '#7c3aed' },
  { id: 'offline-scramble', title: 'Word Scramble 🔀', desc: 'Unscramble secret words from categories using letter blocks!', emoji: '🔀', color: '#db2777', colorB: '#fce7f3', tag: '🧠 Brain', tagColor: '#db2777' },
  { id: 'offline-math', title: 'Quick Math ⚡', desc: 'Solve math questions as fast as possible in 30 seconds!', emoji: '⚡', color: '#ca8a04', colorB: '#fef9c3', tag: '🧠 Brain', tagColor: '#ca8a04' },
  { id: 'offline-spin', title: 'Spin the Wheel 🎡', desc: 'Spin a custom wheel to get cute relationship prompts or actions!', emoji: '🎡', color: '#7c3aed', colorB: '#f3e8ff', tag: '🎲 Luck', tagColor: '#7c3aed' },
  { id: 'offline-slide', title: 'Slide Puzzle 🧩', desc: 'Order numbers 1 to 8 by sliding adjacent tiles in a 3x3 grid!', emoji: '🧩', color: '#0284c7', colorB: '#e0f2fe', tag: '🧠 Brain', tagColor: '#0284c7' },
  { id: 'offline-bubble', title: 'Bubble Pop 🫧', desc: 'Pop bubbles containing numbers in ascending order as fast as possible!', emoji: '🫧', color: '#ec4899', colorB: '#fce7f3', tag: '⚡ Fast', tagColor: '#ec4899' },
  { id: 'offline-color', title: 'Stroop Match 🔴', desc: 'Stroop cognitive test. Match colored words with their ink color!', emoji: '🔴', color: '#dc2626', colorB: '#fee2e2', tag: '🧠 Brain', tagColor: '#dc2626' },
  { id: 'offline-flappy', title: 'Flappy Heart 💖', desc: 'Flap a cute heart to fly between columns without crashing!', emoji: '💖', color: '#db2777', colorB: '#fce7f3', tag: '⚡ Fast', tagColor: '#db2777' },
  { id: 'offline-trivia', title: 'Trivia Quiz 🧠', desc: 'Test your knowledge with shuffled trivia questions!', emoji: '🧠', color: '#7c3aed', colorB: '#f3e8ff', tag: '🧠 Brain', tagColor: '#7c3aed' },
  { id: 'offline-hangman', title: 'Hangman Love 💀❤️', desc: 'Guess the hidden love-themed word letter by letter before you run out!', emoji: '💀', color: '#7c3aed', colorB: '#f3e8ff', tag: '🧠 Brain', tagColor: '#7c3aed' },
  { id: 'offline-fastfacts', title: 'Fast Facts ⚡', desc: 'True or False rapid-fire quiz — 60 seconds, 30 wild facts!', emoji: '⚡', color: '#059669', colorB: '#d1fae5', tag: '⚡ Fast', tagColor: '#059669' },
  { id: 'offline-lovecalc', title: 'Love Calculator 💕', desc: 'Answer 10 fun personality questions to reveal your love score!', emoji: '💕', color: '#ec4899', colorB: '#fce7f3', tag: '💕 Love', tagColor: '#ec4899' },
  { id: 'offline-guessprize', title: 'Guess the Price 💰', desc: 'Guess how much everyday items cost — closest guess wins points!', emoji: '💰', color: '#ca8a04', colorB: '#fef9c3', tag: '🎲 Luck', tagColor: '#ca8a04' },
  { id: 'offline-loveclicker', title: 'Love Clicker 💖', desc: 'Tap the giant heart to spawn sweet emojis and buy cute auto-generation upgrades!', emoji: '💖', color: '#ec4899', colorB: '#fce7f3', tag: '⚡ Fast', tagColor: '#ec4899' },
  { id: 'offline-ludo', title: 'Ludo Solo / Pass 🎲', desc: 'Classic board game of Ludo. Pass and play locally with your partner!', emoji: '🎲', color: '#7c3aed', colorB: '#f3e8ff', tag: '🎲 Luck', tagColor: '#7c3aed' },
];

const BOOTH_PALETTES = [
  { a: '#7c3aed', b: '#f3e8ff' },
  { a: '#ec4899', b: '#fce7f3' },
  { a: '#059669', b: '#d1fae5' },
  { a: '#0284c7', b: '#e0f2fe' },
  { a: '#ca8a04', b: '#fef9c3' },
  { a: '#ea580c', b: '#ffedd5' },
];

const TICKER_ITEMS = [
  '🎮 40+ Games to play!', '💖 Taylor Swift Synth Radio', '📱 Mobile Haptic Feedback', '⭐ 500+ Questions',
  '🎡 Apple iOS UI Aesthetic', '🤝 Play with your partner', '🏆 Win together!', '✨ Tap to play music!',
];

interface Props {
  onSelectLocalGame: (id: string) => void;
}

export const Lobby: React.FC<Props> = ({ onSelectLocalGame }) => {
  const {
    roomCode, isConnected, isHostReady, isConnecting, role,
    playerName, opponentName, chatMessages, error,
    setPlayerName, hostRoom, joinRoom, selectGame, sendChatMessage, disconnect, clearError,
  } = useGamePeer();

  const [inputName, setInputName] = useState(playerName);
  const [inputCode, setInputCode] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [tab, setTab] = useState<'online' | 'offline'>('online');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatOpen]);

  const handleHost = () => {
    if (!inputName.trim()) return;
    triggerHaptic('medium');
    setPlayerName(inputName.trim());
    hostRoom(inputName.trim());
  };

  const handleJoin = () => {
    if (!inputName.trim() || !inputCode.trim()) return;
    triggerHaptic('medium');
    setPlayerName(inputName.trim());
    joinRoom(inputName.trim(), inputCode.trim());
  };

  const handleCopy = () => {
    triggerHaptic('light');
    const code = roomCode || '';
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    triggerHaptic('light');
    sendChatMessage(chatInput.trim());
    setChatInput('');
  };

  const isWaiting = (isConnecting || isHostReady) && !isConnected;

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '5rem' }}>

      {/* ── HERO SECTION ── */}
      <div className="lobby-hero">
        <div style={{ position: 'relative', zIndex: 2 }}>
          <span className="lobby-hero__mascot">🎡</span>
          <h1 className="heading-xl" style={{ marginBottom: '0.2rem' }}>
            Ape Punchi Game Room
          </h1>
          <p style={{
            fontFamily: 'var(--font-cute)', fontSize: '1rem',
            color: '#6b7280', margin: '0 0 1rem',
          }}>
            අපේ පුංචි ගේම් රූම් 🌸 • Clean Solid UI & Taylor Swift Vibe
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <span className="map-pin">🎮 40+ Games</span>
            <span className="map-pin" style={{ background: '#f3e8ff' }}>💖 500+ Questions</span>
            <span className="map-pin" style={{ background: '#dcfce7' }}>📱 Haptic Feedback</span>
          </div>
        </div>
      </div>

      {/* ── SCROLLING TICKER ── */}
      <div className="world-ticker">
        <div className="world-ticker__inner">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="world-ticker__item">{item}</span>
          ))}
        </div>
      </div>

      <div style={{ padding: '1.5rem 1rem 0' }}>
        {/* Error Banner */}
        {error && (
          <div className="alert-error" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
            <button onClick={clearError} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* ── MODE TABS ── */}
        {!isConnected && !isWaiting && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <div className="world-tab-bar" style={{ maxWidth: '360px', width: '100%' }}>
              {(['online', 'offline'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { triggerHaptic('light'); setTab(t); }}
                  className={`world-tab ${tab === t ? 'world-tab--active' : 'world-tab--inactive'}`}
                >
                  {t === 'online' ? <><Wifi size={15} /> Online Arena</> : <><Zap size={15} /> Solo Land</>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── OFFLINE TAB ── */}
        {!isConnected && !isWaiting && tab === 'offline' && (
          <div className="world-zone" style={{ animation: 'pop-in 0.35s ease' }}>
            <div className="world-zone__header">
              <span style={{ fontSize: '2rem' }}>🏝️</span>
              <div>
                <h2 className="world-zone__title">Solo Land</h2>
                <p className="world-zone__subtitle">No partner? No problem! Play these anytime, anywhere.</p>
              </div>
              <span className="map-pin" style={{ marginLeft: 'auto' }}>
                🎮 {OFFLINE_GAMES.length} games
              </span>
            </div>
            <div className="world-zone__content">
              <div className="games-grid">
                {OFFLINE_GAMES.map((g, i) => {
                  const pal = BOOTH_PALETTES[i % BOOTH_PALETTES.length];
                  return (
                    <div
                      key={g.id}
                      className="carnival-booth"
                      style={{ '--booth-color-a': pal.a, '--booth-color-b': pal.b } as React.CSSProperties}
                      onClick={() => { triggerHaptic('medium'); onSelectLocalGame(g.id); }}
                    >
                      <div className="carnival-booth__roof" />
                      <div className="carnival-booth__body">
                        <div className="carnival-booth__emoji">{g.emoji}</div>
                        <h3 className="carnival-booth__title">{g.title}</h3>
                        <p className="carnival-booth__desc">{g.desc}</p>
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.3rem' }}>
                          <span className="carnival-booth__tag" style={{ color: g.tagColor, borderColor: g.tagColor }}>
                            {g.tag}
                          </span>
                        </div>
                        <button
                          className="carnival-booth__btn"
                          style={{ backgroundColor: pal.a }}
                          onClick={e => { e.stopPropagation(); triggerHaptic('medium'); onSelectLocalGame(g.id); }}
                        >
                          <Play size={13} /> Play Now!
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── PRE-CONNECTION: Name + Host/Join ── */}
        {!isConnected && !isWaiting && tab === 'online' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>

            <div className="ticket-card" style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
              <div className="ticket-card__header">
                <span style={{ fontSize: '1.8rem' }}>🎟️</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-world)', fontSize: '1.3rem', color: '#1e1b4b' }}>Your Entry Ticket</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', fontFamily: 'var(--font-cute)' }}>Enter your name to create or join a room</div>
                </div>
              </div>
              <div className="ticket-card__body">
                <label style={{ display: 'block', fontWeight: 700, color: '#1e1b4b', marginBottom: '0.4rem', fontFamily: 'var(--font-cute)', fontSize: '0.9rem' }}>
                  <Users size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  Your Nickname
                </label>
                <input
                  className="input-cute"
                  placeholder="e.g. Baby, Princess, Hubby..."
                  value={inputName}
                  onChange={e => setInputName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleHost()}
                  style={{ fontSize: '1rem', textAlign: 'center', marginBottom: '1.2rem' }}
                />

                <div className="host-join-grid">
                  {/* Host */}
                  <div style={{
                    background: '#f5f3ff',
                    border: '2px solid #ddd6fe', borderRadius: '20px', padding: '1.2rem',
                    display: 'flex', flexDirection: 'column', gap: '0.6rem', textAlign: 'center',
                    boxShadow: '0 4px 15px rgba(124, 58, 237, 0.08)',
                  }}>
                    <div style={{ fontSize: '2.2rem', animation: 'float 2.5s ease-in-out infinite' }}>🏠</div>
                    <div style={{ fontFamily: 'var(--font-world)', fontSize: '1.2rem', color: '#1e1b4b' }}>Host Room</div>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                      Create a room and share the code with your partner.
                    </p>
                    <button
                      onClick={handleHost}
                      disabled={!inputName.trim()}
                      className="btn-world"
                      style={{ marginTop: 'auto', backgroundColor: '#7c3aed' }}
                    >
                      🏠 Host Room
                    </button>
                  </div>

                  {/* Join */}
                  <div style={{
                    background: '#fce7f3',
                    border: '2px solid #fbcfe8', borderRadius: '20px', padding: '1.2rem',
                    display: 'flex', flexDirection: 'column', gap: '0.6rem', textAlign: 'center',
                    boxShadow: '0 4px 15px rgba(236, 72, 153, 0.08)',
                  }}>
                    <div style={{ fontSize: '2.2rem', animation: 'float 2s ease-in-out infinite 0.5s' }}>🔗</div>
                    <div style={{ fontFamily: 'var(--font-world)', fontSize: '1.2rem', color: '#1e1b4b' }}>Join Room</div>
                    <input
                      className="input-cute"
                      placeholder="e.g. STAR28"
                      value={inputCode}
                      maxLength={6}
                      onChange={e => setInputCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      onKeyDown={e => e.key === 'Enter' && handleJoin()}
                      style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.2em', fontWeight: 700, fontFamily: 'monospace' }}
                    />
                    <button
                      onClick={handleJoin}
                      disabled={!inputName.trim() || inputCode.length < 6}
                      className="btn-world"
                      style={{ backgroundColor: '#ec4899', marginTop: 'auto' }}
                    >
                      🔗 Join Room
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Online Games Preview Zone */}
            <div className="world-zone" style={{ animation: 'pop-in 0.4s ease' }}>
              <div className="world-zone__header">
                <span style={{ fontSize: '2rem' }}>🏟️</span>
                <div>
                  <h2 className="world-zone__title">Online Arena</h2>
                  <p className="world-zone__subtitle">Connect with your partner to play any of these live multiplayer games!</p>
                </div>
                <span className="map-pin" style={{ marginLeft: 'auto' }}>
                  🎮 {ONLINE_GAMES.length} games
                </span>
              </div>
              <div className="world-zone__content">
                <div className="games-grid" style={{ opacity: 0.75 }}>
                  {ONLINE_GAMES.slice(0, 8).map((g, i) => {
                    const pal = BOOTH_PALETTES[i % BOOTH_PALETTES.length];
                    return (
                      <div key={g.id} className="carnival-booth" style={{
                        '--booth-color-a': pal.a, '--booth-color-b': pal.b,
                        cursor: 'default', pointerEvents: 'none',
                      } as React.CSSProperties}>
                        <div className="carnival-booth__roof" />
                        <div className="carnival-booth__body">
                          <div className="carnival-booth__emoji">{g.emoji}</div>
                          <h3 className="carnival-booth__title" style={{ fontSize: '0.9rem' }}>{g.title}</h3>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <span className="carnival-booth__tag" style={{ color: g.tagColor, borderColor: g.tagColor }}>{g.tag}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p style={{ textAlign: 'center', marginTop: '1rem', color: '#6b7280', fontSize: '0.85rem', fontFamily: 'var(--font-cute)' }}>
                  🔒 Connect with a partner above to unlock all {ONLINE_GAMES.length} games!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── WAITING STATE ── */}
        {isWaiting && (
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            {role === 'host' && isHostReady && roomCode ? (
              <div className="ticket-card" style={{ textAlign: 'center', animation: 'pop-in 0.4s ease' }}>
                <div className="ticket-card__header" style={{ justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.6rem' }}>🎟️</span>
                  <div style={{ fontFamily: 'var(--font-world)', fontSize: '1.3rem', color: '#1e1b4b' }}>Room is Ready!</div>
                </div>
                <div className="ticket-card__body">
                  <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.9rem' }}>Share this code with your partner:</p>

                  <div style={{
                    background: '#f5f3ff',
                    border: '2px solid #ddd6fe', borderRadius: '20px', padding: '1.2rem 2rem',
                    marginBottom: '0.8rem', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: '1rem',
                  }}>
                    <code style={{
                      fontSize: '2.6rem', color: '#7c3aed', fontFamily: 'monospace',
                      fontWeight: 900, letterSpacing: '0.3em', flex: 1, textAlign: 'center',
                    }}>
                      {roomCode}
                    </code>
                    <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', padding: '4px', flexShrink: 0 }} title="Copy code">
                      {copied ? <Check size={24} color="#059669" /> : <Copy size={24} />}
                    </button>
                  </div>

                  <p style={{ color: '#8b5cf6', fontSize: '0.8rem', marginBottom: '1rem' }}>
                    6-letter code • works on any WiFi or mobile data 🌍
                  </p>

                  <p style={{ color: '#7c3aed', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    <span style={{ animation: 'pulse-gentle 1s infinite', display: 'inline-block' }}>💖</span>
                    Waiting for your partner...
                  </p>
                  <button onClick={() => { triggerHaptic('light'); disconnect(); }} className="btn-cute btn-cute-secondary" style={{ marginTop: '1.2rem', padding: '0.45rem 1.2rem', fontSize: '0.88rem' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="ticket-card" style={{ textAlign: 'center' }}>
                <div className="ticket-card__header" style={{ justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.6rem', animation: 'pulse-gentle 1s infinite', display: 'inline-block' }}>
                    {role === 'guest' ? '🔗' : '⏳'}
                  </span>
                  <div style={{ fontFamily: 'var(--font-world)', fontSize: '1.3rem', color: '#1e1b4b' }}>
                    {role === 'guest' ? 'Connecting...' : 'Partner connecting...'}
                  </div>
                </div>
                <div className="ticket-card__body">
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    {role === 'guest'
                      ? 'Reaching your partner across the internet, please wait…'
                      : 'Establishing secure peer connection, please wait…'}
                  </p>
                  <button onClick={() => { triggerHaptic('light'); disconnect(); }} className="btn-cute btn-cute-secondary" style={{ marginTop: '1.2rem' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CONNECTED DASHBOARD ── */}
        {isConnected && (
          <div style={{ display: 'grid', gap: '1.5rem', animation: 'pop-in 0.4s ease' }}>
            {/* Status Strip */}
            <div className="status-strip">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span className="status-online">Connected</span>
                <span className="badge-cute" style={{ fontSize: '0.75rem' }}>
                  {role === 'host' ? <Crown size={11} /> : <Wifi size={11} />}
                  {role === 'host' ? 'Host' : 'Guest'}
                </span>
                <span style={{ fontFamily: 'var(--font-world)', color: '#1e1b4b', fontSize: '1rem' }}>{playerName}</span>
                <span style={{ fontSize: '1.2rem', animation: 'pulse-gentle 1.5s infinite', display: 'inline-block' }}>💖</span>
                <span style={{ fontFamily: 'var(--font-world)', color: '#1e1b4b', fontSize: '1rem' }}>{opponentName || 'Partner'}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button onClick={() => { triggerHaptic('light'); setChatOpen(o => !o); }} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                  <MessageCircle size={15} />
                  <span className="btn-label">Chat {chatMessages.length > 0 && `(${chatMessages.length})`}</span>
                </button>
                <button onClick={() => { triggerHaptic('medium'); disconnect(); }} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: '#dc2626' }}>
                  <LogOut size={15} />
                  <span className="btn-label">Leave</span>
                </button>
              </div>
            </div>

            {/* Game Selection Zone */}
            <div className="world-zone">
              <div className="world-zone__header">
                <span style={{ fontSize: '2rem' }}>🏟️</span>
                <div>
                  <h2 className="world-zone__title">Online Arena — Choose a Game!</h2>
                  <p className="world-zone__subtitle">
                    {role === 'guest'
                      ? `Waiting for ${opponentName || 'host'} to pick a game. Chat while you wait! 💖`
                      : 'You are the host — pick any game to start! 🎮'}
                  </p>
                </div>
                <span className="map-pin" style={{ marginLeft: 'auto' }}>
                  <Star size={11} fill="#7c3aed" />
                  {ONLINE_GAMES.length} games
                </span>
              </div>
              <div className="world-zone__content">
                <div className="games-grid">
                  {ONLINE_GAMES.map((g, i) => {
                    const pal = BOOTH_PALETTES[i % BOOTH_PALETTES.length];
                    return (
                      <div
                        key={g.id}
                        className="carnival-booth"
                        style={{
                          '--booth-color-a': pal.a, '--booth-color-b': pal.b,
                          opacity: role === 'guest' ? 0.6 : 1,
                          cursor: role === 'guest' ? 'not-allowed' : 'pointer',
                          pointerEvents: role === 'guest' ? 'none' : 'auto',
                        } as React.CSSProperties}
                        onClick={() => {
                          if (role === 'host') {
                            triggerHaptic('medium');
                            selectGame(g.id);
                          }
                        }}
                      >
                        <div className="carnival-booth__roof" />
                        <div className="carnival-booth__body">
                          <div className="carnival-booth__emoji">{g.emoji}</div>
                          <h3 className="carnival-booth__title">{g.title}</h3>
                          <p className="carnival-booth__desc">{g.desc}</p>
                          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.3rem' }}>
                            <span className="carnival-booth__tag" style={{ color: g.tagColor, borderColor: g.tagColor }}>
                              {g.tag}
                            </span>
                          </div>
                          <button
                            className="carnival-booth__btn"
                            disabled={role === 'guest'}
                            style={{ backgroundColor: pal.a }}
                            onClick={e => {
                              e.stopPropagation();
                              if (role === 'host') {
                                triggerHaptic('medium');
                                selectGame(g.id);
                              }
                            }}
                          >
                            <Play size={13} />
                            {role === 'host' ? 'Play!' : 'Host picks'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Floating Chat ── */}
        {isConnected && chatOpen && (
          <div className="chat-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0.9rem', borderBottom: '1px solid #e9d5ff', background: '#f5f3ff' }}>
              <span className="font-cute" style={{ color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.95rem', fontWeight: 700 }}>
                <MessageCircle size={15} /> 💬 Love Chat
              </span>
              <button onClick={() => { triggerHaptic('light'); setChatOpen(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '1.2rem', lineHeight: 1, padding: '2px 6px' }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {chatMessages.length === 0 ? (
                <p style={{ color: '#a78bfa', textAlign: 'center', margin: 'auto', fontSize: '0.88rem' }}>Say something sweet! 💖</p>
              ) : chatMessages.map((m, i) => (
                <div key={i} style={{
                  alignSelf: m.sender === 'me' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  background: m.sender === 'me' ? '#7c3aed' : '#f3e8ff',
                  color: m.sender === 'me' ? '#ffffff' : '#1e1b4b',
                  padding: '0.55rem 0.85rem', borderRadius: m.sender === 'me' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  fontSize: '0.88rem', wordBreak: 'break-word', border: '1px solid #ddd6fe',
                }}>{m.text}</div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleChat} style={{ padding: '0.6rem', borderTop: '1px solid #e9d5ff', display: 'flex', gap: '0.4rem' }}>
              <input className="input-cute" placeholder="Type..." value={chatInput} onChange={e => setChatInput(e.target.value)} style={{ padding: '0.45rem 0.65rem', fontSize: '0.88rem', borderRadius: '12px' }} />
              <button type="submit" className="btn-cute btn-cute-primary" style={{ padding: '0.45rem 0.7rem', borderRadius: '12px', minWidth: 36, justifyContent: 'center' }}>
                <Send size={14} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
