import React, { useState } from 'react';
import { PeerProvider, useGamePeer } from './utils/peerConnection';
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

// Integrated Games
import { DreamDate } from './components/DreamDate';
import { MoodMirror } from './components/MoodMirror';
import { StarGazing } from './components/StarGazing';
import { TreasureHunt } from './components/TreasureHunt';
import { OfflineLudo } from './components/OfflineLudo';

// New Online Games
import { TicTacToeOnline } from './components/TicTacToeOnline';
import { ConnectFourOnline } from './components/ConnectFourOnline';
import { MemoryMatchOnline } from './components/MemoryMatchOnline';
import { LudoOnline } from './components/LudoOnline';
import { DoodleOnline } from './components/DoodleOnline';
import { BubblePopOnline } from './components/BubblePopOnline';
import { HeartTapDuelOnline } from './components/HeartTapDuelOnline';
import { SimonSaysOnline } from './components/SimonSaysOnline';
import { ReactionTapOnline } from './components/ReactionTapOnline';
import { SnakeDuelOnline } from './components/SnakeDuelOnline';

// Online Games Batch 2
import { ReversiOnline } from './components/ReversiOnline';
import { CheckersOnline } from './components/CheckersOnline';
import { BattleshipOnline } from './components/BattleshipOnline';
import { WordChainOnline } from './components/WordChainOnline';
import { PianoTilesOnline } from './components/PianoTilesOnline';
import { ColorClashOnline } from './components/ColorClashOnline';
import { BlockStackerOnline } from './components/BlockStackerOnline';
import { ArcheryOnline } from './components/ArcheryOnline';
import { MinesweeperDuelOnline } from './components/MinesweeperDuelOnline';
import { EmojiSprintOnline } from './components/EmojiSprintOnline';

import { TaylorMusicWidget } from './components/TaylorMusicWidget';
import { triggerHaptic } from './utils/haptics';
import { playSound, triggerVibration } from './utils/effects';
import { Heart, Gamepad2 } from 'lucide-react';
import './App.css';

const MainAppContent: React.FC = () => {
  const { activeGame } = useGamePeer();
  const [localGame, setLocalGame] = useState<string | null>(null);

  // Global click interceptor for arcade sound and tactile haptic feedback
  React.useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;
      let depth = 0;
      while (target && depth < 5) {
        const isClickable = 
          target.tagName === 'BUTTON' || 
          target.tagName === 'A' || 
          target.classList.contains('btn-cute') || 
          target.classList.contains('card-game') || 
          target.classList.contains('carnival-booth') ||
          target.classList.contains('alpha-key') ||
          target.getAttribute('role') === 'button';

        if (isClickable) {
          playSound('click');
          triggerVibration(20);
          triggerHaptic('light');
          break;
        }
        target = target.parentElement;
        depth++;
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const isPlayingLocal = localGame !== null;
  const isPlayingOnline = activeGame !== null;

  return (
    <div className="app-container">
      {/* Navbar */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '10px', padding: '6px', display: 'flex',
            border: '2px solid rgba(255,255,255,0.4)',
          }}>
            <Heart size={18} fill="#fff" color="#fff" style={{ animation: 'wiggle 1s ease infinite' }} />
          </div>
          <div>
            <div className="app-title">Ape Punchi Game Room 🎡</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-cute)', lineHeight: 1 }}>අපේ පුංචි ගේම් රූම්</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {(isPlayingOnline || isPlayingLocal) && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)',
              borderRadius: '50px', padding: '0.25rem 0.8rem',
              fontFamily: 'var(--font-cute)', fontSize: '0.8rem', color: '#fff', fontWeight: 700,
            }}>
              <Gamepad2 size={12} /> Playing
            </span>
          )}
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
        {isPlayingLocal && localGame === 'offline-ludo' && <OfflineLudo onBack={() => setLocalGame(null)} />}

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
        
        {/* Integrated Games */}
        {!isPlayingLocal && activeGame === 'dream-date' && <DreamDate />}
        {!isPlayingLocal && activeGame === 'mood-mirror' && <MoodMirror />}
        {!isPlayingLocal && activeGame === 'star-gazing' && <StarGazing />}
        {!isPlayingLocal && activeGame === 'treasure-hunt' && <TreasureHunt />}

        {/* New Online Games */}
        {!isPlayingLocal && activeGame === 'ttt-online' && <TicTacToeOnline />}
        {!isPlayingLocal && activeGame === 'connect4-online' && <ConnectFourOnline />}
        {!isPlayingLocal && activeGame === 'memory-online' && <MemoryMatchOnline />}
        {!isPlayingLocal && activeGame === 'ludo-online' && <LudoOnline />}
        {!isPlayingLocal && activeGame === 'doodle-online' && <DoodleOnline />}
        {!isPlayingLocal && activeGame === 'bubble-online' && <BubblePopOnline />}
        {!isPlayingLocal && activeGame === 'heart-tap-online' && <HeartTapDuelOnline />}
        {!isPlayingLocal && activeGame === 'simon-online' && <SimonSaysOnline />}
        {!isPlayingLocal && activeGame === 'reaction-online' && <ReactionTapOnline />}
        {!isPlayingLocal && activeGame === 'snake-online' && <SnakeDuelOnline />}

        {/* Online Games Batch 2 */}
        {!isPlayingLocal && activeGame === 'reversi-online' && <ReversiOnline />}
        {!isPlayingLocal && activeGame === 'checkers-online' && <CheckersOnline />}
        {!isPlayingLocal && activeGame === 'battleship-online' && <BattleshipOnline />}
        {!isPlayingLocal && activeGame === 'word-chain-online' && <WordChainOnline />}
        {!isPlayingLocal && activeGame === 'piano-tiles-online' && <PianoTilesOnline />}
        {!isPlayingLocal && activeGame === 'color-clash-online' && <ColorClashOnline />}
        {!isPlayingLocal && activeGame === 'block-stacker-online' && <BlockStackerOnline />}
        {!isPlayingLocal && activeGame === 'archery-online' && <ArcheryOnline />}
        {!isPlayingLocal && activeGame === 'minesweeper-online' && <MinesweeperDuelOnline />}
        {!isPlayingLocal && activeGame === 'emoji-sprint-online' && <EmojiSprintOnline />}
      </main>

      {/* Taylor Swift Dynamic Island Floating Music Widget */}
      <TaylorMusicWidget />

      <footer style={{
        textAlign: 'center', padding: '1rem',
        color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(15, 10, 30, 0.75)',
        backdropFilter: 'blur(16px)',
        fontFamily: 'var(--font-cute)',
      }}>
        Made with 💖 love, Taylor Swift tunes & mobile haptics • Ape Punchi Game Room 🎡
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
