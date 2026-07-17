import React, { useState } from 'react';
import { PeerProvider, useGamePeer } from './utils/peerConnection';
import { ApologyScreen } from './components/ApologyScreen';
import { Lobby } from './components/Lobby';
import { WordGuess } from './components/WordGuess';
import { CatCatch } from './components/CatCatch';
import { BoyfriendHit } from './components/BoyfriendHit';
import { RockPaperScissors } from './components/RockPaperScissors';
import { OfflineWordGuess } from './components/OfflineWordGuess';
import { OfflineMemoryMatch } from './components/OfflineMemoryMatch';
import { OfflineBoyfriendBonk } from './components/OfflineBoyfriendBonk';
import { OfflineCupidCatch } from './components/OfflineCupidCatch';
import { OfflineTicTacToe } from './components/OfflineTicTacToe';
import { OfflineSnake } from './components/OfflineSnake';
import { OfflineLove2048 } from './components/OfflineLove2048';
import { OfflineDoodle } from './components/OfflineDoodle';
import { CouplesQuiz } from './components/CouplesQuiz';
import { EmojiBattle } from './components/EmojiBattle';
import { OfflineSimonSays } from './components/OfflineSimonSays';
import { OfflineTypingSpeed } from './components/OfflineTypingSpeed';
import { OfflineWordScramble } from './components/OfflineWordScramble';
import { OfflineQuickMath } from './components/OfflineQuickMath';
import { OfflineSpinWheel } from './components/OfflineSpinWheel';
import { OfflineSlidingPuzzle } from './components/OfflineSlidingPuzzle';
import { OfflineBubblePop } from './components/OfflineBubblePop';
import { OfflineColorMatch } from './components/OfflineColorMatch';
import { OfflineFlappyHeart } from './components/OfflineFlappyHeart';
import { OfflineTriviaQuiz } from './components/OfflineTriviaQuiz';
import { TruthOrDare } from './components/TruthOrDare';
import { WouldYouRather } from './components/WouldYouRather';
import { ReactionRace } from './components/ReactionRace';
import { NumberDuel } from './components/NumberDuel';
import { TriviaBattle } from './components/TriviaBattle';
import { OfflineHangman } from './components/OfflineHangman';
import { OfflineFastFacts } from './components/OfflineFastFacts';
import { OfflineLoveCalc } from './components/OfflineLoveCalc';
import { OfflineGuessPrize } from './components/OfflineGuessPrize';
import { OfflineLoveClicker } from './components/OfflineLoveClicker';
import { EmojiTyperace } from './components/EmojiTyperace';
import { HotOrNot } from './components/HotOrNot';
import { FinishSentence } from './components/FinishSentence';
import { CoupleConfessions } from './components/CoupleConfessions';
import { ThisOrThat } from './components/ThisOrThat';
import { Heart, BookOpen, Gamepad2 } from 'lucide-react';
import './App.css';

