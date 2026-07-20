import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface ConnectState {
  board: (string | null)[][]; // 6 rows x 7 cols
  turn: 'host' | 'guest';
  winner: 'host' | 'guest' | 'draw' | null;
  hostScore: number;
  guestScore: number;
}

const ROWS = 6;
const COLS = 7;

const INITIAL: ConnectState = {
  board: Array(ROWS).fill(null).map(() => Array(COLS).fill(null)),
  turn: 'host',
  winner: null,
  hostScore: 0,
  guestScore: 0,
};

export const ConnectFourOnline: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName, playerName } = useGamePeer();
  const state: ConnectState = gameState ?? INITIAL;
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const isMyTurn = state.turn === role && !state.winner;
  const myColor = role === 'host' ? '💜' : '💖';

  const checkWin = (board: (string | null)[][], row: number, col: number, player: string): boolean => {
    const directions = [
      { r: 0, c: 1 },  // horizontal
      { r: 1, c: 0 },  // vertical
      { r: 1, c: 1 },  // diagonal down-right
      { r: 1, c: -1 }, // diagonal down-left
    ];

    for (const { r: dr, c: dc } of directions) {
      let count = 1;

      // Check positive direction
      let nr = row + dr;
      let nc = col + dc;
      while (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === player) {
        count++;
        nr += dr;
        nc += dc;
      }

      // Check negative direction
      nr = row - dr;
      nc = col - dc;
      while (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === player) {
        count++;
        nr -= dr;
        nc -= dc;
      }

      if (count >= 4) return true;
    }
    return false;
  };

  const checkDraw = (board: (string | null)[][]): boolean => {
    return board[0].every(cell => cell !== null);
  };

  const makeMove = (col: number) => {
    if (!isMyTurn) return;

    // Find the bottommost empty row in the selected column
    let row = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (state.board[r][col] === null) {
        row = r;
        break;
      }
    }

    if (row === -1) return; // Column is full

    const newBoard = state.board.map(r => [...r]);
    newBoard[row][col] = myColor;

    let gameWinner: 'host' | 'guest' | 'draw' | null = null;
    if (checkWin(newBoard, row, col, myColor)) {
      gameWinner = role!;
    } else if (checkDraw(newBoard)) {
      gameWinner = 'draw';
    }

    const nextTurn = state.turn === 'host' ? 'guest' : 'host';
    let nextHostScore = state.hostScore;
    let nextGuestScore = state.guestScore;

    if (gameWinner === 'host') nextHostScore++;
    if (gameWinner === 'guest') nextGuestScore++;

    sendGameAction({
      ...state,
      board: newBoard,
      turn: nextTurn,
      winner: gameWinner,
      hostScore: nextHostScore,
      guestScore: nextGuestScore,
    });
  };

  const resetGame = () => {
    const s = stateRef.current;
    sendGameAction({
      ...INITIAL,
      hostScore: s.hostScore,
      guestScore: s.guestScore,
      turn: s.winner === 'guest' ? 'guest' : 'host',
    });
  };

  const fullReset = () => {
    sendGameAction(INITIAL);
  };

  return (
    <div className="container-cute" style={{ maxWidth: '650px' }}>
      <div className="card-cute" style={{ background: '#fff9fb', border: '1.5px solid #fbcfe8' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Connect Four Online 💜💖</span>
        </div>

        {/* Score Board */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
          background: '#fce7f3', padding: '0.8rem', borderRadius: '15px',
          textAlign: 'center', marginBottom: '1.5rem', border: '2px solid #1e1b4b'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#db2777' }}>{playerName} {role === 'host' ? '(💜)' : '(💖)'}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e1b4b' }}>
              {role === 'host' ? state.hostScore : state.guestScore}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#db2777' }}>{opponentName || 'Partner'} {role === 'host' ? '(💖)' : '(💜)'}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e1b4b' }}>
              {role === 'host' ? state.guestScore : state.hostScore}
            </div>
          </div>
        </div>

        {/* Status */}
        <div style={{ textAlign: 'center', marginBottom: '1rem', height: '2rem' }}>
          {state.winner ? (
            <span className="font-cute" style={{ color: state.winner === 'draw' ? '#4b5563' : '#db2777', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              {state.winner === 'draw' ? "It's a draw! 🤝" : state.winner === role ? 'You won! 🎉🏆' : 'Partner won! 💔'}
            </span>
          ) : (
            <span className="font-cute" style={{ color: isMyTurn ? '#ec4899' : '#db2777', fontSize: '1.1rem' }}>
              {isMyTurn ? 'Your Turn! Drop a token ✨' : `Waiting for ${opponentName || 'partner'}... ⏳`}
            </span>
          )}
        </div>

        {/* Connect 4 Board */}
        <div style={{
          background: '#3b82f6', border: '4px solid #1e1b4b',
          borderRadius: '20px', padding: '15px', maxWidth: '420px',
          margin: '0 auto 1.5rem', boxShadow: '5px 5px 0px #1e1b4b'
        }}>
          {/* Columns selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '10px' }}>
            {Array(COLS).fill(null).map((_, c) => (
              <button
                key={c}
                disabled={!isMyTurn || state.board[0][c] !== null}
                onClick={() => makeMove(c)}
                style={{
                  background: isMyTurn && state.board[0][c] === null ? '#fef08a' : 'transparent',
                  border: isMyTurn && state.board[0][c] === null ? '2px solid #1e1b4b' : 'none',
                  borderRadius: '50%', aspectRatio: '1', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  fontWeight: 900, color: '#1e1b4b', fontSize: '0.8rem'
                }}
              >
                👇
              </button>
            ))}
          </div>

          {/* Grid cells */}
          <div style={{
            display: 'grid', gridTemplateRows: 'repeat(6, 1fr)', gap: '8px',
          }}>
            {state.board.map((row, r) => (
              <div key={r} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                {row.map((cell, c) => (
                  <div
                    key={c}
                    style={{
                      aspectRatio: '1', borderRadius: '50%',
                      backgroundColor: cell === '💜' ? '#c084fc' : cell === '💖' ? '#f472b6' : '#fff',
                      border: '3px solid #1e1b4b',
                      boxShadow: cell !== null ? 'inset 2px 2px 0px rgba(0,0,0,0.1)' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem',
                    }}
                  >
                    {cell ? (cell === '💜' ? '💜' : '💖') : ''}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          {state.winner && (
            <button onClick={resetGame} className="btn-cute btn-cute-primary">
              <RefreshCw size={16} /> Play Again
            </button>
          )}
          <button onClick={fullReset} className="btn-cute btn-cute-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            Reset Score
          </button>
        </div>
      </div>
    </div>
  );
};
