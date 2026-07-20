import React, { useState, useCallback } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';

// ─── Ludo Config ─────────────────────────────────────────────────────────────
// Each player has 4 tokens. Positions: -1 = home yard, 0-55 = track, 56-61 = home stretch, 62 = home

interface Token {
  id: number;       // 0-3
  pos: number;      // -1=yard, 0-55=main track, 56-61=home column, 62=finished
}

interface Player {
  id: 0 | 1;
  name: string;
  color: string;
  lightColor: string;
  emoji: string;
  startPos: number;  // position on main track where they start
  tokens: Token[];
}

// Main track positions (0-55), safe squares
const SAFE_SQUARES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Starting positions on the main track for each player
const START_POS = [0, 26]; // P1 starts at 0, P2 starts at 26

type Phase = 'idle' | 'playing' | 'won';

function initPlayers(): Player[] {
  return [
    {
      id: 0, name: 'Player 1 💜', color: '#7c3aed', lightColor: '#ede9fe', emoji: '💜',
      startPos: START_POS[0],
      tokens: Array.from({ length: 4 }, (_, i) => ({ id: i, pos: -1 })),
    },
    {
      id: 1, name: 'Player 2 🩷', color: '#ec4899', lightColor: '#fce7f3', emoji: '🩷',
      startPos: START_POS[1],
      tokens: Array.from({ length: 4 }, (_, i) => ({ id: i, pos: -1 })),
    },
  ];
}

// Convert token's logical position to board (row, col) for display
// Board is 15x15 with the classic Ludo layout
// For simplicity, we'll render as a styled board with absolute positioning

// Classic Ludo path coords on a 15x15 grid (0-indexed)
// P1 (purple) path:
const P1_PATH: [number, number][] = [
  // Bottom strip going right (rows 6-8, cols 0-5 → col 6 up → col 8 down...)
  [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],
  // Up column
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
  // Top strip going right
  [0,7],[0,8],
  // Down right column
  [1,8],[2,8],[3,8],[4,8],[5,8],
  // Middle strip going right
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  // Down to middle right
  [7,14],[8,14],
  // Left middle right strip
  [8,13],[8,12],[8,11],[8,10],[8,9],
  // Down right
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  // Bottom strip going left
  [14,7],[14,6],
  // Up left
  [13,6],[12,6],[11,6],[10,6],[9,6],
  // Middle left strip
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  // Up to center left
  [7,0],
];

// P1 home column (going toward center)
const P1_HOME: [number, number][] = [
  [7,1],[7,2],[7,3],[7,4],[7,5],[7,6]
];

// P2 (pink) starts at position 26 of P1_PATH
const P2_HOME: [number, number][] = [
  [7,13],[7,12],[7,11],[7,10],[7,9],[7,8]
];

const CENTER: [number, number] = [7, 7];

// Yard positions
const YARD_CELLS: Record<number, [number, number][]> = {
  0: [[1,1],[1,3],[3,1],[3,3]],   // P1 yard top-left
  1: [[11,11],[11,13],[13,11],[13,13]], // P2 yard bottom-right
};

interface Props { onBack: () => void; }

