import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw, Heart } from 'lucide-react';

interface DuelState {
  phase: 'betting' | 'reveal' | 'ended';
  round: number;
  target: number; // Target sum between 5 and 18
  hostPick: number | null; // pick between 1 and 10
  guestPick: number | null;
  hostScore: number;
  guestScore: number;
}

const INITIAL: DuelState = {
  phase: 'betting',
  round: 1,
  target: 12,
  hostPick: null,
  guestPick: null,
  hostScore: 0,
  guestScore: 0,
};

function generateTarget(): number {
  return Math.floor(Math.random() * 12) + 6; // 6 to 17
}

export const NumberDuel: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName } = useGamePeer();
  const state: DuelState = gameState ?? INITIAL;

  const myPick = role === 'host' ? state.hostPick : state.guestPick;
  const theirPick = role === 'host' ? state.guestPick : state.hostPick;

  const handlePick = (num: number) => {
    if (myPick !== null || state.phase !== 'betting') return;

    const nextState = { ...state };
    if (role === 'host') nextState.hostPick = num;
    else nextState.guestPick = num;

    // Check if both have picked
    if (nextState.hostPick !== null && nextState.guestPick !== null) {
      resolveDuel(nextState);
    } else {
      sendGameAction(nextState);
    }
  };

  const resolveDuel = (curr: DuelState) => {
    const next = { ...curr };
    next.phase = 'reveal';

    const h = next.hostPick!;
    const g = next.guestPick!;
    const sum = h + g;

    // Close to Target sum without going over (Blackjack style)
    if (sum <= next.target) {
      // Closer wins
      if (h > g) next.hostScore += 1;
      else if (g > h) next.guestScore += 1;
    } else {
      // Wait, since both went over, whoever picked the LOWER number is actually closer!
      if (h < g) next.hostScore += 1;
      else if (g < h) next.guestScore += 1;
    }

    sendGameAction(next);
  };

  const nextRound = () => {
    sendGameAction({
      ...state,
      phase: 'betting',
      round: state.round + 1,
      target: generateTarget(),
      hostPick: null,
      guestPick: null,
    });
  };

  const resetGame = () => {
    sendGameAction({ ...INITIAL, target: generateTarget() });
  };

  const hostWins = state.hostPick !== null && state.guestPick !== null && (
    (state.hostPick + state.guestPick <= state.target && state.hostPick > state.guestPick) ||
    (state.hostPick + state.guestPick > state.target && state.hostPick < state.guestPick)
  );

  const guestWins = state.hostPick !== null && state.guestPick !== null && (
    (state.hostPick + state.guestPick <= state.target && state.guestPick > state.hostPick) ||
    (state.hostPick + state.guestPick > state.target && state.guestPick < state.hostPick)
  );

  const isMyWin = (role === 'host' && hostWins) || (role === 'guest' && guestWins);
  const isTie = state.hostPick === state.guestPick;

  return (
    <div className="container-cute" style={{ maxWidth: '640px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Number Duel 🔢</span>
          <button onClick={resetGame} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} title="Reset game">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Score Board */}
        <div style={{
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          background: '#fff', borderRadius: '14px', padding: '0.8rem 1rem',
          border: '1px solid #ede9fe', marginBottom: '1.5rem',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Your Wins</div>
            <div className="font-cute" style={{ fontSize: '1.6rem', color: '#7c3aed' }}>
              {role === 'host' ? state.hostScore : state.guestScore}
            </div>
          </div>
          <span className="badge-cute" style={{ fontSize: '0.8rem' }}>Round {state.round}</span>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{opponentName || 'Partner'}'s Wins</div>
            <div className="font-cute" style={{ fontSize: '1.6rem', color: '#8b5cf6' }}>
              {role === 'guest' ? state.hostScore : state.guestScore}
            </div>
          </div>
        </div>

        {/* Target Sum */}
        <div style={{
          textAlign: 'center', background: 'linear-gradient(135deg,#fffbeb,#fef3c7)',
          border: '1.5px solid #fde68a', borderRadius: '18px', padding: '1.2rem', marginBottom: '1.5rem'
        }}>
          <div style={{ fontSize: '0.82rem', color: '#b45309', fontWeight: 700, marginBottom: '2px' }}>TARGET SUM (DON'T EXCEED)</div>
          <div className="font-cute" style={{ fontSize: '2.5rem', color: '#92400e' }}>{state.target}</div>
          <div style={{ fontSize: '0.78rem', color: '#b45309', maxWidth: '300px', margin: '4px auto 0', lineHeight: 1.3 }}>
            Pick a number 1-10. Your pick + partner's pick = sum. Win by getting closest to Target without going over!
          </div>
        </div>

        {/* BETTING PHASE */}
        {state.phase === 'betting' && (
          <div style={{ textAlign: 'center' }}>
            <h3 className="font-cute" style={{ color: '#4c1d95', fontSize: '1.3rem', marginBottom: '1rem' }}>
              {myPick === null ? "Lock in your secret pick!" : "Secret pick locked in!"}
            </h3>

            {myPick === null ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', maxWidth: '440px', margin: '0 auto' }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    onClick={() => handlePick(num)}
                    className="btn-cute btn-cute-secondary"
                    style={{
                      aspectRatio: '1', padding: 0, justifyContent: 'center', fontSize: '1.2rem', fontWeight: 900
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ animation: 'pop-in 0.3s ease', padding: '1rem 0' }}>
                <div className="font-cute" style={{ fontSize: '1.5rem', color: '#7c3aed', marginBottom: '0.5rem' }}>
                  You picked: {myPick}
                </div>
                <p style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  Waiting for {opponentName || 'partner'}...
                  <Heart size={15} fill="#7c3aed" color="#7c3aed" style={{ animation: 'pulse-gentle 1s infinite' }} />
                </p>
              </div>
            )}
          </div>
        )}

        {/* REVEAL PHASE */}
        {state.phase === 'reveal' && (
          <div style={{ textAlign: 'center', animation: 'pop-in 0.4s ease' }}>
            <h3 className="font-cute" style={{ color: '#4c1d95', fontSize: '1.8rem', marginBottom: '1.5rem' }}>
              Duel Results! 🗡️
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#f5f3ff', border: '1.5px solid #ede9fe', borderRadius: '18px', padding: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 700 }}>Your Pick</div>
                <div className="font-cute" style={{ fontSize: '2rem', color: '#4c1d95', marginTop: '0.2rem' }}>
                  {myPick}
                </div>
              </div>

              <div style={{ background: '#fdf2f8', border: '1.5px solid #fbcfe8', borderRadius: '18px', padding: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#be185d', fontWeight: 700 }}>{opponentName || 'Partner'}'s Pick</div>
                <div className="font-cute" style={{ fontSize: '2rem', color: '#4c1d95', marginTop: '0.2rem' }}>
                  {theirPick}
                </div>
              </div>
            </div>

            <div style={{
              background: '#fff', border: '1px solid #ede9fe', borderRadius: '16px', padding: '0.8rem', maxWidth: '280px', margin: '0 auto 1.5rem'
            }}>
              <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 700 }}>COMBINED SUM</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: (state.hostPick! + state.guestPick! > state.target) ? '#dc2626' : '#059669' }}>
                {state.hostPick! + state.guestPick!} {(state.hostPick! + state.guestPick! > state.target) && '⚠️ (Busted)'}
              </div>
            </div>

            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#7c3aed', marginBottom: '2rem' }}>
              {isTie ? (
                <span>It's a perfect tie! 🤝</span>
              ) : isMyWin ? (
                <span>🎉 You won the duel! (+1 Score)</span>
              ) : (
                <span>{opponentName || 'Partner'} won the duel! 👑</span>
              )}
            </div>

            {role === 'host' ? (
              <button onClick={nextRound} className="btn-cute btn-cute-primary" style={{ padding: '0.8rem 2rem' }}>
                Next Round ➡️
              </button>
            ) : (
              <p style={{ color: '#8b5cf6', fontSize: '0.9rem' }}>
                Waiting for host to load next round...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
