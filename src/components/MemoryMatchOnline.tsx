import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface MemoryState {
  cards: string[]; // 16 shuffled emojis
  flipped: number[]; // currently flipped indices (max 2)
  matched: number[]; // matched indices
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
  const { role, sendGameAction, gameState, selectGame, opponentName, playerName } = useGamePeer();
  const state: MemoryState = gameState ?? INITIAL;
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Host initializes the board
  useEffect(() => {
    if (role === 'host' && state.phase === 'init') {
      // Shuffle emojis
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
  }, [role, state.phase, sendGameAction]);

  const isMyTurn = state.turn === role && state.phase === 'playing';
  const showNextTurnButton = isMyTurn && state.flipped.length === 2 && 
    state.cards[state.flipped[0]] !== state.cards[state.flipped[1]];

  const handleCardClick = (idx: number) => {
    if (!isMyTurn || state.flipped.length >= 2 || state.flipped.includes(idx) || state.matched.includes(idx)) return;

    const newFlipped = [...state.flipped, idx];

    if (newFlipped.length === 1) {
      sendGameAction({
        ...state,
        flipped: newFlipped,
      });
    } else if (newFlipped.length === 2) {
      const idx1 = newFlipped[0];
      const idx2 = newFlipped[1];
      const isMatch = state.cards[idx1] === state.cards[idx2];

      if (isMatch) {
        const newMatched = [...state.matched, idx1, idx2];
        const isGameEnded = newMatched.length === state.cards.length;
        
        let nextHostScore = state.hostScore;
        let nextGuestScore = state.guestScore;
        if (role === 'host') nextHostScore++;
        else nextGuestScore++;

        sendGameAction({
          ...state,
          flipped: [],
          matched: newMatched,
          hostScore: nextHostScore,
          guestScore: nextGuestScore,
          phase: isGameEnded ? 'ended' : 'playing',
        });
      } else {
        // Mismatch: keep them flipped so both can see. Turn stays current, but player must click "Pass Turn" to reset
        sendGameAction({
          ...state,
          flipped: newFlipped,
        });
      }
    }
  };

  const handlePassTurn = () => {
    if (!isMyTurn || state.flipped.length !== 2) return;
    
    const nextTurn = state.turn === 'host' ? 'guest' : 'host';
    sendGameAction({
      ...state,
      flipped: [],
      turn: nextTurn,
    });
  };

  const restartGame = () => {
    // Only host shuffles and resets
    if (role === 'host') {
      const shuffled = [...EMOJIS, ...EMOJIS]
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);

      sendGameAction({
        ...INITIAL,
        cards: shuffled,
        phase: 'playing',
        turn: stateRef.current.turn === 'host' ? 'guest' : 'host',
      });
    } else {
      // Guest resets back to init, triggering the host's useEffect
      sendGameAction(INITIAL);
    }
  };

  return (
    <div className="container-cute" style={{ maxWidth: '650px' }}>
      <div className="card-cute" style={{ background: '#f5fbf7', border: '1.5px solid #a7f3d0' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Memory Match Online 🃏</span>
        </div>

        {/* Scores */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
          background: '#d1fae5', padding: '0.8rem', borderRadius: '15px',
          textAlign: 'center', marginBottom: '1.5rem', border: '2px solid #1e1b4b'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#059669' }}>{playerName} Score</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e1b4b' }}>
              {role === 'host' ? state.hostScore : state.guestScore}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#059669' }}>{opponentName || 'Partner'} Score</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e1b4b' }}>
              {role === 'host' ? state.guestScore : state.hostScore}
            </div>
          </div>
        </div>

        {/* Turn Status */}
        <div style={{ textAlign: 'center', marginBottom: '1rem', height: '2.5rem' }}>
          {state.phase === 'ended' ? (
            <span className="font-cute" style={{ color: '#059669', fontSize: '1.2rem' }}>
              Game Over! {state.hostScore === state.guestScore ? "It's a tie! 🤝" : state.hostScore > state.guestScore ? (role === 'host' ? 'You won! 🎉' : 'Partner won! 💔') : (role === 'guest' ? 'You won! 🎉' : 'Partner won! 💔')}
            </span>
          ) : showNextTurnButton ? (
            <button onClick={handlePassTurn} className="btn-cute btn-cute-primary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}>
              No Match! Click to Pass Turn 👉
            </button>
          ) : (
            <span className="font-cute" style={{ color: isMyTurn ? '#059669' : '#10b981', fontSize: '1.1rem' }}>
              {isMyTurn ? 'Your Turn! Flip two cards ✨' : `Waiting for ${opponentName || 'partner'}... ⏳`}
            </span>
          )}
        </div>

        {/* 4x4 Cards Grid */}
        {state.cards.length > 0 ? (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px',
            maxWidth: '360px', margin: '0 auto 1.5rem'
          }}>
            {state.cards.map((emoji, idx) => {
              const isOpen = state.flipped.includes(idx) || state.matched.includes(idx);
              const isMatched = state.matched.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleCardClick(idx)}
                  disabled={!isMyTurn || isOpen}
                  style={{
                    aspectRatio: '1', fontSize: '2rem', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isOpen ? (isMatched ? '#a7f3d0' : '#ede9fe') : '#6b7280',
                    border: '3px solid #1e1b4b', borderRadius: '15px',
                    boxShadow: isOpen ? 'none' : '3px 3px 0px #1e1b4b',
                    cursor: !isMyTurn || isOpen ? 'default' : 'pointer',
                    transition: 'transform 0.15s ease',
                    transform: isOpen ? 'rotateY(180deg)' : 'none',
                  }}
                >
                  <span style={{ transform: isOpen ? 'rotateY(180deg)' : 'none' }}>
                    {isOpen ? emoji : '❓'}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: '#6b7280' }}>
            Initializing cards... ⏳
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          {(state.phase === 'ended' || state.matched.length > 0) && (
            <button onClick={restartGame} className="btn-cute btn-cute-primary">
              <RefreshCw size={16} /> {state.phase === 'ended' ? 'Play Again' : 'Restart'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
