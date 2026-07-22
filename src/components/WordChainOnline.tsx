import React, { useEffect, useRef, useState } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw, Send } from 'lucide-react';
import { GameHeader } from './GameHeader';

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
  const { role, sendGameAction, gameState, opponentName, playerName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INITIAL);
    }
  }, [role, gameState, sendGameAction]);

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
        // Invalid starting letter
        const otherRole = role === 'host' ? 'guest' : 'host';
        sendGameAction({
          ...s,
          phase: 'ended',
          winner: otherRole,
          loser: playerName,
          lastError: `Word must start with letter "${needed}"!`,
          hostScore: otherRole === 'host' ? s.hostScore + 1 : s.hostScore,
          guestScore: otherRole === 'guest' ? s.guestScore + 1 : s.guestScore,
        });
        setInputValue('');
        return;
      }
    }

    // Check duplicate
    if (s.chain.some(item => item.word === word)) {
      const otherRole = role === 'host' ? 'guest' : 'host';
      sendGameAction({
        ...s,
        phase: 'ended',
        winner: otherRole,
        loser: playerName,
        lastError: `Word "${word}" was already played!`,
        hostScore: otherRole === 'host' ? s.hostScore + 1 : s.hostScore,
        guestScore: otherRole === 'guest' ? s.guestScore + 1 : s.guestScore,
      });
      setInputValue('');
      return;
    }

    // Valid word addition
    const nextTurn = role === 'host' ? 'guest' : 'host';
    sendGameAction({
      ...s,
      chain: [...s.chain, { word, player: role }],
      turn: nextTurn,
      lastError: null,
    });
    setInputValue('');
  };

  const restartGame = () => {
    sendGameAction({
      ...INITIAL,
      hostScore: state.hostScore,
      guestScore: state.guestScore,
    });
  };

  const lastWord = state.chain.length > 0 ? state.chain[state.chain.length - 1].word : '';
  const requiredLetter = lastWord ? lastWord[lastWord.length - 1] : '';

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Word Chain"
        emoji="🔗"
        instructions={[
          "Take turns typing English words in sequence.",
          "Your word MUST start with the LAST letter of your partner's word!",
          "No repeating words! Typing an invalid starting letter loses the round."
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Score & Turn Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: isMyTurn ? '#dcfce7' : '#ede9fe', color: isMyTurn ? '#15803d' : '#6d28d9' }}>
            {state.phase === 'ended' ? 'Round Ended' : isMyTurn ? '✨ YOUR TURN' : `⏳ ${opponentName || 'Partner'}'s Turn`}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#7c3aed' }}>Host: {state.hostScore}</span>
            <span style={{ color: '#ec4899' }}>Guest: {state.guestScore}</span>
          </div>
        </div>

        {/* Required Starting Letter Indicator */}
        {state.phase === 'playing' && requiredLetter && (
          <div style={{
            background: '#ffffff',
            border: '2px solid #059669',
            borderRadius: '16px',
            padding: '0.8rem',
            textAlign: 'center',
            marginBottom: '1.2rem',
            boxShadow: '0 4px 12px rgba(5,150,105,0.06)'
          }}>
            <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700 }}>MUST START WITH LETTER:</span>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669', fontFamily: 'monospace' }}>
              "{requiredLetter}"
            </div>
          </div>
        )}

        {/* Chain Display Container */}
        <div
          ref={listRef}
          style={{
            height: '220px',
            overflowY: 'auto',
            background: '#ffffff',
            border: '1.5px solid #ddd6fe',
            borderRadius: '18px',
            padding: '0.9rem',
            marginBottom: '1.2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          {state.chain.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto', color: '#9ca3af', fontSize: '0.9rem' }}>
              Type any word to start the chain! 🔗
            </div>
          ) : (
            state.chain.map((item, idx) => {
              const isMe = item.player === role;
              return (
                <div
                  key={idx}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    background: isMe ? '#7c3aed' : '#f3e8ff',
                    color: isMe ? '#ffffff' : '#1e1b4b',
                    padding: '0.5rem 0.9rem',
                    borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    fontFamily: 'monospace'
                  }}
                >
                  {item.word}
                </div>
              );
            })
          )}
        </div>

        {/* ENDED PHASE */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
              {state.winner === role ? '🏆' : '💔'}
            </div>
            <h3 style={{ fontSize: '1.4rem', color: state.winner === role ? '#059669' : '#dc2626', fontFamily: 'var(--font-world)', marginBottom: '0.4rem' }}>
              {state.winner === role ? 'You Win This Round!' : `${opponentName || 'Partner'} Wins!`}
            </h3>
            {state.lastError && (
              <p style={{ color: '#dc2626', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
                {state.lastError}
              </p>
            )}
            <button onClick={restartGame} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem' }}>
              <RefreshCw size={16} /> Play Next Round
            </button>
          </div>
        )}

        {/* PLAYING INPUT */}
        {state.phase === 'playing' && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              ref={inputRef}
              className="input-cute"
              placeholder={isMyTurn ? (requiredLetter ? `Word starting with "${requiredLetter}"...` : 'Type any word...') : `Waiting for ${opponentName || 'partner'}...`}
              value={inputValue}
              onChange={e => setInputValue(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && submitWord()}
              disabled={!isMyTurn}
              style={{ fontSize: '1rem', textTransform: 'uppercase', fontFamily: 'monospace' }}
            />
            <button
              onClick={submitWord}
              disabled={!isMyTurn || !inputValue.trim()}
              className="btn-cute btn-cute-primary"
              style={{ padding: '0.7rem 1rem', minWidth: '46px', justifyContent: 'center' }}
            >
              <Send size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
