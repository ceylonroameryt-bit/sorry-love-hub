import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw } from 'lucide-react';

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
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export const TicTacToeOnline: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName, playerName } = useGamePeer();
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
      round: s.round + 1,
      turn: s.winner === 'guest' ? 'guest' : 'host',
    });
  };

  const fullReset = () => {
    sendGameAction(INITIAL);
  };

  return (
    <div className="container-cute" style={{ maxWidth: '600px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Tic-Tac-Toe Online ❌⭕</span>
        </div>

        {/* Score Board */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
          background: '#ede9fe', padding: '0.8rem', borderRadius: '15px',
          textAlign: 'center', marginBottom: '1.5rem', border: '2px solid #1e1b4b'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#6d28d9' }}>{playerName} {role === 'host' ? '(❌)' : '(⭕)'}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e1b4b' }}>
              {role === 'host' ? state.hostScore : state.guestScore}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#6d28d9' }}>{opponentName || 'Partner'} {role === 'host' ? '(⭕)' : '(❌)'}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e1b4b' }}>
              {role === 'host' ? state.guestScore : state.hostScore}
            </div>
          </div>
        </div>

        {/* Status Label */}
        <div style={{ textAlign: 'center', marginBottom: '1rem', height: '2rem' }}>
          {state.winner ? (
            <span className="font-cute" style={{ color: state.winner === 'draw' ? '#4b5563' : '#db2777', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              {state.winner === 'draw' ? "It's a draw! 🤝" : state.winner === role ? 'You won! 🎉🏆' : 'Partner won! 💔'}
            </span>
          ) : (
            <span className="font-cute" style={{ color: isMyTurn ? '#7c3aed' : '#9333ea', fontSize: '1.1rem' }}>
              {isMyTurn ? 'Your Turn! Make a move ✨' : `Waiting for ${opponentName || 'partner'}... ⏳`}
            </span>
          )}
        </div>

        {/* 3x3 Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
          maxWidth: '300px', margin: '0 auto 1.5rem'
        }}>
          {state.board.map((cell, idx) => (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              disabled={!isMyTurn || cell !== null}
              style={{
                aspectRatio: '1', fontSize: '2.5rem', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: cell === null ? '#fff' : '#ede9fe',
                border: '3px solid #1e1b4b', borderRadius: '15px',
                boxShadow: cell === null ? '3px 3px 0px #1e1b4b' : 'none',
                cursor: !isMyTurn || cell !== null ? 'default' : 'pointer',
                transform: cell === null && isMyTurn ? 'scale(1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {cell}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          {(state.winner || state.board.every(c => c !== null)) && (
            <button onClick={resetGame} className="btn-cute btn-cute-primary">
              <RefreshCw size={16} /> Next Round
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
