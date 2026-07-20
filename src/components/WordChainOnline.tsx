import React, { useEffect, useRef, useState } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw } from 'lucide-react';

// Word Chain Online — Players alternate typing words that start with the last letter of the previous word
interface WordChainState {
  chain: { word: string; player: 'host' | 'guest' }[];
  turn: 'host' | 'guest';
  phase: 'playing' | 'ended';
  winner: 'host' | 'guest' | null;
  loser: string | null;
  lastError: string | null;
  hostScore: number;
  guestScore: number;
}

const INITIAL: WordChainState = {
  chain: [],
  turn: 'host',
  phase: 'playing',
  winner: null,
  loser: null,
  lastError: null,
  hostScore: 0,
  guestScore: 0,
};

export const WordChainOnline: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName, playerName } = useGamePeer();
  const state: WordChainState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [state.chain]);

  const isMyTurn = state.turn === role && state.phase === 'playing';

  const submitWord = () => {
    const word = inputValue.trim().toUpperCase();
    if (!word || !isMyTurn) return;
    const s = stateRef.current;

    // Validate: only letters
    if (!/^[A-Z]+$/.test(word)) {
      setInputValue('');
      return;
    }

    // Check starts with last letter
    if (s.chain.length > 0) {
      const lastWord = s.chain[s.chain.length - 1].word;
      const needed = lastWord[lastWord.length - 1];
      if (word[0] !== needed) {
        // Wrong — send loss
        const nextHostScore = s.hostScore + (role === 'guest' ? 1 : 0);
        const nextGuestScore = s.guestScore + (role === 'host' ? 1 : 0);
        sendGameAction({
          ...s,
          phase: 'ended',
          winner: role === 'host' ? 'guest' : 'host',
          loser: playerName || role,
          lastError: `"${word}" must start with "${needed}"!`,
          hostScore: nextHostScore,
          guestScore: nextGuestScore,
        });
        setInputValue('');
        return;
      }
    }

    // Check duplicate
    if (s.chain.some(e => e.word === word)) {
      const nextHostScore = s.hostScore + (role === 'guest' ? 1 : 0);
      const nextGuestScore = s.guestScore + (role === 'host' ? 1 : 0);
      sendGameAction({
        ...s,
        phase: 'ended',
        winner: role === 'host' ? 'guest' : 'host',
        loser: playerName || role,
        lastError: `"${word}" was already used!`,
        hostScore: nextHostScore,
        guestScore: nextGuestScore,
      });
      setInputValue('');
      return;
    }

    const newChain = [...s.chain, { word, player: role! }];
    const nextTurn: 'host' | 'guest' = role === 'host' ? 'guest' : 'host';

    sendGameAction({
      ...s,
      chain: newChain,
      turn: nextTurn,
      lastError: null,
    });
    setInputValue('');
  };

  const resetGame = () => {
    const s = stateRef.current;
    sendGameAction({ ...INITIAL, hostScore: s.hostScore, guestScore: s.guestScore });
  };
  const fullReset = () => sendGameAction({ ...INITIAL });

  const lastWord = state.chain.length > 0 ? state.chain[state.chain.length - 1].word : null;
  const neededLetter = lastWord ? lastWord[lastWord.length - 1] : null;

  return (
    <div className="container-cute" style={{ maxWidth: '600px' }}>
      <div className="card-cute" style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Word Chain Online 🔗</span>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#dcfce7', padding: '0.8rem',
          borderRadius: '15px', textAlign: 'center', marginBottom: '1.5rem', border: '2px solid #1e1b4b'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#166534' }}>{playerName} 🟢</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{role === 'host' ? state.hostScore : state.guestScore}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#166534' }}>{opponentName || 'Partner'} 🔵</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{role === 'host' ? state.guestScore : state.hostScore}</div>
          </div>
        </div>

        {/* Chain hint */}
        {neededLetter && state.phase === 'playing' && (
          <div style={{
            textAlign: 'center', background: '#fef9c3', borderRadius: '12px', padding: '0.5rem 1rem',
            marginBottom: '1rem', border: '2px solid #fbbf24', fontSize: '1rem'
          }}>
            Next word must start with: <strong style={{ fontSize: '1.4rem', color: '#b45309' }}>"{neededLetter}"</strong>
          </div>
        )}

        {state.phase === 'playing' && state.chain.length === 0 && (
          <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#166534', fontFamily: 'var(--font-cute)', fontSize: '1rem' }}>
            {isMyTurn ? '🟢 You go first! Type any word.' : `Waiting for ${opponentName || 'partner'} to start...`}
          </div>
        )}

        {/* Chain list */}
        <div
          ref={listRef}
          style={{
            minHeight: '180px', maxHeight: '250px', overflowY: 'auto',
            background: '#fff', borderRadius: '14px', padding: '0.8rem', marginBottom: '1rem',
            border: '2px solid #86efac', display: 'flex', flexDirection: 'column', gap: '0.3rem'
          }}
        >
          {state.chain.length === 0 && (
            <div style={{ color: '#9ca3af', textAlign: 'center', marginTop: '3rem', fontSize: '0.9rem' }}>
              No words yet — start the chain! 🔗
            </div>
          )}
          {state.chain.map((entry, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                justifyContent: entry.player === role ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                background: entry.player === 'host' ? 'linear-gradient(135deg,#86efac,#4ade80)' : 'linear-gradient(135deg,#a5b4fc,#818cf8)',
                borderRadius: '12px', padding: '0.35rem 0.9rem',
                fontFamily: 'var(--font-cute)', fontWeight: 700, fontSize: '1rem',
                border: '2px solid #1e1b4b', color: '#1e1b4b',
                boxShadow: '2px 2px 0 #1e1b4b'
              }}>
                {entry.word}
              </div>
            </div>
          ))}
        </div>

        {/* Error message */}
        {state.lastError && (
          <div style={{
            background: '#fee2e2', border: '2px solid #f87171', borderRadius: '12px',
            padding: '0.5rem 1rem', marginBottom: '1rem', color: '#b91c1c', textAlign: 'center', fontWeight: 600
          }}>
            ❌ {state.lastError}
          </div>
        )}

        {/* Result */}
        {state.phase === 'ended' && (
          <div style={{
            textAlign: 'center', marginBottom: '1rem', fontFamily: 'var(--font-cute)',
            fontSize: '1.2rem', color: '#166534'
          }}>
            {state.winner === role ? '🏆 You won! ' : `💔 ${state.loser} made a mistake!`}
          </div>
        )}

        {/* Input */}
        {isMyTurn && state.phase === 'playing' && (
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && submitWord()}
              placeholder={neededLetter ? `Start with "${neededLetter}"...` : 'Type any word...'}
              autoFocus
              style={{
                flex: 1, padding: '0.7rem 1rem', borderRadius: '14px', border: '2px solid #4ade80',
                fontSize: '1.1rem', fontFamily: 'var(--font-cute)', fontWeight: 700,
                outline: 'none', background: '#f0fdf4',
              }}
            />
            <button onClick={submitWord} className="btn-cute btn-cute-primary" style={{ padding: '0.7rem 1.2rem' }}>
              Send ⬆️
            </button>
          </div>
        )}
        {!isMyTurn && state.phase === 'playing' && (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontFamily: 'var(--font-cute)', fontSize: '0.95rem', padding: '0.5rem' }}>
            ⏳ Waiting for {opponentName || 'partner'} to type...
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '1rem' }}>
          {state.phase === 'ended' && <button onClick={resetGame} className="btn-cute btn-cute-primary"><RefreshCw size={15} /> New Chain</button>}
          <button onClick={fullReset} className="btn-cute btn-cute-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>Reset Scores</button>
        </div>
      </div>
    </div>
  );
};
