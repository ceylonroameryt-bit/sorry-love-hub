import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RotateCcw } from 'lucide-react';

// ─── Ludo Config ─────────────────────────────────────────────────────────────
const BOARD_SIZE = 15;
const CELL_SIZE = 34; // px per board cell

interface Token {
  id: number;
  pos: number; // -1=yard, 0-55=main track, 56-61=home column, 62=finished
}

interface Player {
  id: 0 | 1;
  name: string;
  color: string;
  lightColor: string;
  emoji: string;
  startPos: number;
  tokens: Token[];
}

const SAFE_SQUARES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
const START_POS = [0, 26];

const P1_PATH: [number, number][] = [
  [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
  [0,7],[0,8],
  [1,8],[2,8],[3,8],[4,8],[5,8],
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  [7,14],[8,14],
  [8,13],[8,12],[8,11],[8,10],[8,9],
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  [14,7],[14,6],
  [13,6],[12,6],[11,6],[10,6],[9,6],
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  [7,0],
];

const P1_HOME: [number, number][] = [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]];
const P2_HOME: [number, number][] = [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]];

const YARD_CELLS: Record<number, [number, number][]> = {
  0: [[1,1],[1,3],[3,1],[3,3]],
  1: [[11,11],[11,13],[13,11],[13,13]],
};

interface LudoState {
  phase: 'idle' | 'playing' | 'won';
  players: Player[];
  currentPlayer: 0 | 1;
  dice: number;
  rolled: boolean;
  rolling: boolean;
  message: string;
  winner: number | null;
}

function initPlayers(hostName: string, guestName: string): Player[] {
  return [
    {
      id: 0, name: `${hostName || 'Host'} 💜`, color: '#7c3aed', lightColor: '#ede9fe', emoji: '💜',
      startPos: START_POS[0],
      tokens: Array.from({ length: 4 }, (_, i) => ({ id: i, pos: -1 })),
    },
    {
      id: 1, name: `${guestName || 'Guest'} 🩷`, color: '#ec4899', lightColor: '#fce7f3', emoji: '🩷',
      startPos: START_POS[1],
      tokens: Array.from({ length: 4 }, (_, i) => ({ id: i, pos: -1 })),
    },
  ];
}

const INITIAL = (hostName: string, guestName: string): LudoState => ({
  phase: 'idle',
  players: initPlayers(hostName, guestName),
  currentPlayer: 0,
  dice: 0,
  rolled: false,
  rolling: false,
  message: 'Roll the dice to start! 🎲',
  winner: null,
});

