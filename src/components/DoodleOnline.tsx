import React, { useState, useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw, Trash2, Send } from 'lucide-react';
import { GameHeader } from './GameHeader';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

interface DoodleState {
  phase: 'setup' | 'playing' | 'ended';
  drawer: 'host' | 'guest';
  secretWord: string;
  strokes: Stroke[];
  guesses: { sender: string; text: string; correct: boolean }[];
  hostScore: number;
  guestScore: number;
  round: number;
}

const WORDS = [
  'HEART', 'KITTEN', 'RAINBOW', 'CUPCAKE', 'PUPPY',
  'SUNSHINE', 'UNICORN', 'FLOWERS', 'COFFEE', 'TEDDY',
  'BALLOON', 'DOUGHNUT', 'STAR', 'MOON', 'ICE CREAM'
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const INITIAL: DoodleState = {
  phase: 'setup',
  drawer: 'host',
  secretWord: '',
  strokes: [],
  guesses: [],
  hostScore: 0,
  guestScore: 0,
  round: 1,
};

export const DoodleOnline: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName, playerName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INITIAL);
    }
  }, [role, gameState, sendGameAction]);

  const state: DoodleState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const [localGuess, setLocalGuess] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStrokePoints, setCurrentStrokePoints] = useState<Point[]>([]);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const isDrawer = state.drawer === role;

  const startRound = (word: string) => {
    sendGameAction({
      ...state,
      phase: 'playing',
      secretWord: word,
      strokes: [],
      guesses: [],
    });
  };

  const getPoint = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * 400,
      y: ((clientY - rect.top) / rect.height) * 300,
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || state.phase !== 'playing') return;
    const pt = getPoint(e);
    if (!pt) return;
    setIsDrawing(true);
    setCurrentStrokePoints([pt]);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || !isDrawing || state.phase !== 'playing') return;
    const pt = getPoint(e);
    if (!pt) return;
    setCurrentStrokePoints(prev => [...prev, pt]);
  };

  const handlePointerUp = () => {
    if (!isDrawer || !isDrawing) return;
    setIsDrawing(false);
    if (currentStrokePoints.length > 0) {
      const newStroke: Stroke = {
        points: currentStrokePoints,
        color: '#7c3aed',
        width: 4,
      };
      sendGameAction({
        ...stateRef.current,
        strokes: [...stateRef.current.strokes, newStroke],
      });
    }
    setCurrentStrokePoints([]);
  };

  const handleClearCanvas = () => {
    if (!isDrawer) return;
    sendGameAction({
      ...stateRef.current,
      strokes: [],
    });
  };

  const handleSendGuess = () => {
    if (!localGuess.trim() || isDrawer || state.phase !== 'playing') return;
    const guessText = localGuess.trim().toUpperCase();
    const isCorrect = guessText === state.secretWord;

    const s = stateRef.current;
    const newGuesses = [...s.guesses, { sender: playerName, text: guessText, correct: isCorrect }];

    let nextHostScore = s.hostScore;
    let nextGuestScore = s.guestScore;

    if (isCorrect) {
      if (role === 'host') nextHostScore += 1;
      else nextGuestScore += 1;
    }

    sendGameAction({
      ...s,
      guesses: newGuesses,
      hostScore: nextHostScore,
      guestScore: nextGuestScore,
      phase: isCorrect ? 'ended' : 'playing',
    });
    setLocalGuess('');
  };

  const nextRound = () => {
    const nextDrawer = state.drawer === 'host' ? 'guest' : 'host';
    sendGameAction({
      ...state,
      phase: 'setup',
      drawer: nextDrawer,
      secretWord: '',
      strokes: [],
      guesses: [],
      round: state.round + 1,
    });
  };

  const resetAll = () => sendGameAction(INITIAL);

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Doodle Quiz"
        emoji="🎨"
        instructions={[
          "The Drawer picks a secret word and draws on the canvas.",
          "The Guesser watches live strokes and types guesses into the box.",
          "Guessing the word correctly ends the round and awards points!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: isDrawer ? '#f3e8ff' : '#dcfce7', color: isDrawer ? '#7c3aed' : '#15803d' }}>
            {isDrawer ? '🎨 You are the Drawer!' : `💬 Guessing ${opponentName || 'Partner'}'s drawing...`}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>Host: {state.hostScore}</span>
            <span style={{ color: '#ec4899' }}>Guest: {state.guestScore}</span>
          </div>
        </div>

        {/* SETUP PHASE */}
        {state.phase === 'setup' && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            {isDrawer ? (
              <div>
                <h3 className="heading-lg" style={{ fontSize: '1.3rem', color: '#7c3aed', marginBottom: '1rem' }}>
                  Pick a secret word to draw:
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {shuffle(WORDS).slice(0, 4).map(w => (
                    <button
                      key={w}
                      onClick={() => startRound(w)}
                      className="btn-cute btn-cute-primary"
                      style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                Waiting for {opponentName || 'partner'} to select a secret word... 🎨
              </p>
            )}
          </div>
        )}

        {/* PLAYING OR ENDED PHASE */}
        {(state.phase === 'playing' || state.phase === 'ended') && (
          <div>
            {/* SVG Canvas */}
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <svg
                ref={svgRef}
                viewBox="0 0 400 300"
                className="canvas-responsive"
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
                style={{
                  background: '#ffffff',
                  border: '2px solid #ddd6fe',
                  borderRadius: '18px',
                  width: '100%',
                  height: '240px',
                  touchAction: 'none',
                  cursor: isDrawer ? 'crosshair' : 'default'
                }}
              >
                {state.strokes.map((stroke, i) => (
                  <polyline
                    key={i}
                    points={stroke.points.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke={stroke.color}
                    strokeWidth={stroke.width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
                {currentStrokePoints.length > 0 && (
                  <polyline
                    points={currentStrokePoints.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>

              {isDrawer && state.phase === 'playing' && (
                <button
                  onClick={handleClearCanvas}
                  className="btn-cute btn-cute-secondary"
                  style={{ position: 'absolute', top: '10px', right: '10px', padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
                >
                  <Trash2 size={14} /> Clear
                </button>
              )}
            </div>

            {/* Guesser Input */}
            {!isDrawer && state.phase === 'playing' && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  className="input-cute"
                  placeholder="Type your guess..."
                  value={localGuess}
                  onChange={e => setLocalGuess(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendGuess()}
                  style={{ fontSize: '0.95rem' }}
                />
                <button onClick={handleSendGuess} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1rem' }}>
                  <Send size={16} />
                </button>
              </div>
            )}

            {/* Ended Banner */}
            {state.phase === 'ended' && (
              <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
                <h3 style={{ fontSize: '1.4rem', color: '#059669', fontFamily: 'var(--font-world)', marginBottom: '0.4rem' }}>
                  🎉 Correct! Secret word was: {state.secretWord}
                </h3>
                {role === 'host' && (
                  <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
                    <button onClick={nextRound} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem' }}>
                      <RefreshCw size={16} /> Next Round
                    </button>
                    <button onClick={resetAll} className="btn-cute btn-cute-secondary" style={{ padding: '0.65rem 1rem' }}>
                      Reset Scores
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
