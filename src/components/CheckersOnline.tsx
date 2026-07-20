import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw } from 'lucide-react';

// Checkers Online — 8x8 board, diagonal capture
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
      if (board[r][c]?.player === player) {
        if (getMoves(board, r, c, true).some(m => m.capture)) return true;
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
  const { role, sendGameAction, gameState, selectGame, opponentName, playerName } = useGamePeer();
  const state: CheckersState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const isMyTurn = state.turn === role && state.phase === 'playing';

  const handleCellClick = (r: number, c: number) => {
    if (!isMyTurn) return;
    const s = stateRef.current;
    const piece = s.board[r][c];

    // Selecting own piece
    if (piece?.player === role) {
      if (s.mustCaptureFrom && !(s.mustCaptureFrom[0] === r && s.mustCaptureFrom[1] === c)) return;
      sendGameAction({ ...s, selected: [r, c] });
      return;
    }

    // Moving
    if (s.selected) {
      const [sr, sc] = s.selected;
      const mustCapture = hasAnyCapture(s.board, role!);
      const moves = getMoves(s.board, sr, sc, mustCapture);
      const move = moves.find(m => m.to[0] === r && m.to[1] === c);
      if (!move) return;

      const newBoard = s.board.map(row => row.map(cell => cell ? { ...cell } : null));
      const movingPiece = { ...newBoard[sr][sc]! };
      newBoard[sr][sc] = null;
      if (move.capture) newBoard[move.capture[0]][move.capture[1]] = null;

      // Kinging
      const isKing = movingPiece.king || (role === 'host' && r === 0) || (role === 'guest' && r === BOARD_SIZE - 1);
      movingPiece.king = isKing;
      newBoard[r][c] = movingPiece;

      // Check for multi-capture
      let mustCaptureFrom: [number, number] | null = null;
      let nextTurn = role === 'host' ? 'guest' : 'host';
      if (move.capture && !isKing) {
        const chainCaptures = getMoves(newBoard, r, c, true).filter(m => m.capture);
        if (chainCaptures.length > 0) {
          mustCaptureFrom = [r, c];
          nextTurn = role!;
        }
      }

      // Check winner
      const hostPieces = newBoard.flat().filter(p => p?.player === 'host').length;
      const guestPieces = newBoard.flat().filter(p => p?.player === 'guest').length;
      let winner: 'host' | 'guest' | null = null;
      let phase = s.phase;
      let nextHostScore = s.hostScore;
      let nextGuestScore = s.guestScore;

      if (hostPieces === 0) { winner = 'guest'; phase = 'ended'; nextGuestScore++; }
      else if (guestPieces === 0) { winner = 'host'; phase = 'ended'; nextHostScore++; }

      sendGameAction({
        ...s,
        board: newBoard,
        turn: nextTurn,
        selected: mustCaptureFrom,
        mustCaptureFrom,
        winner,
        phase,
        hostScore: nextHostScore,
        guestScore: nextGuestScore,
      });
    }
  };

  const resetGame = () => {
    const s = stateRef.current;
    sendGameAction({ ...INITIAL, board: createInitialBoard(), hostScore: s.hostScore, guestScore: s.guestScore, turn: s.winner === 'guest' ? 'guest' : 'host' });
  };

  const fullReset = () => sendGameAction({ ...INITIAL, board: createInitialBoard() });

  return (
    <div className="container-cute" style={{ maxWidth: '600px' }}>
      <div className="card-cute" style={{ background: '#fff8f0', border: '1.5px solid #fed7aa' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Checkers Online 🔴🟣</span>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
          background: '#fef3c7', padding: '0.8rem', borderRadius: '15px',
          textAlign: 'center', marginBottom: '1.5rem', border: '2px solid #1e1b4b'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#b45309' }}>{playerName} {role === 'host' ? '💜' : '💖'}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{role === 'host' ? state.hostScore : state.guestScore}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#b45309' }}>{opponentName || 'Partner'} {role === 'host' ? '💖' : '💜'}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{role === 'host' ? state.guestScore : state.hostScore}</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {state.phase === 'ended' ? (
            <span className="font-cute" style={{ fontSize: '1.2rem', color: '#dc2626' }}>
              {state.winner === role ? '🏆 You won!' : '💔 Partner won!'}
            </span>
          ) : (
            <span className="font-cute" style={{ fontSize: '1.05rem', color: isMyTurn ? '#d97706' : '#a78bfa' }}>
              {isMyTurn ? (state.selected ? 'Click a destination square!' : 'Select one of your pieces 🎯') : `Waiting for ${opponentName || 'partner'}... ⏳`}
            </span>
          )}
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`, gap: '0px',
          background: '#000', border: '4px solid #1e1b4b', borderRadius: '12px', overflow: 'hidden',
          boxShadow: '4px 4px 0 #1e1b4b', maxWidth: '380px', margin: '0 auto 1.5rem'
        }}>
          {state.board.map((row, r) =>
            row.map((cell, c) => {
              const isDark = (r + c) % 2 === 1;
              const isSelected = state.selected?.[0] === r && state.selected?.[1] === c;
              const isValidDest = state.selected && isMyTurn ? getMoves(
                state.board, state.selected[0], state.selected[1],
                hasAnyCapture(state.board, role!)
              ).some(m => m.to[0] === r && m.to[1] === c) : false;

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  style={{
                    aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isValidDest ? '#fef08a' : isSelected ? '#a7f3d0' : isDark ? '#5f4e3b' : '#f5e6cc',
                    cursor: (isDark && isMyTurn) ? 'pointer' : 'default',
                    position: 'relative',
                  }}
                >
                  {cell && (
                    <div style={{
                      width: '70%', height: '70%', borderRadius: '50%',
                      background: cell.player === 'host' ? 'radial-gradient(circle at 35% 35%, #a78bfa, #7c3aed)' : 'radial-gradient(circle at 35% 35%, #f472b6, #ec4899)',
                      border: `3px solid ${isSelected ? '#10b981' : '#1e1b4b'}`,
                      boxShadow: '2px 2px 4px rgba(0,0,0,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', color: '#fff', fontWeight: 900,
                    }}>
                      {cell.king ? '♛' : ''}
                    </div>
                  )}
                  {isValidDest && !cell && (
                    <div style={{ width: '40%', height: '40%', borderRadius: '50%', background: 'rgba(0,0,0,0.3)' }} />
                  )}
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          {state.phase === 'ended' && <button onClick={resetGame} className="btn-cute btn-cute-primary"><RefreshCw size={15} /> Play Again</button>}
          <button onClick={fullReset} className="btn-cute btn-cute-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>Reset Scores</button>
        </div>
      </div>
    </div>
  );
};