export const OfflineLudo: React.FC<Props> = ({ onBack }) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [players, setPlayers] = useState<Player[]>(initPlayers());
  const [currentPlayer, setCurrentPlayer] = useState<0 | 1>(0);
  const [dice, setDice] = useState<number>(0);
  const [rolled, setRolled] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [message, setMessage] = useState('Roll the dice to start! 🎲');
  const [winner, setWinner] = useState<number | null>(null);
  const CELL_SIZE = 36; // px per board cell


  const getCellCoords = (player: Player, token: Token): [number, number] | null => {
    if (token.pos === -1) {
      const yardIdx = token.id;
      return YARD_CELLS[player.id]?.[yardIdx] ?? null;
    }
    if (token.pos >= 56) {
      const homeIdx = token.pos - 56;
      if (player.id === 0) return P1_HOME[homeIdx] ?? CENTER;
      return P2_HOME[homeIdx] ?? CENTER;
    }
    const absPos = (player.startPos + token.pos) % 56;
    return P1_PATH[absPos] ?? null;
  };

  const rollDice = useCallback(() => {
    if (rolled || rolling) return;
    setRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      setDice(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count >= 10) {
        clearInterval(interval);
        const final = Math.floor(Math.random() * 6) + 1;
        setDice(final);
        setRolling(false);
        setRolled(true);
        const pl = players[currentPlayer];
        // Check if any moves possible
        const canMove = pl.tokens.some(t => {
          if (t.pos === 62) return false;
          if (t.pos === -1 && final === 6) return true;
          if (t.pos >= 0 && t.pos < 56) {
            const newPos = t.pos + final;
            return newPos <= 62;
          }
          if (t.pos >= 56 && t.pos < 62) {
            return t.pos + final <= 62;
          }
          return false;
        });
        if (!canMove) {
          setMessage(`No moves available. Passing turn... 😔`);
          setTimeout(() => nextTurn(final), 1200);
        } else {
          setMessage(`Rolled ${final}! Choose a token to move 🎯`);
        }
      }
    }, 80);
  }, [rolled, rolling, players, currentPlayer]);

  const nextTurn = useCallback((diceVal?: number) => {
    const d = diceVal ?? dice;
    // 6 = extra turn
    if (d !== 6) {
      setCurrentPlayer(prev => (prev === 0 ? 1 : 0));
    }
    setRolled(false);
    setMessage('Roll the dice! 🎲');
  }, [dice]);

  const moveToken = useCallback((playerId: number, tokenId: number) => {
    if (!rolled || rolling) return;
    const pl = players[playerId];
    const token = pl.tokens[tokenId];

    if (token.pos === 62) return; // already home
    if (token.pos === -1 && dice !== 6) {
      setMessage(`Need a 6 to exit the yard! 🏠`);
      return;
    }

    let newPos: number;
    if (token.pos === -1 && dice === 6) {
      newPos = 0; // Exit yard
    } else {
      newPos = token.pos + dice;
      if (newPos > 62) {
        setMessage(`Can't move — would overshoot home! 🏠`);
        return;
      }
    }

    // Check for knock-out
    let knockMessage = '';
    const newAbsPos = newPos < 56 ? (pl.startPos + newPos) % 56 : -1;
    const updatedPlayers = players.map(p => {
      if (p.id === playerId) {
        return { ...p, tokens: p.tokens.map(t => t.id === tokenId ? { ...t, pos: newPos } : t) };
      }
      // Check if opponent token is on the same square (not safe, not home stretch)
      if (newPos < 56 && newAbsPos >= 0 && !SAFE_SQUARES.has(newAbsPos)) {
        return {
          ...p, tokens: p.tokens.map(t => {
            const oppAbsPos = (p.startPos + t.pos) % 56;
            if (t.pos >= 0 && t.pos < 56 && oppAbsPos === newAbsPos) {
              knockMessage = `💥 Knocked out ${p.name}'s token!`;
              return { ...t, pos: -1 };
            }
            return t;
          })
        };
      }
      return p;
    });

    setPlayers(updatedPlayers);

    // Check win
    const movedPlayer = updatedPlayers[playerId];
    if (movedPlayer.tokens.every(t => t.pos === 62)) {
      setWinner(playerId);
      setPhase('won');
      setMessage(`🎉 ${movedPlayer.name} wins!`);
      return;
    }

    if (knockMessage) {
      setMessage(knockMessage);
      setTimeout(() => { nextTurn(); }, 1500);
    } else if (newPos === 62) {
      setMessage(`✨ Token reached home!`);
      setTimeout(() => nextTurn(), 1000);
    } else {
      if (dice === 6) {
        setMessage(`Rolled 6! Extra turn! 🎲`);
        setTimeout(() => { setRolled(false); setMessage('Roll again! 🎲'); }, 1000);
      } else {
        nextTurn();
      }
    }
  }, [rolled, rolling, players, dice, nextTurn]);

  const resetGame = () => {
    setPlayers(initPlayers());
    setCurrentPlayer(0);
    setDice(0);
    setRolled(false);
    setRolling(false);
    setWinner(null);
    setMessage('Roll the dice to start! 🎲');
    setPhase('playing');
  };

  const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  const BoardCell = ({ row, col }: { row: number; col: number }) => {
    const isYardP1 = row >= 0 && row <= 5 && col >= 0 && col <= 5;
    const isYardP2 = row >= 9 && row <= 14 && col >= 9 && col <= 14;
    const isCenter = row >= 6 && row <= 8 && col >= 6 && col <= 8;
    const isSafe = P1_PATH.some((p, i) => p[0] === row && p[1] === col && SAFE_SQUARES.has(i));
    const isP1Home = P1_HOME.some(p => p[0] === row && p[1] === col);
    const isP2Home = P2_HOME.some(p => p[0] === row && p[1] === col);

    let bg = '#fff';
    if (isYardP1) bg = '#ede9fe';
    else if (isYardP2) bg = '#fce7f3';
    else if (isCenter) bg = row === 7 && col === 7 ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : '#f9f9f9';
    else if (isP1Home) bg = '#ddd6fe';
    else if (isP2Home) bg = '#fbcfe8';
    else if (isSafe) bg = '#fef9c3';

    // Find tokens here
    const tokensHere: { emoji: string; color: string; playerId: number; tokenId: number }[] = [];
    players.forEach(pl => {
      pl.tokens.forEach(token => {
        const coords = getCellCoords(pl, token);
        if (coords && coords[0] === row && coords[1] === col) {
          tokensHere.push({ emoji: pl.emoji, color: pl.color, playerId: pl.id, tokenId: token.id });
        }
      });
    });

    const isClickable = tokensHere.some(t => t.playerId === currentPlayer) && rolled && !rolling && phase === 'playing';

    return (
      <div
        onClick={() => {
          if (isClickable && tokensHere.length > 0) {
            const myToken = tokensHere.find(t => t.playerId === currentPlayer);
            if (myToken) moveToken(myToken.playerId, myToken.tokenId);
          }
        }}
        style={{
          width: CELL_SIZE, height: CELL_SIZE, border: '1px solid #e5e7eb',
          background: bg, position: 'relative', display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: isClickable ? 'pointer' : 'default',
          borderRadius: isCenter && row === 7 && col === 7 ? '50%' : '4px',
          transition: 'transform 0.1s',
          transform: isClickable ? 'scale(1.05)' : 'scale(1)',
          boxShadow: isClickable ? '0 0 0 2px #7c3aed' : 'none',
          flexShrink: 0,
        }}
      >
        {isSafe && tokensHere.length === 0 && (
          <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>⭐</span>
        )}
        {tokensHere.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px', justifyContent: 'center', alignItems: 'center' }}>
            {tokensHere.map((t, i) => (
              <span key={i} style={{
                fontSize: tokensHere.length > 2 ? '0.65rem' : '1rem',
                filter: t.playerId === currentPlayer && rolled ? 'drop-shadow(0 0 3px gold)' : 'none',
                animation: t.playerId === currentPlayer && rolled ? 'pulse-gentle 1s infinite' : 'none',
              }}>
                {t.emoji}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container-cute" style={{ maxWidth: '700px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Ludo 🎲</span>
          <button onClick={resetGame} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <RotateCcw size={14} />
          </button>
        </div>

        {phase === 'idle' && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'float 2s ease infinite' }}>🎲</div>
            <h2 className="heading-lg" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Ludo!</h2>
            <p style={{ color: '#6b7280', marginBottom: '0.5rem', lineHeight: 1.7 }}>
              2-player pass-and-play Ludo! 💜 vs 🩷<br />
              Roll 6 to exit the yard. Knock out opponents!<br />
              <span style={{ fontSize: '0.85rem', color: '#a78bfa' }}>⭐ = Safe square · First to get all 4 home wins!</span>
            </p>
            <button onClick={resetGame} className="btn-cute btn-cute-primary" style={{ fontSize: '1.1rem', padding: '0.9rem 2.5rem', marginTop: '1rem' }}>
              Start Game! 🎲
            </button>
          </div>
        )}

        {phase !== 'idle' && (
          <>
            {/* Player indicators */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', justifyContent: 'center' }}>
              {players.map(pl => (
                <div key={pl.id} style={{
                  flex: 1, padding: '0.6rem', borderRadius: '14px', textAlign: 'center',
                  background: currentPlayer === pl.id ? pl.lightColor : '#fff',
                  border: `2px solid ${currentPlayer === pl.id ? pl.color : '#e5e7eb'}`,
                  transition: 'all 0.3s ease',
                  boxShadow: currentPlayer === pl.id ? `0 4px 12px ${pl.color}30` : 'none',
                }}>
                  <div style={{ fontSize: '1.3rem' }}>{pl.emoji}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: pl.color }}>{pl.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                    {pl.tokens.filter(t => t.pos === 62).length}/4 home
                  </div>
                </div>
              ))}
            </div>

            {/* Message */}
            <div style={{
              textAlign: 'center', padding: '0.5rem', background: '#f5f3ff',
              borderRadius: '10px', marginBottom: '0.8rem', fontSize: '0.9rem',
              color: '#4c1d95', fontWeight: 600, minHeight: '2rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {message}
            </div>

            {/* Scrollable board */}
            <div style={{ overflowX: 'auto', marginBottom: '0.8rem', WebkitOverflowScrolling: 'touch' as any }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(15, ${CELL_SIZE}px)`,
                gridTemplateRows: `repeat(15, ${CELL_SIZE}px)`,
                gap: '1px',
                background: '#ddd6fe',
                border: '3px solid #a78bfa',
                borderRadius: '12px',
                overflow: 'hidden',
                width: 'fit-content',
                margin: '0 auto',
              }}>
                {Array.from({ length: 15 }, (_, row) =>
                  Array.from({ length: 15 }, (_, col) => (
                    <BoardCell key={`${row}-${col}`} row={row} col={col} />
                  ))
                )}
              </div>
            </div>

            {/* Token quick-select */}
            {phase === 'playing' && (
              <div style={{ marginBottom: '0.8rem' }}>
                <div style={{ fontSize: '0.78rem', color: '#6b7280', textAlign: 'center', marginBottom: '0.4rem' }}>
                  Tap token on board — or use buttons below:
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {players[currentPlayer].tokens.map(token => (
                    <button
                      key={token.id}
                      onClick={() => moveToken(currentPlayer, token.id)}
                      disabled={!rolled || rolling || token.pos === 62 || (token.pos === -1 && dice !== 6)}
                      className="btn-cute btn-cute-primary"
                      style={{
                        padding: '0.45rem 0.9rem', fontSize: '0.82rem',
                        background: token.pos === 62 ? '#d1fae5' : `linear-gradient(135deg, ${players[currentPlayer].color}, #a78bfa)`,
                        opacity: (!rolled || rolling || token.pos === 62 || (token.pos === -1 && dice !== 6)) ? 0.45 : 1,
                      }}
                    >
                      Token {token.id + 1} {token.pos === -1 ? '🏠' : token.pos === 62 ? '✅' : `(${token.pos})`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dice & Roll */}
            {phase === 'playing' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{
                  fontSize: '3.5rem', width: '72px', height: '72px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#fff', borderRadius: '16px',
                  border: '3px solid #ddd6fe',
                  boxShadow: '0 4px 16px rgba(124,58,237,0.15)',
                  animation: rolling ? 'wiggle 0.1s ease infinite' : dice > 0 ? 'pop-in 0.3s ease' : 'none',
                  flexShrink: 0,
                }}>
                  {dice > 0 ? DICE_FACES[dice] : '🎲'}
                </div>
                <button
                  onClick={rollDice}
                  disabled={rolled || rolling}
                  className="btn-cute btn-cute-primary"
                  style={{
                    fontSize: '1rem', padding: '0.75rem 1.8rem',
                    background: `linear-gradient(135deg, ${players[currentPlayer].color}, #a78bfa)`,
                    opacity: rolled || rolling ? 0.5 : 1,
                  }}
                >
                  {rolling ? 'Rolling...' : rolled ? `Rolled ${dice}!` : '🎲 Roll Dice'}
                </button>
              </div>
            )}

            {/* Win screen */}
            {phase === 'won' && winner !== null && (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', animation: 'pop-in 0.5s ease' }}>
                <div style={{ fontSize: '4rem', marginBottom: '0.5rem', animation: 'float 1.5s ease infinite' }}>🏆</div>
                <h2 className="font-cute" style={{ fontSize: '2rem', color: players[winner].color, margin: '0 0 0.5rem' }}>
                  {players[winner].name} Wins! 🎉
                </h2>
                <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>All 4 tokens made it home!</p>
                <button onClick={resetGame} className="btn-cute btn-cute-primary" style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}>
                  Play Again! 🎲
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
