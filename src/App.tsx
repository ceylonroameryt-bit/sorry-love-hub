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
          <span className="font-cute app-title">Sorry & Love Hub 💜</span>
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

        {/* Online games */}
        {!isPlayingLocal && !activeGame && <Lobby onSelectLocalGame={setLocalGame} />}
        {!isPlayingLocal && activeGame === 'word-guess' && <WordGuess />}
        {!isPlayingLocal && activeGame === 'cat-catch' && <CatCatch />}
        {!isPlayingLocal && activeGame === 'boyfriend-hit' && <BoyfriendHit />}
        {!isPlayingLocal && activeGame === 'rps' && <RockPaperScissors />}
        {!isPlayingLocal && activeGame === 'couples-quiz' && <CouplesQuiz />}
        {!isPlayingLocal && activeGame === 'emoji-battle' && <EmojiBattle />}
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
