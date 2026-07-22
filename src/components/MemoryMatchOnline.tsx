import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw } from 'lucide-react';
import { GameHeader } from './GameHeader';

interface MemoryState {
  cards: string[];
  flipped: number[];
  matched: number[];
  turn: 'host' | 'guest';
  hostScore: number;
  guestScore: number;
  phase: 'init' | 'playing' | 'ended';
}

const EMOJIS = ['🧸', '🐱', '🐶', '🦊', '🐰', '🐼', '🦁', '🐯'];

const INITIAL: MemoryState = {
  cards: [],
  flipped: [],
  matched: [],
  turn: 'host',
  hostScore: 0,
  guestScore: 0,
  phase: 'init',
};

export const MemoryMatchOnline: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();
  const state: MemoryState = gameState ?? INITIAL;
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Host initializes the board
  useEffect(() => {
    if (role === 'host' && (state.phase === 'init' || !state.cards || state.cards.length === 0)) {
      const shuffled = [...EMOJIS, ...EMOJIS]
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);

      sendGameAction({
        ...INITIAL,
        cards: shuffled,
        phase: 'playing',
      });
    }
  }, [role, state.phase, state.cards, sendGameAction]);

  const isMyTurn = state.turn === role && state.phase === 'playing';

  const handleCardClick = (idx: number) => {
    if (!isMyTurn || state.flipped.length >= 2 || state.flipped.includes(idx) || state.matched.includes(idx)) return;

    const newFlipped = [...state.flipped, idx];

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      const isMatch = state.cards[first] === state.cards[second];

      if (isMatch) {
        const newMatched = [...state.matched, first, second];
        const nextHostScore = role === 'host' ? state.hostScore + 1 : state.hostScore;
        const nextGuestScore = role === 'guest' ? state.guestScore + 1 : state.guestScore;
        const isEnded = newMatched.length === state.cards.length;

        sendGameAction({
          ...state,
          flipped: [],
          matched: newMatched,
          hostScore: nextHostScore,
          guestScore: nextGuestScore,
          phase: isEnded ? 'ended' : 'playing',
        });
      } else {
        // Show flipped cards temporarily
        sendGameAction({
          ...state,
          flipped: newFlipped,
        });

        // Delay flip back and switch turn
        setTimeout(() => {
          const s = stateRef.current;
          sendGameAction({
            ...s,
            flipped: [],
            turn: s.turn === 'host' ? 'guest' : 'host',
          });
        }, 1200);
      }
    } else {
      sendGameAction({
        ...state,
        flipped: newFlipped,
      });
    }
  };

  const resetGame = () => {
    const shuffled = [...EMOJIS, ...EMOJIS]
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

    sendGameAction({
      ...INITIAL,
      cards: shuffled,
      phase: 'playing',
      hostScore: state.hostScore,
      guestScore: state.guestScore,
    });
  };

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Memory Match"
        emoji="🃏"
        instructions={[
          "Take turns picking 2 cards from the 4x4 hidden grid.",
          "If the cute emojis match, score 1 point and keep your turn!",
          "If they don't match, cards flip back over and turn passes to partner."
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: isMyTurn ? '#dcfce7' : '#ede9fe', color: isMyTurn ? '#15803d' : '#6d28d9' }}>
            {state.phase === 'ended' ? 'Game Completed' : isMyTurn ? '✨ YOUR TURN' : `⏳ ${opponentName || 'Partner'}'s Turn`}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>Host: {state.hostScore}</span>
            <span style={{ color: '#ec4899' }}>Guest: {state.guestScore}</span>
          </div>
        </div>

        {/* 4x4 Grid */}
        <div className="game-board-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1.5rem' }}>
          {state.cards.map((emoji, idx) => {
            const isFlipped = state.flipped.includes(idx) || state.matched.includes(idx);
            const isMatched = state.matched.includes(idx);

            return (
              <button
                key={idx}
                onClick={() => handleCardClick(idx)}
                disabled={!isMyTurn || isFlipped}
                style={{
                  background: isMatched ? '#dcfce7' : isFlipped ? '#ffffff' : '#f3e8ff',
                  border: isMatched ? '2px solid #22c55e' : isFlipped ? '2px solid #7c3aed' : '1.5px solid #ddd6fe',
                  borderRadius: '16px',
                  fontSize: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isMyTurn && !isFlipped ? 'pointer' : 'default',
                  transition: 'transform 0.2s ease',
                  boxShadow: '0 4px 10px rgba(124,58,237,0.06)'
                }}
              >
                {isFlipped ? emoji : '❓'}
              </button>
            );
          })}
        </div>

        {/* Ended Banner */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.4rem', color: '#7c3aed', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
              🎉 All Pairs Found!
            </h3>
            {role === 'host' && (
              <button onClick={resetGame} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem' }}>
                <RefreshCw size={16} /> Shuffle & Play Again
              </button>
            )}
            {role === 'guest' && (
              <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Waiting for host to restart...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
