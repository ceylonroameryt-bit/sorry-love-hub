import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw } from 'lucide-react';
import { GameHeader } from './GameHeader';

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
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.winner === undefined)) {
      sendGameAction(INITIAL);
    }
  }, [role, gameState, sendGameAction]);

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

      let nr = row + dr;
      let nc = col + dc;
      while (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === player) {
        count++;
        nr += dr;
        nc += dc;
      }

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

  const dropToken = (col: number) => {
    if (!isMyTurn) return;

    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (state.board[r][col] === null) {
        targetRow = r;
        break;
      }
    }
    if (targetRow === -1) return; // Column is full

    const newBoard = state.board.map(row => [...row]);
    newBoard[targetRow][col] = myColor;

    const isWin = checkWin(newBoard, targetRow, col, myColor);
    const isFull = newBoard.every(row => row.every(cell => cell !== null));

    let newWinner: 'host' | 'guest' | 'draw' | null = null;
    let nextHostScore = state.hostScore;
    let nextGuestScore = state.guestScore;

    if (isWin) {
      newWinner = role as 'host' | 'guest';
      if (role === 'host') nextHostScore += 1;
      else nextGuestScore += 1;
    } else if (isFull) {
      newWinner = 'draw';
    }

    const nextTurn = role === 'host' ? 'guest' : 'host';

    sendGameAction({
      ...state,
      board: newBoard,
      turn: nextTurn,
      winner: newWinner,
      hostScore: nextHostScore,
      guestScore: nextGuestScore,
    });
  };

  const resetBoard = () => {
    sendGameAction({
      ...state,
      board: Array(ROWS).fill(null).map(() => Array(COLS).fill(null)),
      turn: state.turn === 'host' ? 'guest' : 'host',
      winner: null,
    });
  };

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Connect Four"
        emoji="💜💖"
        instructions={[
          "Tap column headers to drop tokens (💜 Host, 💖 Guest) into the 6x7 grid.",
          "Tokens drop down to the lowest open spot in that column.",
          "Connect 4 tokens in a row vertically, horizontally, or diagonally to win!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: isMyTurn ? '#dcfce7' : '#ede9fe', color: isMyTurn ? '#15803d' : '#6d28d9' }}>
            {state.winner ? 'Round Ended' : isMyTurn ? '✨ YOUR TURN' : `⏳ ${opponentName || 'Partner'}'s Turn`}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>Host 💜: {state.hostScore}</span>
            <span style={{ color: '#ec4899' }}>Guest 💖: {state.guestScore}</span>
          </div>
        </div>

        {/* Drop Column Buttons */}
        <div className="game-board-responsive" style={{ height: 'auto', marginBottom: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.3rem' }}>
          {Array.from({ length: COLS }).map((_, cIdx) => (
            <button
              key={cIdx}
              onClick={() => dropToken(cIdx)}
              disabled={!isMyTurn || state.board[0][cIdx] !== null}
              style={{
                padding: '0.4rem 0',
                borderRadius: '10px',
                border: '1.5px solid #c084fc',
                background: '#f3e8ff',
                color: '#6d28d9',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: isMyTurn && state.board[0][cIdx] === null ? 'pointer' : 'default',
                fontFamily: 'var(--font-cute)'
              }}
            >
              ⬇️
            </button>
          ))}
        </div>

        {/* Grid Board */}
        <div className="game-board-responsive" style={{ height: 'auto', background: '#7c3aed', padding: '0.6rem', borderRadius: '20px', display: 'grid', gridTemplateRows: 'repeat(6, 1fr)', gap: '0.4rem', marginBottom: '1.5rem' }}>
          {state.board.map((row, rIdx) => (
            <div key={rIdx} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.4rem' }}>
              {row.map((cell, cIdx) => (
                <div
                  key={cIdx}
                  onClick={() => dropToken(cIdx)}
                  style={{
                    aspectRatio: '1 / 1',
                    background: cell ? '#ffffff' : 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem',
                    cursor: isMyTurn ? 'pointer' : 'default'
                  }}
                >
                  {cell}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Winner Announcement */}
        {state.winner && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.4rem', color: state.winner === 'draw' ? '#ca8a04' : state.winner === role ? '#059669' : '#dc2626', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
              {state.winner === 'draw' ? "It's a Draw!" : state.winner === role ? '🎉 You Connected 4!' : `💔 ${opponentName || 'Partner'} Connected 4!`}
            </h3>
            <button onClick={resetBoard} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem' }}>
              <RefreshCw size={16} /> Play Next Round
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
