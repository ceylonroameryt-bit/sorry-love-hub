import React from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw, Award, Heart } from 'lucide-react';

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
  const { role, sendGameAction, gameState, selectGame, opponentName } = useGamePeer();
  const state: RPSState = gameState ?? INIT;

  const myChoice = role === 'host' ? state.hostChoice : state.guestChoice;

  const choose = (c: Choice) => {
    if (myChoice !== null || state.phase === 'ended') return;

    const next: RPSState = { ...state };
    if (role === 'host') next.hostChoice = c;
    else next.guestChoice = c;

    // If both chose, resolve
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

  const resetAll = () => sendGameAction({ ...INIT });

  const iWon = (role === 'host' && state.winner === 'host') || (role === 'guest' && state.winner === 'guest');
  const theyWon = (role === 'host' && state.winner === 'guest') || (role === 'guest' && state.winner === 'host');
  const myChoice2 = role === 'host' ? state.hostChoice : state.guestChoice;
  const theirChoice = role === 'host' ? state.guestChoice : state.hostChoice;

  return (
    <div className="container-cute" style={{ maxWidth: '700px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Paw Clash ✊🐾</span>
        </div>

        {/* Score */}
        <div style={{
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          background: '#fff', borderRadius: '14px', padding: '0.8rem 1rem',
          border: '1px solid #ede9fe', marginBottom: '2rem',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Your Wins 🏆</div>
            <div className="font-cute" style={{ fontSize: '1.6rem', color: '#7c3aed' }}>
              {role === 'host' ? state.hostScore : state.guestScore}
            </div>
          </div>
          <div className="font-cute" style={{ fontSize: '1.1rem', color: '#a78bfa', background: '#f5f3ff', padding: '0.4rem 1.1rem', borderRadius: '50px', border: '1px solid #ddd6fe' }}>
            Paw Clash 🐾
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{opponentName}'s Wins</div>
            <div className="font-cute" style={{ fontSize: '1.6rem', color: '#8b5cf6' }}>
              {role === 'guest' ? state.hostScore : state.guestScore}
            </div>
          </div>
        </div>

        {/* PLAYING */}
        {state.phase === 'playing' && (
          <div style={{ textAlign: 'center' }}>
            <h2 className="heading-lg">Make Your Move! 🐾</h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              Choose secretly — revealed only when both players pick!
            </p>

            {myChoice === null ? (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
                {CHOICES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => choose(c.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      width: '130px', height: '130px',
                      background: '#fff', border: '2px solid #ddd6fe', borderRadius: '20px',
                      cursor: 'pointer', gap: '0.5rem',
                      boxShadow: '0 2px 10px rgba(124,58,237,0.08)',
                      transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                    }}
                    onMouseEnter={e => {
                      const t = e.currentTarget;
                      t.style.transform = 'translateY(-6px) scale(1.05)';
                      t.style.borderColor = '#a78bfa';
                      t.style.boxShadow = '0 10px 24px rgba(124,58,237,0.18)';
                    }}
                    onMouseLeave={e => {
                      const t = e.currentTarget;
                      t.style.transform = '';
                      t.style.borderColor = '#ddd6fe';
                      t.style.boxShadow = '0 2px 10px rgba(124,58,237,0.08)';
                    }}
                  >
                    <span style={{ fontSize: '3rem', lineHeight: 1 }}>{c.emoji}</span>
                    <span className="font-cute" style={{ color: '#4c1d95', fontSize: '1rem' }}>{c.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ animation: 'pop-in 0.3s ease' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
                  {CHOICES.find(c => c.id === myChoice)?.emoji}
                </div>
                <div className="font-cute" style={{ fontSize: '1.2rem', color: '#4c1d95', marginBottom: '0.5rem' }}>
                  You chose: {CHOICES.find(c => c.id === myChoice)?.label}!
                </div>
                <p style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  Waiting for {opponentName || 'partner'}...
                  <Heart size={15} fill="#7c3aed" color="#7c3aed" style={{ animation: 'pulse-gentle 1s infinite' }} />
                </p>
              </div>
            )}
          </div>
        )}

        {/* ENDED / REVEAL */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', animation: 'pop-in 0.4s ease' }}>
            {/* Winner banner */}
            {state.winner === 'tie' ? (
              <div>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🤝</div>
                <h3 className="font-cute" style={{ fontSize: '2rem', color: '#d97706', margin: '0 0 0.3rem' }}>It's a Tie!</h3>
                <p style={{ color: '#6b7280' }}>Great minds think alike! Try again.</p>
              </div>
            ) : iWon ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                  <Award size={50} color="#7c3aed" style={{ animation: 'float 3s ease infinite' }} />
                </div>
                <h3 className="font-cute" style={{ fontSize: '2rem', color: '#7c3aed', margin: '0 0 0.3rem' }}>You Won! 🎉</h3>
                <p style={{ color: '#6b7280' }}>Your paw reigned supreme!</p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>😅</div>
                <h3 className="font-cute" style={{ fontSize: '2rem', color: '#6b7280', margin: '0 0 0.3rem' }}>{opponentName} Won!</h3>
                <p style={{ color: '#6b7280' }}>Better luck next round!</p>
              </div>
            )}

            {/* Reveal cards */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', margin: '2rem 0', flexWrap: 'wrap' }}>
              {/* My card */}
              <div style={{
                width: '150px', height: '150px', background: '#fff',
                border: `3px solid ${iWon ? '#7c3aed' : state.winner === 'tie' ? '#ddd6fe' : '#fecaca'}`,
                borderRadius: '20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: iWon ? '0 8px 24px rgba(124,58,237,0.2)' : 'none',
                transform: iWon ? 'scale(1.05)' : 'scale(1)',
              }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Your Move</div>
                <div style={{ fontSize: '3rem' }}>{CHOICES.find(c => c.id === myChoice2)?.emoji ?? '❓'}</div>
                <div className="font-cute" style={{ color: '#4c1d95', fontSize: '0.95rem' }}>
                  {myChoice2 ? CHOICES.find(c => c.id === myChoice2)?.label : '?'}
                </div>
              </div>

              <div className="font-cute" style={{ fontSize: '1.6rem', color: '#a78bfa', animation: 'wiggle 0.5s infinite' }}>VS</div>

              {/* Their card */}
              <div style={{
                width: '150px', height: '150px', background: '#fff',
                border: `3px solid ${theyWon ? '#7c3aed' : state.winner === 'tie' ? '#ddd6fe' : '#fecaca'}`,
                borderRadius: '20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: theyWon ? '0 8px 24px rgba(124,58,237,0.2)' : 'none',
                transform: theyWon ? 'scale(1.05)' : 'scale(1)',
              }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{opponentName}'s Move</div>
                <div style={{ fontSize: '3rem' }}>{CHOICES.find(c => c.id === theirChoice)?.emoji ?? '❓'}</div>
                <div className="font-cute" style={{ color: '#4c1d95', fontSize: '0.95rem' }}>
                  {theirChoice ? CHOICES.find(c => c.id === theirChoice)?.label : '?'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={resetAll} className="btn-cute btn-cute-secondary">
                Reset Scores
              </button>
              <button onClick={nextRound} className="btn-cute btn-cute-primary">
                <RefreshCw size={15} /> Next Round
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