export const LudoOnline: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName, playerName } = useGamePeer();
  
  const hostName = role === 'host' ? playerName : opponentName;
  const guestName = role === 'host' ? opponentName : playerName;
  
  const state: LudoState = gameState ?? INITIAL(hostName, guestName);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const activePlayerIdx = state.currentPlayer;
  const activeRole = activePlayerIdx === 0 ? 'host' : 'guest';
  const isMyTurn = role === activeRole && state.phase === 'playing';

  const getCellCoords = (player: Player, token: Token): [number, number] | null => {
    if (token.pos === -1) {
      return YARD_CELLS[player.id]?.[token.id] ?? null;
    }
    if (token.pos >= 56) {
      const homeIdx = token.pos - 56;
      return player.id === 0 ? P1_HOME[homeIdx] : P2_HOME[homeIdx];
    }
    const absPos = (player.startPos + token.pos) % 56;
    return P1_PATH[absPos] ?? null;
  };

  const nextTurn = (s: LudoState, diceVal: number) => {
    let nextPlayer = s.currentPlayer;
    if (diceVal !== 6) {
      nextPlayer = s.currentPlayer === 0 ? 1 : 0;
    }
    const activePl = s.players[nextPlayer];
    sendGameAction({
      ...s,
      currentPlayer: nextPlayer,
      rolled: false,
      dice: 0,
      message: `${activePl.name}'s turn! Roll the dice 🎲`,
    });
  };

  const rollDice = () => {
    if (!isMyTurn || state.rolled || state.rolling) return;

    // First broadcast that we are rolling
    sendGameAction({
      ...state,
      rolling: true,
      message: `${role === 'host' ? hostName : guestName} is rolling... 🎲`,
    });

    // Sim roll locally, then update
    setTimeout(() => {
      const finalVal = Math.floor(Math.random() * 6) + 1;
      const s = stateRef.current;
      const pl = s.players[s.currentPlayer];

      // Check if any moves possible
      const canMove = pl.tokens.some(t => {
        if (t.pos === 62) return false;
        if (t.pos === -1 && finalVal === 6) return true;
        if (t.pos >= 0 && t.pos < 56) {
          const newPos = t.pos + finalVal;
          return newPos <= 62;
        }
        if (t.pos >= 56 && t.pos < 62) {
          return t.pos + finalVal <= 62;
        }
        return false;
      });

      const nextState: LudoState = {
        ...s,
        rolling: false,
        rolled: true,
        dice: finalVal,
      };

      if (!canMove) {
        nextState.message = `Rolled ${finalVal}! No moves possible. Passing turn... 😔`;
        sendGameAction(nextState);
        setTimeout(() => {
          nextTurn(stateRef.current, finalVal);
        }, 1500);
      } else {
        nextState.message = `Rolled ${finalVal}! Select a token to move 🎯`;
        sendGameAction(nextState);
      }
    }, 800);
  };

  const moveToken = (tokenId: number) => {
    if (!isMyTurn || !state.rolled || state.rolling) return;

    const s = stateRef.current;
    const pl = s.players[s.currentPlayer];
    const token = pl.tokens[tokenId];

    if (token.pos === 62) return;
    if (token.pos === -1 && s.dice !== 6) {
      return;
    }

    let newPos: number;
    if (token.pos === -1 && s.dice === 6) {
      newPos = 0; // exit yard
    } else {
      newPos = token.pos + s.dice;
      if (newPos > 62) return; // overshoot
    }

    // Check for knockouts
    let knockMessage = '';
    const newAbsPos = newPos < 56 ? (pl.startPos + newPos) % 56 : -1;
    const updatedPlayers = s.players.map(p => {
      if (p.id === s.currentPlayer) {
        return {
          ...p,
          tokens: p.tokens.map(t => t.id === tokenId ? { ...t, pos: newPos } : t)
        };
      }
      if (newPos < 56 && newAbsPos >= 0 && !SAFE_SQUARES.has(newAbsPos)) {
        return {
          ...p,
          tokens: p.tokens.map(t => {
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

    const movedPlayer = updatedPlayers[s.currentPlayer];
    const hasWon = movedPlayer.tokens.every(t => t.pos === 62);

    const nextState: LudoState = {
      ...s,
      players: updatedPlayers,
    };

    if (hasWon) {
      nextState.winner = s.currentPlayer;
      nextState.phase = 'won';
      nextState.message = `🎉 ${movedPlayer.name} wins the Ludo game! 🏆`;
      sendGameAction(nextState);
      return;
    }

    if (knockMessage) {
      nextState.message = knockMessage;
      sendGameAction(nextState);
      setTimeout(() => {
        nextTurn(stateRef.current, s.dice);
      }, 1500);
    } else if (newPos === 62) {
      nextState.message = `✨ Token reached home!`;
      sendGameAction(nextState);
      setTimeout(() => {
        nextTurn(stateRef.current, s.dice);
      }, 1200);
    } else {
      if (s.dice === 6) {
        nextState.message = `Rolled 6! Extra roll! 🎲`;
        nextState.rolled = false;
        nextState.dice = 0;
        sendGameAction(nextState);
      } else {
        nextTurn(nextState, s.dice);
      }
    }
  };

  const startGame = () => {
    sendGameAction({
      ...INITIAL(hostName, guestName),
      phase: 'playing',
    });
  };

  const resetGame = () => {
    sendGameAction(INITIAL(hostName, guestName));
  };

  const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  return (
    <div className="container-cute" style={{ maxWidth: '720px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Ludo Online 🎲</span>
          {state.phase !== 'idle' && (
            <button onClick={resetGame} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
              <RotateCcw size={14} />
            </button>
          )}
        </div>

        {state.phase === 'idle' && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'float 2s ease infinite' }}>🎲</div>
            <h2 className="heading-lg" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Ludo Online!</h2>
            <p style={{ color: '#6b7280', marginBottom: '0.5rem', lineHeight: 1.7 }}>
              Play turn-based online Ludo with your partner! 💜 vs 🩷<br />
              Roll 6 to exit the yard. Knock out opponents!<br />
              <span style={{ fontSize: '0.85rem', color: '#a78bfa' }}>⭐ = Safe square · First to get all 4 home wins!</span>
            </p>
            <button onClick={startGame} className="btn-cute btn-cute-primary" style={{ fontSize: '1.1rem', padding: '0.9rem 2.5rem', marginTop: '1rem' }}>
              Start Match! 🎲
            </button>
          </div>
        )}

        {state.phase !== 'idle' && (
          <>
            {/* Player indicators */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', justifyContent: 'center' }}>
              {state.players.map(pl => (
                <div key={pl.id} style={{
                  flex: 1, padding: '0.6rem', borderRadius: '14px', textAlign: 'center',
                  background: activePlayerIdx === pl.id ? pl.lightColor : '#fff',
                  border: `2px solid ${activePlayerIdx === pl.id ? pl.color : '#e5e7eb'}`,
                  transition: 'all 0.3s ease',
                  boxShadow: activePlayerIdx === pl.id ? `0 4px 12px ${pl.color}30` : 'none',
                }}>
                  <div style={{ fontSize: '1.3rem' }}>{pl.emoji}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: pl.color }}>
                    {pl.id === 0 ? hostName : guestName} {pl.id === 0 ? '💜' : '🩷'}
                  </div>
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
              {state.message}
            </div>

            {/* Scrollable Board Wrapper */}
            <div style={{ overflowX: 'auto', marginBottom: '0.8rem', WebkitOverflowScrolling: 'touch' as any, border: '3px solid #1e1b4b', borderRadius: '12px', padding: '5px', background: '#fff' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
                gridTemplateRows: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
                gap: '1px', width: BOARD_SIZE * CELL_SIZE + 15, margin: '0 auto'
              }}>
                {Array.from({ length: BOARD_SIZE }).map((_, r) =>
                  Array.from({ length: BOARD_SIZE }).map((_, c) => {
                    const isYardP1 = r >= 0 && r <= 5 && c >= 0 && c <= 5;
                    const isYardP2 = r >= 9 && r <= 14 && c >= 9 && c <= 14;
                    const isCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;
                    const isSafe = P1_PATH.some((p, i) => p[0] === r && p[1] === c && SAFE_SQUARES.has(i));
                    const isP1Home = P1_HOME.some(p => p[0] === r && p[1] === c);
                    const isP2Home = P2_HOME.some(p => p[0] === r && p[1] === c);

                    let bg = '#fff';
                    if (isYardP1) bg = '#ede9fe';
                    else if (isYardP2) bg = '#fce7f3';
                    else if (isCenter) bg = r === 7 && c === 7 ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : '#f9f9f9';
                    else if (isP1Home) bg = '#ddd6fe';
                    else if (isP2Home) bg = '#fbcfe8';
                    else if (isSafe) bg = '#fef9c3';

                    // Find tokens here
                    const tokensHere: { emoji: string; color: string; playerId: number; tokenId: number }[] = [];
                    state.players.forEach(pl => {
                      pl.tokens.forEach(token => {
                        const coords = getCellCoords(pl, token);
                        if (coords && coords[0] === r && coords[1] === c) {
                          tokensHere.push({ emoji: pl.emoji, color: pl.color, playerId: pl.id, tokenId: token.id });
                        }
                      });
                    });

                    const isClickable = tokensHere.some(t => t.playerId === activePlayerIdx) && state.rolled && !state.rolling && isMyTurn;

                    return (
                      <div
                        key={`${r}-${c}`}
                        onClick={() => {
                          if (isClickable && tokensHere.length > 0) {
                            const myToken = tokensHere.find(t => t.playerId === activePlayerIdx);
                            if (myToken) moveToken(myToken.tokenId);
                          }
                        }}
                        style={{
                          width: CELL_SIZE, height: CELL_SIZE, border: '1px solid #f3f4f6',
                          background: bg, position: 'relative', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', cursor: isClickable ? 'pointer' : 'default',
                          borderRadius: isCenter && r === 7 && c === 7 ? '50%' : '2px',
                          transform: isClickable ? 'scale(1.04)' : 'none',
                          boxShadow: isClickable ? '0 0 0 2px #7c3aed' : 'none',
                          flexShrink: 0,
                          zIndex: isClickable ? 10 : 1,
                        }}
                      >
                        {isSafe && tokensHere.length === 0 && (
                          <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>⭐</span>
                        )}
                        {tokensHere.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px', justifyContent: 'center', alignItems: 'center' }}>
                            {tokensHere.map((t, i) => (
                              <span key={i} style={{
                                fontSize: tokensHere.length > 2 ? '0.6rem' : '0.9rem',
                                filter: t.playerId === activePlayerIdx && state.rolled && isMyTurn ? 'drop-shadow(0 0 3px gold)' : 'none',
                                animation: t.playerId === activePlayerIdx && state.rolled && isMyTurn ? 'pulse-gentle 1s infinite' : 'none',
                              }}>
                                {t.emoji}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Dice Section */}
            {state.phase === 'playing' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    fontSize: '3rem', width: '70px', height: '70px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '3px solid #1e1b4b', borderRadius: '15px',
                    background: '#fff', boxShadow: '3px 3px 0 #1e1b4b',
                    animation: state.rolling ? 'wiggle 0.15s infinite' : 'none',
                  }}>
                    {DICE_FACES[state.dice] || '🎲'}
                  </div>

                  {isMyTurn && !state.rolled && !state.rolling && (
                    <button onClick={rollDice} className="btn-cute btn-cute-primary" style={{ padding: '0.8rem 1.8rem' }}>
                      Roll! 🎲
                    </button>
                  )}

                  {!isMyTurn && (
                    <span style={{ fontSize: '0.88rem', color: '#6b7280' }}>
                      Waiting for partner to roll...
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
