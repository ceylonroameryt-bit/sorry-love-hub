import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw } from 'lucide-react';
import { GameHeader } from './GameHeader';

const BOARD_SIZE = 8;

interface ReversiState {
  board: (string | null)[][];
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

const INITIAL: ReversiState = {
  board: createInitialBoard(),
  turn: 'host',
  winner: null,
  phase: 'playing',
  hostScore: 2,
  guestScore: 2,
};

export const ReversiOnline: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INITIAL);
    }
  }, [role, gameState, sendGameAction]);

  const state: ReversiState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const isMyTurn = state.turn === role && state.phase === 'playing';
  const validMoves = isMyTurn ? getValidMoves(state.board, role) : [];

  const handleCellClick = (r: number, c: number) => {
    if (!isMyTurn) return;
    const flippable = getFlippable(state.board, r, c, role);
    if (flippable.length === 0) return;

    const newBoard = state.board.map(row => [...row]);
    newBoard[r][c] = role;
    for (const [fr, fc] of flippable) {
      newBoard[fr][fc] = role;
    }

    let hScore = 0;
    let gScore = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (newBoard[row][col] === 'host') hScore++;
        if (newBoard[row][col] === 'guest') gScore++;
      }
    }

    const nextTurn = role === 'host' ? 'guest' : 'host';
    const nextTurnMoves = getValidMoves(newBoard, nextTurn);
    const myNextMoves = getValidMoves(newBoard, role);

    let phase: 'playing' | 'ended' = 'playing';
    let winner: 'host' | 'guest' | 'draw' | null = null;
    let actualNextTurn = nextTurn;

    if (nextTurnMoves.length === 0 && myNextMoves.length === 0) {
      phase = 'ended';
      if (hScore > gScore) winner = 'host';
      else if (gScore > hScore) winner = 'guest';
      else winner = 'draw';
    } else if (nextTurnMoves.length === 0) {
      actualNextTurn = role; // pass back turn if opponent has no valid moves
    }

    sendGameAction({
      board: newBoard,
      turn: actualNextTurn,
      winner,
      phase,
      hostScore: hScore,
      guestScore: gScore,
    });
  };

  const resetAll = () => sendGameAction(INITIAL);

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Reversi Disc Clash"
        emoji="⬛🟣"
        instructions={[
          "Flank your partner's discs between two of your own color to flip them!",
          "Discs can be trapped horizontally, vertically, or diagonally.",
          "Player with the most discs when no legal moves remain wins!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: isMyTurn ? '#dcfce7' : '#ede9fe', color: isMyTurn ? '#15803d' : '#6d28d9' }}>
            {state.phase === 'ended' ? 'Board Full' : isMyTurn ? '✨ YOUR TURN' : `⏳ ${opponentName || 'Partner'}'s Turn`}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>Host 🟣: {state.hostScore}</span>
            <span style={{ color: '#ec4899' }}>Guest 🌸: {state.guestScore}</span>
          </div>
        </div>

        {/* 8x8 Board Grid */}
        <div className="game-board-responsive" style={{ background: '#059669', padding: '0.5rem', borderRadius: '18px', display: 'grid', gridTemplateRows: 'repeat(8, 1fr)', gap: '0.2rem', marginBottom: '1.5rem' }}>
          {state.board.map((row, rIdx) => (
            <div key={rIdx} style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.2rem' }}>
              {row.map((cell, cIdx) => {
                const isValidMove = validMoves.some(([vr, vc]) => vr === rIdx && vc === cIdx);
                return (
                  <div
                    key={cIdx}
                    onClick={() => handleCellClick(rIdx, cIdx)}
                    style={{
                      aspectRatio: '1 / 1',
                      background: isValidMove ? '#34d399' : '#047857',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isValidMove ? 'pointer' : 'default',
                      border: isValidMove ? '1.5px solid #ffffff' : 'none'
                    }}
                  >
                    {cell === 'host' && (
                      <div style={{ width: '80%', height: '80%', background: '#7c3aed', borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }} />
                    )}
                    {cell === 'guest' && (
                      <div style={{ width: '80%', height: '80%', background: '#ec4899', borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Winner Announcement */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.4rem', color: state.winner === 'draw' ? '#ca8a04' : state.winner === role ? '#059669' : '#dc2626', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
              {state.winner === 'draw' ? "It's a Tie!" : state.winner === role ? '🎉 You Dominated the Board!' : `💔 ${opponentName || 'Partner'} Won!`}
            </h3>
            {role === 'host' && (
              <button onClick={resetAll} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem' }}>
                <RefreshCw size={16} /> Play Again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
