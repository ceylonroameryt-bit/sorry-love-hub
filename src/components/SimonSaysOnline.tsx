import React, { useState, useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw, Volume2 } from 'lucide-react';

interface SimonState {
  sequence: number[]; // sequence of pad indices (0-3)
  turn: 'host' | 'guest';
  phase: 'watching' | 'playing' | 'adding' | 'ended';
  currentStreak: number;
  loser: 'host' | 'guest' | null;
  hostScore: number;
  guestScore: number;
}

const INITIAL: SimonState = {
  sequence: [],
  turn: 'host',
  phase: 'watching',
  currentStreak: 0,
  loser: null,
  hostScore: 0,
  guestScore: 0,
};

const PADS = [
  { id: 0, color: '#f87171', activeColor: '#fca5a5', name: 'Red 🔴' },
  { id: 1, color: '#60a5fa', activeColor: '#93c5fd', name: 'Blue 🔵' },
  { id: 2, color: '#34d399', activeColor: '#6ee7b7', name: 'Green 🟢' },
  { id: 3, color: '#fbbf24', activeColor: '#fde047', name: 'Yellow 🟡' },
];

export const SimonSaysOnline: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName, playerName } = useGamePeer();
  const state: SimonState = gameState ?? INITIAL;
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const [activePad, setActivePad] = useState<number | null>(null);
  const [isPlayingSeq, setIsPlayingSeq] = useState(false);
  const [localInputIdx, setLocalInputIdx] = useState(0);

  const isMyTurn = state.turn === role && state.phase !== 'ended';

  // Start game by initializing the sequence
  useEffect(() => {
    if (role === 'host' && state.sequence.length === 0 && state.phase === 'watching') {
      const firstPad = Math.floor(Math.random() * 4);
      sendGameAction({
        ...INITIAL,
        sequence: [firstPad],
      });
    }
  }, [role, state.sequence.length, state.phase, sendGameAction]);

  // Watch for sequence changes to play them
  useEffect(() => {
    if (state.sequence.length > 0 && state.phase === 'watching') {
      playSequence();
    }
  }, [state.sequence, state.phase]);

  const playSequence = async () => {
    setIsPlayingSeq(true);
    // Give a short delay before start
    await sleep(600);

    for (let i = 0; i < state.sequence.length; i++) {
      const padId = state.sequence[i];
      setActivePad(padId);
      await sleep(400);
      setActivePad(null);
      await sleep(200);
    }

    setIsPlayingSeq(false);
    
    // Once finished playing:
    // If it's my turn, transition local state to let me play
    if (isMyTurn) {
      setLocalInputIdx(0);
      sendGameAction({
        ...state,
        phase: 'playing',
      });
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handlePadClick = (padId: number) => {
    if (!isMyTurn || isPlayingSeq) return;

    // Flash clicked pad
    setActivePad(padId);
    setTimeout(() => setActivePad(null), 200);

    if (state.phase === 'playing') {
      // Check input correctness
      const expected = state.sequence[localInputIdx];
      if (padId === expected) {
        const nextInputIdx = localInputIdx + 1;
        if (nextInputIdx >= state.sequence.length) {
          // Finished sequence! Transition to adding phase
          sendGameAction({
            ...state,
            phase: 'adding',
            currentStreak: state.sequence.length,
          });
        } else {
          setLocalInputIdx(nextInputIdx);
        }
      } else {
        // Failed!
        let nextHostScore = state.hostScore;
        let nextGuestScore = state.guestScore;

        if (role === 'host') nextGuestScore++;
        else nextHostScore++;

        sendGameAction({
          ...state,
          phase: 'ended',
          loser: role!,
          hostScore: nextHostScore,
          guestScore: nextGuestScore,
        });
      }
    } else if (state.phase === 'adding') {
      // Pad clicked becomes the new addition to sequence
      const nextSequence = [...state.sequence, padId];
      const nextTurn = state.turn === 'host' ? 'guest' : 'host';

      sendGameAction({
        ...state,
        sequence: nextSequence,
        turn: nextTurn,
        phase: 'watching',
      });
    }
  };

  const restartGame = () => {
    if (role === 'host') {
      const firstPad = Math.floor(Math.random() * 4);
      sendGameAction({
        ...INITIAL,
        sequence: [firstPad],
        hostScore: state.hostScore,
        guestScore: state.guestScore,
        turn: stateRef.current.loser === 'host' ? 'guest' : 'host',
      });
    } else {
      sendGameAction({
        ...INITIAL,
        hostScore: state.hostScore,
        guestScore: state.guestScore,
      });
    }
  };

  return (
    <div className="container-cute" style={{ maxWidth: '600px' }}>
      <div className="card-cute" style={{ background: '#f5fafb', border: '1.5px solid #bae6fd' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Simon Says Duel 🔴🔵</span>
        </div>

        {/* Scores */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
          background: '#e0f2fe', padding: '0.8rem', borderRadius: '15px',
          textAlign: 'center', marginBottom: '1.5rem', border: '2px solid #1e1b4b'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#0369a1' }}>{playerName} Score</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e1b4b' }}>
              {role === 'host' ? state.hostScore : state.guestScore}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#0369a1' }}>{opponentName || 'Partner'} Score</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e1b4b' }}>
              {role === 'host' ? state.guestScore : state.hostScore}
            </div>
          </div>
        </div>

        {/* Status Area */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {state.phase === 'ended' ? (
            <span className="font-cute" style={{ color: '#db2777', fontSize: '1.2rem' }}>
              {state.loser === role ? '❌ You failed! Rematch?' : `🎉 Partner failed! Score: ${state.currentStreak}`}
            </span>
          ) : isPlayingSeq ? (
            <span className="font-cute" style={{ color: '#0284c7', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={18} className="animate-bounce" /> Pay attention to the pattern! 📺
            </span>
          ) : state.phase === 'adding' ? (
            <span className="font-cute animate-pulse" style={{ color: '#059669', fontSize: '1.15rem', fontWeight: 'bold' }}>
              ✨ Success! Tap any pad to add a color!
            </span>
          ) : isMyTurn ? (
            <span className="font-cute" style={{ color: '#0369a1', fontSize: '1.1rem' }}>
              Repeat pattern: <strong style={{ color: '#0284c7' }}>{localInputIdx}/{state.sequence.length}</strong>
            </span>
          ) : (
            <span className="font-cute" style={{ color: '#9ca3af', fontSize: '1rem' }}>
              {opponentName || 'Partner'} is playing... ⏳
            </span>
          )}
        </div>

        {/* 2x2 Simon Pads */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px',
          maxWidth: '300px', margin: '0 auto 1.5rem'
        }}>
          {PADS.map(pad => {
            const isActive = activePad === pad.id;
            const disabled = isPlayingSeq || !isMyTurn;

            return (
              <button
                key={pad.id}
                disabled={disabled}
                onClick={() => handlePadClick(pad.id)}
                style={{
                  aspectRatio: '1', borderRadius: '20px',
                  backgroundColor: isActive ? pad.activeColor : pad.color,
                  border: '4px solid #1e1b4b',
                  boxShadow: isActive ? 'none' : '4px 4px 0px #1e1b4b',
                  cursor: disabled ? 'default' : 'pointer',
                  transform: isActive ? 'scale(0.96)' : 'none',
                  transition: 'all 0.1s ease',
                  opacity: isPlayingSeq && !isActive ? 0.6 : 1,
                }}
                title={pad.name}
              />
            );
          })}
        </div>

        {/* Rematch Actions */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {state.phase === 'ended' && (
            <button onClick={restartGame} className="btn-cute btn-cute-primary">
              <RefreshCw size={16} /> Rematch
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
