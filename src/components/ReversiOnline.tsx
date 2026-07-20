import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw } from 'lucide-react';

// Othello/Reversi Online — 8x8 board, flip opponent discs to win
const BOARD_SIZE = 8;

interface ReversiState {
  board: (string | null)[][];  // null | 'host' | 'guest'
  turn: 'host' | 'guest';
  winner: 'host' | 'guest' | 'draw' | null;
  phase: 'playing' | 'ended';
  hostScore: number;
  guestScore: number;
}

const DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

function createInitialBoard(): (string | null)[][] {
  const board: (string | null)[][] = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  board[3][3] = 'guest';
  board[3][4] = 'host';
  board[4][3] = 'host';
  board[4][4] = 'guest';
  return board;
}

function getFlippable(board: (string | null)[][], row: number, col: number, player: string): [number,number][] {
  if (board[row][col] !== null) return [];
  const opp = player === 'host' ? 'guest' : 'host';
  const toFlip: [number,number][] = [];

  for (const [dr, dc] of DIRS) {
    const line: [number,number][] = [];
    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === opp) {
      line.push([r, c]);
      r += dr;
      c += dc;
    }
    if (line.length > 0 && r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
      toFlip.push(...line);
    }
  }
  return toFlip;
}

function getValidMoves(board: (string | null)[][], player: string): [number,number][] {
  const moves: [number,number][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (getFlippable(board, r, c, player).length > 0) {
        moves.push([r, c]);
      }
    }
  }
  return moves;
}

function countScores(board: (string | null)[][]): { host: number; guest: number } {
  let host = 0; let guest = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell === 'host') host++;
      else if (cell === 'guest') guest++;
    }
  }
  return { host, guest };
}

const INITIAL: ReversiState = {
  board: createInitialBoard(),
  turn: 'host',
  winner: null,
  phase: 'playing',
  hostScore: 0,
  guestScore: 0,
};

export const ReversiOnline: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName, playerName } = useGamePeer();
  const state: ReversiState = gameState ?? INITIAL;
  const stateRef = useRef(state);

  useEffect(() => { stateRef.current = state; }, [state]);

  const isMyTurn = state.turn === role && state.phase === 'playing';
  const myEmoji = role === 'host' ? '💜' : '💖';
  const theirEmoji = role === 'host' ? '💖' : '💜';

  const validMoves = isMyTurn ? getValidMoves(state.board, role!) : [];
  const validSet = new Set(validMoves.map(([r,c]) => `${r},${c}`));

  const handleCellClick = (row: number, col: number) => {
    if (!isMyTurn) return;
    const flippable = getFlippable(state.board, row, col, role!);
    if (flippable.length === 0) return;

    const newBoard = state.board.map(r => [...r]);
    newBoard[row][col] = role;
    for (const [fr, fc] of flippable) {
      newBoard[fr][fc] = role;
    }

    const nextTurn = role === 'host' ? 'guest' : 'host';
    const nextMoves = getValidMoves(newBoard, nextTurn);
    const myNextMoves = getValidMoves(newBoard, role!);
    
    let actualNextTurn = nextTurn;
    let gameEnded = false;
    let winner: 'host' | 'guest' | 'draw' | null = null;

    if (nextMoves.length === 0 && myNextMoves.length === 0) {
      gameEnded = true;
      const endScores = countScores(newBoard);
      winner = endScores.host > endScores.guest ? 'host' : endScores.guest > endScores.host ? 'guest' : 'draw';
    } else if (nextMoves.length === 0) {
      actualNextTurn = role!;
    }

    let nextHostScore = state.hostScore;
    let nextGuestScore = state.guestScore;
    if (gameEnded && winner === 'host') nextHostScore++;
    if (gameEnded && winner === 'guest') nextGuestScore++;

    sendGameAction({
      ...state,
      board: newBoard,
      turn: actualNextTurn,
      winner,
      phase: gameEnded ? 'ended' : 'playing',
      hostScore: nextHostScore,
      guestScore: nextGuestScore,
    });
  };

  const resetGame = () => {
    const s = stateRef.current;
    sendGameAction({
      ...INITIAL,
      board: createInitialBoard(),
      hostScore: s.hostScore,
      guestScore: s.guestScore,
      turn: s.winner === 'guest' ? 'guest' : 'host',
    });
  };

  const fullReset = () => sendGameAction({ ...INITIAL, board: createInitialBoard() });

  const liveScores = countScores(state.board);

  return (
    <div className="container-cute" style={{ maxWidth: '640px' }}>
      <div className="card-cute" style={{ background: '#f8f5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Reversi Online 💜💖</span>
        </div>

        {/* Scores */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center',
          background: '#ede9fe', padding: '0.8rem', borderRadius: '15px',
          textAlign: 'center', marginBottom: '1.5rem', border: '2px solid #1e1b4b'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#6d28d9' }}>{playerName} {myEmoji}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              {role === 'host' ? liveScores.host : liveScores.guest}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Win: {role === 'host' ? state.hostScore : state.guestScore}</div>
          </div>
          <div style={{ fontSize: '1.5rem' }}>⚔️</div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#6d28d9' }}>{opponentName || 'Partner'} {theirEmoji}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              {role === 'host' ? liveScores.guest : liveScores.host}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Win: {role === 'host' ? state.guestScore : state.hostScore}</div>
          </div>
        </div>

        {/* Status */}
        <div style={{ textAlign: 'center', marginBottom: '1rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {state.phase === 'ended' ? (
            <span className="font-cute" style={{ color: '#7c3aed', fontSize: '1.2rem' }}>
              {state.winner === 'draw' ? "It's a draw! 🤝" : state.winner === role ? 'You won! 🎉🏆' : 'Partner won! 💔'}
            </span>
          ) : (
            <span className="font-cute" style={{ color: isMyTurn ? '#7c3aed' : '#a78bfa', fontSize: '1.05rem' }}>
              {isMyTurn
                ? validMoves.length === 0 ? 'No valid moves! Your turn is skipped ⏩' : 'Your turn — click a glowing cell! ✨'
                : `Waiting for ${opponentName || 'partner'}... ⏳`}
            </span>
          )}
        </div>

        {/* Board */}
        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`, gap: '3px',
          background: '#065f46', padding: '10px', borderRadius: '15px',
          border: '4px solid #1e1b4b', boxShadow: '4px 4px 0 #1e1b4b',
          maxWidth: '360px', margin: '0 auto 1.5rem',
        }}>
          {state.board.map((row, r) =>
            row.map((cell, c) => {
              const isValid = validSet.has(`${r},${c}`);
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  disabled={!isValid}
                  style={{
                    aspectRatio: '1', borderRadius: '50%',
                    backgroundColor: cell === 'host' ? '#7c3aed' : cell === 'guest' ? '#ec4899' : isValid ? 'rgba(255,255,255,0.25)' : 'transparent',
                    border: isValid ? '2px solid #fef08a' : cell ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    cursor: isValid ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.1s ease',
                    boxShadow: cell ? 'inset 0 2px 4px rgba(0,0,0,0.3)' : 'none',
                    transform: isValid ? 'scale(1)' : 'scale(0.9)',
                    fontSize: '1.1rem',
                  }}
                >
                  {isValid && !cell ? '⬦' : ''}
                </button>
              );
            })
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          {state.phase === 'ended' && (
            <button onClick={resetGame} className="btn-cute btn-cute-primary">
              <RefreshCw size={15} /> Play Again
            </button>
          )}
          <button onClick={fullReset} className="btn-cute btn-cute-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            Reset Scores
          </button>
        </div>
      </div>
    </div>
  );
};
