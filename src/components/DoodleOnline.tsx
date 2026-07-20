import React, { useState, useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw, Trash2 } from 'lucide-react';

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
  const { role, sendGameAction, gameState, selectGame, opponentName, playerName } = useGamePeer();
  const state: DoodleState = gameState ?? INITIAL;
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const [localGuess, setLocalGuess] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStrokePoints, setCurrentStrokePoints] = useState<Point[]>([]);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const isDrawer = state.drawer === role;
  const isGuesser = !isDrawer;

  const startRound = () => {
    // Select a random word
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    const nextDrawer = state.round === 1 ? 'host' : (stateRef.current.drawer === 'host' ? 'guest' : 'host');
    
    sendGameAction({
      ...state,
      phase: 'playing',
      drawer: nextDrawer,
      secretWord: randomWord,
      strokes: [],
      guesses: [],
    });
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (!isDrawer || state.phase !== 'playing') return;
    setIsDrawing(true);
    const pt = getSVGCoords(e);
    if (pt) {
      setCurrentStrokePoints([pt]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (!isDrawer || !isDrawing || state.phase !== 'playing') return;
    const pt = getSVGCoords(e);
    if (pt) {
      setCurrentStrokePoints(prev => [...prev, pt]);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawer || !isDrawing || state.phase !== 'playing') return;
    setIsDrawing(false);

    if (currentStrokePoints.length > 0) {
      const newStroke: Stroke = {
        points: currentStrokePoints,
        color: '#7c3aed',
        width: 4
      };

      const updatedStrokes = [...state.strokes, newStroke];
      sendGameAction({
        ...state,
        strokes: updatedStrokes
      });
    }
    setCurrentStrokePoints([]);
  };

  const getSVGCoords = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>): Point | null => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Scale coords to viewBox (0 0 400 300)
    const x = ((clientX - rect.left) / rect.width) * 400;
    const y = ((clientY - rect.top) / rect.height) * 300;
    return { x, y };
  };

  const clearCanvas = () => {
    if (!isDrawer) return;
    sendGameAction({
      ...state,
      strokes: []
    });
  };

  const submitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localGuess.trim() || state.phase !== 'playing' || !isGuesser) return;

    const guessText = localGuess.trim().toUpperCase();
    const isCorrect = guessText === state.secretWord;

    const newGuess = {
      sender: playerName,
      text: guessText,
      correct: isCorrect
    };

    const updatedGuesses = [...state.guesses, newGuess];
    
    let nextState: DoodleState = {
      ...state,
      guesses: updatedGuesses
    };

    if (isCorrect) {
      nextState.phase = 'ended';
      if (role === 'host') {
        nextState.hostScore = state.hostScore + 1;
      } else {
        nextState.guestScore = state.guestScore + 1;
      }
    }

    sendGameAction(nextState);
    setLocalGuess('');
  };

  const nextRound = () => {
    const s = stateRef.current;
    sendGameAction({
      ...s,
      phase: 'setup',
      round: s.round + 1,
    });
  };

  // Convert points to SVG path data string
  const getPathData = (points: Point[]): string => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  };

  return (
    <div className="container-cute" style={{ maxWidth: '650px' }}>
      <div className="card-cute" style={{ background: '#fefcf3', border: '1.5px solid #fef3c7' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Doodle Online 🎨</span>
        </div>

        {/* Scores */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
          background: '#fef3c7', padding: '0.8rem', borderRadius: '15px',
          textAlign: 'center', marginBottom: '1.5rem', border: '2px solid #1e1b4b'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#b45309' }}>{playerName} Score</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e1b4b' }}>
              {role === 'host' ? state.hostScore : state.guestScore}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#b45309' }}>{opponentName || 'Partner'} Score</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e1b4b' }}>
              {role === 'host' ? state.guestScore : state.hostScore}
            </div>
          </div>
        </div>

        {/* Setup Phase */}
        {state.phase === 'setup' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <h2 className="heading-lg" style={{ color: '#d97706' }}>Round {state.round} 🎨</h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              {state.round === 1 ? 'Prepare to draw or guess!' : 'Get ready for the next round!'}
            </p>
            <p style={{ fontWeight: 700, color: '#4c1d95', marginBottom: '1.5rem' }}>
              {isDrawer ? "You will be drawing! ✏️" : `${opponentName || 'Partner'} will be drawing! 🔍`}
            </p>
            <button onClick={startRound} className="btn-cute btn-cute-primary" style={{ padding: '0.8rem 2rem' }}>
              {isDrawer ? "Get Secret Word & Start! ⚡" : "Ready! 👍"}
            </button>
          </div>
        )}

        {/* Playing & Ended Phase */}
        {state.phase !== 'setup' && (
          <div>
            {/* Status bar */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '1rem', background: '#fefaf0', padding: '0.6rem 1rem',
              borderRadius: '12px', border: '1.5px solid #1e1b4b'
            }}>
              <div>
                <span className="font-cute" style={{ color: '#b45309', fontSize: '0.9rem' }}>
                  {isDrawer ? '✏️ You are drawing' : `🔍 Guessing ${opponentName}'s drawing`}
                </span>
              </div>
              {state.phase === 'playing' && isDrawer && (
                <div style={{
                  background: '#f5f3ff', border: '1.5px solid #7c3aed',
                  padding: '3px 8px', borderRadius: '8px', fontSize: '0.85rem'
                }}>
                  Word: <strong style={{ color: '#7c3aed' }}>{state.secretWord}</strong>
                </div>
              )}
            </div>

            {/* Canvas / SVG Area */}
            <div style={{ position: 'relative', width: '100%', border: '3px solid #1e1b4b', borderRadius: '15px', overflow: 'hidden', background: '#fff', boxShadow: '4px 4px 0 #1e1b4b', marginBottom: '1rem' }}>
              <svg
                ref={svgRef}
                viewBox="0 0 400 300"
                style={{ width: '100%', height: '300px', display: 'block', touchAction: 'none', cursor: isDrawer && state.phase === 'playing' ? 'crosshair' : 'default' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
              >
                {/* Drawn strokes */}
                {state.strokes.map((stroke, i) => (
                  <path
                    key={i}
                    d={getPathData(stroke.points)}
                    fill="none"
                    stroke={stroke.color}
                    strokeWidth={stroke.width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}

                {/* Currently active stroke drawing locally */}
                {currentStrokePoints.length > 0 && (
                  <path
                    d={getPathData(currentStrokePoints)}
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>

              {/* Drawer controls */}
              {isDrawer && state.phase === 'playing' && (
                <button
                  onClick={clearCanvas}
                  style={{
                    position: 'absolute', bottom: '10px', right: '10px',
                    background: '#fee2e2', border: '1.5px solid #dc2626',
                    borderRadius: '8px', padding: '4px 8px', display: 'flex',
                    alignItems: 'center', gap: '4px', cursor: 'pointer',
                    color: '#dc2626', fontSize: '0.8rem', fontWeight: 'bold'
                  }}
                >
                  <Trash2 size={13} /> Clear
                </button>
              )}

              {/* Game Winner Overlay */}
              {state.phase === 'ended' && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  alignItems: 'center', textAlign: 'center', padding: '1rem',
                  animation: 'pop-in 0.4s ease'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
                  <h3 className="font-cute" style={{ color: '#059669', fontSize: '1.5rem', margin: '0 0 0.5rem' }}>
                    Guessed Correctly!
                  </h3>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    The secret word was <strong style={{ color: '#7c3aed', fontSize: '1.1rem' }}>{state.secretWord}</strong>
                  </p>
                  <button onClick={nextRound} className="btn-cute btn-cute-primary">
                    <RefreshCw size={15} /> Next Round
                  </button>
                </div>
              )}
            </div>

            {/* Guesses Log & Input */}
            <div style={{ display: 'grid', gridTemplateColumns: isGuesser && state.phase === 'playing' ? '1fr' : '1fr', gap: '10px' }}>
              <div style={{
                background: '#fefaf0', border: '1.5px solid #1e1b4b',
                borderRadius: '12px', padding: '0.8rem', minHeight: '80px', maxHeight: '110px',
                overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse', gap: '4px'
              }}>
                {state.guesses.length === 0 ? (
                  <span style={{ color: '#9ca3af', fontSize: '0.82rem', textAlign: 'center', margin: 'auto' }}>
                    No guesses yet.
                  </span>
                ) : (
                  [...state.guesses].reverse().map((g, idx) => (
                    <div key={idx} style={{
                      fontSize: '0.85rem', color: g.correct ? '#059669' : '#1e1b4b',
                      fontWeight: g.correct ? 'bold' : 'normal'
                    }}>
                      <strong>{g.sender}:</strong> {g.text} {g.correct ? '🏆 Correct!' : ''}
                    </div>
                  ))
                )}
              </div>

              {isGuesser && state.phase === 'playing' && (
                <form onSubmit={submitGuess} style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                  <input
                    className="input-cute"
                    placeholder="Type your guess here..."
                    value={localGuess}
                    onChange={e => setLocalGuess(e.target.value)}
                    style={{ flex: 1, padding: '0.6rem 0.8rem', fontSize: '0.9rem', borderRadius: '10px' }}
                  />
                  <button type="submit" className="btn-cute btn-cute-primary" style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', fontSize: '0.9rem' }}>
                    Submit
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