const MainAppContent: React.FC = () => {
  const { activeGame } = useGamePeer();
  const [hasForgiven, setHasForgiven] = useState(() => {
    return localStorage.getItem('bfgf_forgiven') === 'true';
  });
  const [localGame, setLocalGame] = useState<string | null>(null);

  const handleForgiven = () => {
    setHasForgiven(true);
    localStorage.setItem('bfgf_forgiven', 'true');
  };

  if (!hasForgiven) {
    return <ApologyScreen onForgiven={handleForgiven} />;
  }

  const isPlayingLocal = localGame !== null;
  const isPlayingOnline = activeGame !== null;

  return (
    <div className="app-container">
      {/* Navbar */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
            borderRadius: '10px', padding: '6px', display: 'flex',
          }}>
            <Heart size={18} fill="#fff" color="#fff" />
          </div>
          <span className="font-cute app-title">Ape Punchi Game Room (අපේ පුංචි ගේම් රූම්) 🎮</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {(isPlayingOnline || isPlayingLocal) && (
            <span className="badge-cute" style={{ fontSize: '0.75rem' }}>
              <Gamepad2 size={12} /> Playing
            </span>
          )}
          <button
            onClick={() => {
              localStorage.removeItem('bfgf_forgiven');
              window.location.reload();
            }}
            className="btn-cute btn-cute-secondary app-letter-btn"
          >
            <BookOpen size={14} />
            <span className="btn-label">Read Letter 💌</span>
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '1.5rem 0.75rem' }}>
        {/* Offline games */}
        {isPlayingLocal && localGame === 'offline-word-guess' && <OfflineWordGuess onBack={() => setLocalGame(null)} />}
        {isPlayingLocal && localGame === 'offline-memory' && <OfflineMemoryMatch onBack={() => setLocalGame(null)} />}
        {isPlayingLocal && localGame === 'offline-bonk' && <OfflineBoyfriendBonk onBack={() => setLocalGame(null)} />}
        {isPlayingLocal && localGame === 'offline-cupid' && <OfflineCupidCatch onBack={() => setLocalGame(null)} />}
        {isPlayingLocal && localGame === 'offline-ttt' && <OfflineTicTacToe onBack={() => setLocalGame(null)} />}
        {isPlayingLocal && localGame === 'offline-snake' && <OfflineSnake onBack={() => setLocalGame(null)} />}
        {isPlayingLocal && localGame === 'offline-love2048' && <OfflineLove2048 onBack={() => setLocalGame(null)} />}
        {isPlayingLocal && localGame === 'offline-doodle' && <OfflineDoodle onBack={() => setLocalGame(null)} />}
        {isPlayingLocal && localGame === 'offline-simon' && <OfflineSimonSays onBack={() => setLocalGame(null)} />}
        {isPlayingLocal && localGame === 'offline-typing' && <OfflineTypingSpeed onBack={() => setLocalGame(null)} />}
        {isPlayingLocal && localGame === 'offline-scramble' && <OfflineWordScramble onBack={() => setLocalGame(null)} />}
        {isPlayingLocal && localGame === 'offline-math' && <OfflineQuickMath onBack={() => setLocalGame(null)} />}
        {isPlayingLocal && localGame === 'offline-spin' && <OfflineSpinWheel onBack={() => setLocalGame(null)} />}
        {isPlayingLocal && localGame === 'offline-slide' && <OfflineSlidingPuzzle onBack={() => setLocalGame(null)} />}
        {isPlayingLocal && localGame === 'offline-bubble' && <OfflineBubblePop onBack={() => setLocalGame(null)} />}
        {isPlayingLocal && localGame === 'offline-color' && <OfflineColorMatch onBack={() => setLocalGame(null)} />}
        {isPlayingLocal && localGame === 'offline-flappy' && <OfflineFlappyHeart onBack={() => setLocalGame(null)} />}
        {isPlayingLocal && localGame === 'offline-trivia' && <OfflineTriviaQuiz onBack={() => setLocalGame(null)} />}

        {isPlayingLocal && localGame === 'offline-hangman' && <OfflineHangman onBack={() => setLocalGame(null)} />}
        {isPlayingLocal && localGame === 'offline-fastfacts' && <OfflineFastFacts onBack={() => setLocalGame(null)} />}
        {isPlayingLocal && localGame === 'offline-lovecalc' && <OfflineLoveCalc onBack={() => setLocalGame(null)} />}
        {isPlayingLocal && localGame === 'offline-guessprize' && <OfflineGuessPrize onBack={() => setLocalGame(null)} />}
        {isPlayingLocal && localGame === 'offline-loveclicker' && <OfflineLoveClicker onBack={() => setLocalGame(null)} />}

        {/* Online games */}
        {!isPlayingLocal && !activeGame && <Lobby onSelectLocalGame={setLocalGame} />}
        {!isPlayingLocal && activeGame === 'word-guess' && <WordGuess />}
        {!isPlayingLocal && activeGame === 'cat-catch' && <CatCatch />}
        {!isPlayingLocal && activeGame === 'boyfriend-hit' && <BoyfriendHit />}
        {!isPlayingLocal && activeGame === 'rps' && <RockPaperScissors />}
        {!isPlayingLocal && activeGame === 'couples-quiz' && <CouplesQuiz />}
        {!isPlayingLocal && activeGame === 'emoji-battle' && <EmojiBattle />}
        {!isPlayingLocal && activeGame === 'truth-or-dare' && <TruthOrDare />}
        {!isPlayingLocal && activeGame === 'would-you-rather' && <WouldYouRather />}
        {!isPlayingLocal && activeGame === 'reaction-race' && <ReactionRace />}
        {!isPlayingLocal && activeGame === 'number-duel' && <NumberDuel />}
        {!isPlayingLocal && activeGame === 'trivia-battle' && <TriviaBattle />}
        {!isPlayingLocal && activeGame === 'emoji-typerace' && <EmojiTyperace />}
        {!isPlayingLocal && activeGame === 'hot-or-not' && <HotOrNot />}
        {!isPlayingLocal && activeGame === 'finish-sentence' && <FinishSentence />}
        {!isPlayingLocal && activeGame === 'couple-confessions' && <CoupleConfessions />}
        {!isPlayingLocal && activeGame === 'this-or-that' && <ThisOrThat />}
      </main>

      <footer style={{
        textAlign: 'center', padding: '1rem',
        color: '#a78bfa', fontSize: '0.82rem',
        borderTop: '1px solid #ede9fe',
        background: 'rgba(255,255,255,0.7)',
      }}>
        Made with 💜 love and sorry hugs — just for you
      </footer>
    </div>
  );
};

function App() {
  return (
    <PeerProvider>
      <MainAppContent />
    </PeerProvider>
  );
}

export default App;
