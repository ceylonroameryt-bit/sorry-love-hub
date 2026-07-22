import React, { useEffect } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw } from 'lucide-react';
import { GameHeader } from './GameHeader';

type Choice = 'rock' | 'paper' | 'scissors';

interface RPSState {
  phase: 'playing' | 'ended';
  hostChoice: Choice | null;
  guestChoice: Choice | null;
  hostScore: number;
  guestScore: number;
  winner: 'host' | 'guest' | 'tie' | null;
}

const INIT: RPSState = { phase: 'playing', hostChoice: null, guestChoice: null, hostScore: 0, guestScore: 0, winner: null };

const CHOICES: { id: Choice; emoji: string; label: string }[] = [
  { id: 'rock', emoji: '✊', label: 'Rock' },
  { id: 'paper', emoji: '🖐', label: 'Paper' },
  { id: 'scissors', emoji: '✌️', label: 'Scissors' },
];

const beats = (a: Choice, b: Choice) =>
  (a === 'rock' && b === 'scissors') ||
  (a === 'paper' && b === 'rock') ||
  (a === 'scissors' && b === 'paper');

export const RockPaperScissors: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INIT);
    }
  }, [role, gameState, sendGameAction]);

  const state: RPSState = gameState ?? INIT;
  const myChoice = role === 'host' ? state.hostChoice : state.guestChoice;
  const theirChoice = role === 'host' ? state.guestChoice : state.hostChoice;

  const choose = (c: Choice) => {
    if (myChoice !== null || state.phase === 'ended') return;

    const next: RPSState = { ...state };
    if (role === 'host') next.hostChoice = c;
    else next.guestChoice = c;

    if (next.hostChoice && next.guestChoice) {
      next.phase = 'ended';
      if (next.hostChoice === next.guestChoice) {
        next.winner = 'tie';
      } else if (beats(next.hostChoice, next.guestChoice)) {
        next.winner = 'host';
        next.hostScore += 1;
      } else {
        next.winner = 'guest';
        next.guestScore += 1;
      }
    }
    sendGameAction(next);
  };

  const nextRound = () => {
    sendGameAction({ ...state, phase: 'playing', hostChoice: null, guestChoice: null, winner: null });
  };

  const resetAll = () => sendGameAction(INIT);

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Paw Clash"
        emoji="✊"
        instructions={[
          "Secretly pick Rock ✊, Paper 🖐, or Scissors ✌️.",
          "Rock crushes Scissors, Scissors cuts Paper, Paper covers Rock!",
          "First player to reach 3 round victories takes the match championship!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: myChoice ? '#dcfce7' : '#ede9fe', color: myChoice ? '#15803d' : '#6d28d9' }}>
            {state.phase === 'ended' ? 'Clash Revealed' : myChoice ? '✅ Pick Locked' : '✨ MAKE YOUR PICK'}
          </span>
          <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-world)', fontSize: '0.95rem' }}>
            <span style={{ color: '#059669' }}>Host: {state.hostScore}</span>
            <span style={{ color: '#ec4899' }}>Guest: {state.guestScore}</span>
          </div>
        </div>

        {/* Choice Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem', marginBottom: '1.5rem' }}>
          {CHOICES.map(c => {
            const isSelected = myChoice === c.id;
            return (
              <button
                key={c.id}
                onClick={() => choose(c.id)}
                disabled={myChoice !== null || state.phase === 'ended'}
                style={{
                  background: isSelected ? '#dcfce7' : '#ffffff',
                  border: isSelected ? '2.5px solid #059669' : '1.5px solid #ddd6fe',
                  borderRadius: '18px',
                  padding: '1.2rem 0.4rem',
                  textAlign: 'center',
                  cursor: myChoice === null ? 'pointer' : 'default',
                  boxShadow: '0 4px 12px rgba(5,150,105,0.06)'
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.3rem' }}>{c.emoji}</div>
                <div style={{ fontSize: '0.95rem', color: '#1e1b4b', fontWeight: 700, fontFamily: 'var(--font-cute)' }}>{c.label}</div>
              </button>
            );
          })}
        </div>

        {/* Reveal or Status */}
        <div style={{ textAlign: 'center', minHeight: '40px' }}>
          {state.phase === 'playing' && (
            <div style={{ color: myChoice ? '#059669' : '#6b7280', fontSize: '0.95rem', fontWeight: 600 }}>
              {myChoice
                ? (theirChoice ? 'Both picked! Revealing...' : `Choice locked! Waiting for ${opponentName || 'partner'}... ⏳`)
                : 'Tap Rock, Paper, or Scissors above!'}
            </div>
          )}

          {state.phase === 'ended' && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '2rem',
                background: '#ffffff',
                padding: '1rem',
                borderRadius: '16px',
                border: '1.5px solid #ddd6fe',
                marginBottom: '1rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 700 }}>👑 Host Pick</div>
                  <div style={{ fontSize: '2rem' }}>{CHOICES.find(c => c.id === state.hostChoice)?.emoji}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#ec4899', fontWeight: 700 }}>🌸 Guest Pick</div>
                  <div style={{ fontSize: '2rem' }}>{CHOICES.find(c => c.id === state.guestChoice)?.emoji}</div>
                </div>
              </div>

              <h3 style={{ fontSize: '1.4rem', color: state.winner === 'tie' ? '#ca8a04' : state.winner === role ? '#059669' : '#dc2626', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
                {state.winner === 'tie' ? "It's a Tie!" : state.winner === role ? '🎉 You Won This Clash!' : `💔 ${opponentName || 'Partner'} Won!`}
              </h3>

              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
                <button onClick={nextRound} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem' }}>
                  Next Round ➔
                </button>
                <button onClick={resetAll} className="btn-cute btn-cute-secondary" style={{ padding: '0.65rem 1rem' }}>
                  <RefreshCw size={16} /> Reset Scores
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
