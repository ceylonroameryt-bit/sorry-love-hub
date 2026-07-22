import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw } from 'lucide-react';
import { GameHeader } from './GameHeader';

interface TTTState {
  board: (string | null)[];
  turn: 'host' | 'guest';
  winner: 'host' | 'guest' | 'draw' | null;
  round: number;
  hostScore: number;
  guestScore: number;
}

const INITIAL: TTTState = {
  board: Array(9).fill(null),
  turn: 'host',
  winner: null,
  round: 1,
  hostScore: 0,
  guestScore: 0,
};

const WIN_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

export const TicTacToeOnline: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.winner === undefined)) {
      sendGameAction(INITIAL);
    }
  }, [role, gameState, sendGameAction]);

  const state: TTTState = gameState ?? INITIAL;
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const isMyTurn = state.turn === role && !state.winner;
  const mySymbol = role === 'host' ? '❌' : '⭕';

  const checkWinner = (board: (string | null)[]): 'host' | 'guest' | 'draw' | null => {
    for (const combo of WIN_COMBOS) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a] === '❌' ? 'host' : 'guest';
      }
    }
    if (board.every(cell => cell !== null)) return 'draw';
    return null;
  };

  const handleCellClick = (idx: number) => {
    if (!isMyTurn || state.board[idx] !== null) return;

    const newBoard = [...state.board];
    newBoard[idx] = mySymbol;

    const gameWinner = checkWinner(newBoard);
    const nextTurn: 'host' | 'guest' = state.turn === 'host' ? 'guest' : 'host';
    let nextHostScore = state.hostScore;
    let nextGuestScore = state.guestScore;

    if (gameWinner === 'host') nextHostScore += 1;
    if (gameWinner === 'guest') nextGuestScore += 1;

    sendGameAction({
      ...state,
      board: newBoard,
      turn: nextTurn,
      winner: gameWinner,
      hostScore: nextHostScore,
      guestScore: nextGuestScore,
    });
  };

  const resetBoard = () => {
    const nextTurn = state.round % 2 === 1 ? 'guest' : 'host';
    sendGameAction({
      ...state,
      board: Array(9).fill(null),
      turn: nextTurn,
      winner: null,
      round: state.round + 1,
    });
  };

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Tic-Tac-Toe"
        emoji="❌⭕"
        instructions={[
          "Take turns placing your symbol (❌ Host, ⭕ Guest) on the grid.",
          "Align 3 of your symbols vertically, horizontally, or diagonally to win.",
          "First to 3 match wins takes the champion title!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: isMyTurn ? '#dcfce7' : '#ede9fe', color: isMyTurn ? '#15803d' : '#6d28d9' }}>
            {state.winner ? 'Round Ended' : isMyTurn ? '✨ YOUR TURN' : `⏳ ${opponentName || 'Partner'}'s Turn`}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>Host ❌: {state.hostScore}</span>
            <span style={{ color: '#ec4899' }}>Guest ⭕: {state.guestScore}</span>
          </div>
        </div>

        {/* 3x3 Responsive Grid */}
        <div className="game-board-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', marginBottom: '1.5rem' }}>
          {state.board.map((cell, idx) => (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              disabled={!isMyTurn || cell !== null}
              style={{
                background: '#ffffff',
                border: '2px solid #ddd6fe',
                borderRadius: '18px',
                fontSize: '2.5rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isMyTurn && cell === null ? 'pointer' : 'default',
                boxShadow: '0 4px 12px rgba(124,58,237,0.06)'
              }}
            >
              {cell}
            </button>
          ))}
        </div>

        {/* Winner Banner / Controls */}
        <div style={{ textAlign: 'center' }}>
          {state.winner && (
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.4rem', color: state.winner === 'draw' ? '#ca8a04' : state.winner === role ? '#059669' : '#dc2626', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
                {state.winner === 'draw' ? "It's a Draw!" : state.winner === role ? '🎉 You Won This Round!' : `💔 ${opponentName || 'Partner'} Won!`}
              </h3>
              <button onClick={resetBoard} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem' }}>
                <RefreshCw size={16} /> Play Next Round
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
