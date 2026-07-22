import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw } from 'lucide-react';
import { GameHeader } from './GameHeader';

const BOARD_SIZE = 8;

type Piece = { player: 'host' | 'guest'; king: boolean } | null;

interface CheckersState {
  board: Piece[][];
  turn: 'host' | 'guest';
  selected: [number, number] | null;
  mustCaptureFrom: [number, number] | null;
  winner: 'host' | 'guest' | null;
  phase: 'playing' | 'ended';
  hostScore: number;
  guestScore: number;
}

function createInitialBoard(): Piece[][] {
  const board: Piece[][] = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if ((r + c) % 2 === 1) {
        if (r < 3) board[r][c] = { player: 'guest', king: false };
        else if (r > 4) board[r][c] = { player: 'host', king: false };
      }
    }
  }
  return board;
}

function getMoves(board: Piece[][], r: number, c: number, mustCapture: boolean): { to: [number, number]; capture: [number, number] | null }[] {
  const piece = board[r][c];
  if (!piece) return [];

  const dirs: [number, number][] = [];
  if (piece.player === 'host' || piece.king) dirs.push([-1, -1], [-1, 1]);
  if (piece.player === 'guest' || piece.king) dirs.push([1, -1], [1, 1]);

  const moves: { to: [number, number]; capture: [number, number] | null }[] = [];
  for (const [dr, dc] of dirs) {
    const nr = r + dr; const nc = c + dc;
    if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
      if (!board[nr][nc] && !mustCapture) {
        moves.push({ to: [nr, nc], capture: null });
      } else if (board[nr][nc] && board[nr][nc]!.player !== piece.player) {
        const jr = r + 2*dr; const jc = c + 2*dc;
        if (jr >= 0 && jr < BOARD_SIZE && jc >= 0 && jc < BOARD_SIZE && !board[jr][jc]) {
          moves.push({ to: [jr, jc], capture: [nr, nc] });
        }
      }
    }
  }
  return moves;
}

function hasAnyCapture(board: Piece[][], player: 'host' | 'guest'): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] && board[r][c]!.player === player) {
        const moves = getMoves(board, r, c, true);
        if (moves.some(m => m.capture !== null)) return true;
      }
    }
  }
  return false;
}

const INITIAL: CheckersState = {
  board: createInitialBoard(),
  turn: 'host',
  selected: null,
  mustCaptureFrom: null,
  winner: null,
  phase: 'playing',
  hostScore: 0,
  guestScore: 0,
};

export const CheckersOnline: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INITIAL);
    }
  }, [role, gameState, sendGameAction]);

  const state: CheckersState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const isMyTurn = state.turn === role && state.phase === 'playing';

  const handleCellClick = (r: number, c: number) => {
    if (!isMyTurn) return;
    const s = stateRef.current;
    const piece = s.board[r][c];

    // Select piece
    if (piece && piece.player === role) {
      sendGameAction({ ...s, selected: [r, c] });
      return;
    }

    // Move to selected cell
    if (s.selected && !piece) {
      const [sr, sc] = s.selected;
      const mustCap = hasAnyCapture(s.board, role);
      const possible = getMoves(s.board, sr, sc, mustCap);
      const move = possible.find(m => m.to[0] === r && m.to[1] === c);

      if (!move) return;

      const newBoard = s.board.map(row => [...row]);
      const activePiece = { ...newBoard[sr][sc]! };

      // King promotion
      if (role === 'host' && r === 0) activePiece.king = true;
      if (role === 'guest' && r === BOARD_SIZE - 1) activePiece.king = true;

      newBoard[r][c] = activePiece;
      newBoard[sr][sc] = null;

      if (move.capture) {
        const [cr, cc] = move.capture;
        newBoard[cr][cc] = null;
      }

      // Check remaining pieces
      let hPieces = 0; let gPieces = 0;
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (newBoard[row][col]?.player === 'host') hPieces++;
          if (newBoard[row][col]?.player === 'guest') gPieces++;
        }
      }

      let winner: 'host' | 'guest' | null = null;
      if (hPieces === 0) winner = 'guest';
      if (gPieces === 0) winner = 'host';

      const nextTurn = role === 'host' ? 'guest' : 'host';
      sendGameAction({
        ...s,
        board: newBoard,
        selected: null,
        turn: winner ? s.turn : nextTurn,
        winner,
        phase: winner ? 'ended' : 'playing',
        hostScore: winner === 'host' ? s.hostScore + 1 : s.hostScore,
        guestScore: winner === 'guest' ? s.guestScore + 1 : s.guestScore,
      });
    }
  };

  const resetAll = () => sendGameAction(INITIAL);

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Checkers Duel"
        emoji="🔴🟣"
        instructions={[
          "Tap your piece to select, then tap a dark square to move diagonally.",
          "Jump diagonally over opponent pieces to capture them!",
          "Reach the opponent's back row to earn King promotion!",
          "Capture all opponent pieces to win!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: isMyTurn ? '#dcfce7' : '#ede9fe', color: isMyTurn ? '#15803d' : '#6d28d9' }}>
            {state.phase === 'ended' ? 'Match Ended' : isMyTurn ? '✨ YOUR TURN' : `⏳ ${opponentName || 'Partner'}'s Turn`}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#dc2626' }}>Host 🔴: {state.hostScore}</span>
            <span style={{ color: '#7c3aed' }}>Guest 🟣: {state.guestScore}</span>
          </div>
        </div>

        {/* 8x8 Board Grid */}
        <div className="game-board-responsive" style={{ background: '#1e1b4b', padding: '0.5rem', borderRadius: '18px', display: 'grid', gridTemplateRows: 'repeat(8, 1fr)', gap: '0.2rem', marginBottom: '1.5rem' }}>
          {state.board.map((row, rIdx) => (
            <div key={rIdx} style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.2rem' }}>
              {row.map((cell, cIdx) => {
                const isDark = (rIdx + cIdx) % 2 === 1;
                const isSelected = state.selected && state.selected[0] === rIdx && state.selected[1] === cIdx;

                return (
                  <div
                    key={cIdx}
                    onClick={() => isDark && handleCellClick(rIdx, cIdx)}
                    style={{
                      aspectRatio: '1 / 1',
                      background: isSelected ? '#fef9c3' : isDark ? '#312e81' : '#e0e7ff',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isDark && isMyTurn ? 'pointer' : 'default'
                    }}
                  >
                    {cell?.player === 'host' && (
                      <div style={{
                        width: '75%', height: '75%', background: '#dc2626', borderRadius: '50%',
                        border: '2px solid #ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#ffffff', fontWeight: 900, fontSize: '0.8rem'
                      }}>
                        {cell.king ? '👑' : ''}
                      </div>
                    )}
                    {cell?.player === 'guest' && (
                      <div style={{
                        width: '75%', height: '75%', background: '#7c3aed', borderRadius: '50%',
                        border: '2px solid #ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#ffffff', fontWeight: 900, fontSize: '0.8rem'
                      }}>
                        {cell.king ? '👑' : ''}
                      </div>
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
            <h3 style={{ fontSize: '1.4rem', color: state.winner === role ? '#059669' : '#dc2626', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
              {state.winner === role ? '🎉 You Captured All Pieces!' : `💔 ${opponentName || 'Partner'} Won!`}
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
