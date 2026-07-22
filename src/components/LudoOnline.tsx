import React, { useEffect, useRef } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw, Dices } from 'lucide-react';
import { GameHeader } from './GameHeader';

interface Token {
  id: number;
  pos: number; // -1=yard, 0-51=main track, 52-56=home column, 57=finished
}

interface LudoState {
  phase: 'playing' | 'ended';
  turn: 'host' | 'guest';
  dice: number | null;
  hostTokens: Token[];
  guestTokens: Token[];
  winner: 'host' | 'guest' | null;
  log: string;
}

const INITIAL_TOKENS: Token[] = [
  { id: 0, pos: -1 },
  { id: 1, pos: -1 },
  { id: 2, pos: -1 },
  { id: 3, pos: -1 },
];

const INITIAL: LudoState = {
  phase: 'playing',
  turn: 'host',
  dice: null,
  hostTokens: JSON.parse(JSON.stringify(INITIAL_TOKENS)),
  guestTokens: JSON.parse(JSON.stringify(INITIAL_TOKENS)),
  winner: null,
  log: 'Roll the dice to start!',
};

export const LudoOnline: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization
  useEffect(() => {
    if (role === 'host' && (!gameState || gameState.phase === undefined)) {
      sendGameAction(INITIAL);
    }
  }, [role, gameState, sendGameAction]);

  const state: LudoState = gameState ?? INITIAL;
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const isMyTurn = state.turn === role && !state.winner;

  const rollDice = () => {
    if (!isMyTurn || state.dice !== null) return;
    const rolled = Math.floor(Math.random() * 6) + 1;
    const s = stateRef.current;
    const tokens = role === 'host' ? s.hostTokens : s.guestTokens;

    // Check movable tokens
    const canMoveAny = tokens.some(t => {
      if (t.pos === -1 && rolled === 6) return true;
      if (t.pos >= 0 && t.pos < 57 && t.pos + rolled <= 57) return true;
      return false;
    });

    if (!canMoveAny) {
      // Pass turn after short delay if no valid moves
      sendGameAction({
        ...s,
        dice: rolled,
        log: `${role === 'host' ? 'Host' : 'Guest'} rolled ${rolled} — No valid moves!`,
      });
      setTimeout(() => {
        const cur = stateRef.current;
        sendGameAction({
          ...cur,
          dice: null,
          turn: cur.turn === 'host' ? 'guest' : 'host',
        });
      }, 1400);
    } else {
      sendGameAction({
        ...s,
        dice: rolled,
        log: `${role === 'host' ? 'Host' : 'Guest'} rolled ${rolled}! Pick a token to move.`,
      });
    }
  };

  const moveToken = (tId: number) => {
    if (!isMyTurn || state.dice === null) return;
    const rolled = state.dice;
    const s = stateRef.current;
    const tokens = role === 'host' ? [...s.hostTokens] : [...s.guestTokens];
    const targetToken = tokens.find(t => t.id === tId);

    if (!targetToken) return;

    if (targetToken.pos === -1 && rolled === 6) {
      targetToken.pos = 0;
    } else if (targetToken.pos >= 0 && targetToken.pos + rolled <= 57) {
      targetToken.pos += rolled;
    } else {
      return; // Invalid move
    }

    const won = tokens.every(t => t.pos === 57);
    const nextTurn = rolled === 6 ? role : (role === 'host' ? 'guest' : 'host');

    const nextState: LudoState = {
      ...s,
      dice: null,
      turn: won ? state.turn : nextTurn,
      winner: won ? role : null,
      phase: won ? 'ended' : 'playing',
      log: `${role === 'host' ? 'Host' : 'Guest'} moved token #${tId + 1}!`,
    };

    if (role === 'host') nextState.hostTokens = tokens;
    else nextState.guestTokens = tokens;

    sendGameAction(nextState);
  };

  const resetAll = () => sendGameAction(INITIAL);

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Ludo Board Duel"
        emoji="🎲"
        instructions={[
          "Roll the dice on your turn. You need a 6 to bring a token out of the Yard!",
          "Move tokens along the track toward the center Home area.",
          "Rolling a 6 earns you an extra dice roll!",
          "First player to bring all 4 tokens into Home wins!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="badge-cute" style={{ background: isMyTurn ? '#dcfce7' : '#ede9fe', color: isMyTurn ? '#15803d' : '#6d28d9' }}>
            {state.winner ? 'Game Ended' : isMyTurn ? '✨ YOUR TURN TO ROLL' : `⏳ ${opponentName || 'Partner'}'s Turn`}
          </span>
          <span style={{ fontSize: '0.85rem', color: '#6b7280', fontFamily: 'var(--font-cute)' }}>
            {state.log}
          </span>
        </div>

        {/* Dice Action Area */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', background: '#ffffff', border: '2px solid #ddd6fe', padding: '1rem 1.5rem', borderRadius: '20px' }}>
            <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-world)', color: '#7c3aed' }}>
              {state.dice !== null ? `🎲 ${state.dice}` : '🎲'}
            </div>
            <button
              onClick={rollDice}
              disabled={!isMyTurn || state.dice !== null}
              className="btn-cute btn-cute-primary"
              style={{ padding: '0.65rem 1.4rem' }}
            >
              <Dices size={18} /> Roll Dice
            </button>
          </div>
        </div>

        {/* Token Track Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Host Tokens */}
          <div style={{ background: '#ffffff', border: '1.5px solid #7c3aed', borderRadius: '16px', padding: '1rem' }}>
            <h4 style={{ margin: '0 0 0.6rem', color: '#7c3aed', fontSize: '0.95rem' }}>👑 Host Tokens (Purple)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {state.hostTokens.map(t => (
                <button
                  key={t.id}
                  onClick={() => role === 'host' && moveToken(t.id)}
                  disabled={!isMyTurn || role !== 'host' || state.dice === null}
                  style={{
                    background: t.pos === 57 ? '#dcfce7' : t.pos >= 0 ? '#f3e8ff' : '#ffffff',
                    border: '1px solid #7c3aed',
                    borderRadius: '10px',
                    padding: '0.5rem',
                    textAlign: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}
                >
                  Token #{t.id + 1}
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {t.pos === -1 ? 'Yard' : t.pos === 57 ? '✅ Home' : `Pos: ${t.pos}`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Guest Tokens */}
          <div style={{ background: '#ffffff', border: '1.5px solid #ec4899', borderRadius: '16px', padding: '1rem' }}>
            <h4 style={{ margin: '0 0 0.6rem', color: '#ec4899', fontSize: '0.95rem' }}>🌸 Guest Tokens (Pink)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {state.guestTokens.map(t => (
                <button
                  key={t.id}
                  onClick={() => role === 'guest' && moveToken(t.id)}
                  disabled={!isMyTurn || role !== 'guest' || state.dice === null}
                  style={{
                    background: t.pos === 57 ? '#dcfce7' : t.pos >= 0 ? '#fce7f3' : '#ffffff',
                    border: '1px solid #ec4899',
                    borderRadius: '10px',
                    padding: '0.5rem',
                    textAlign: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}
                >
                  Token #{t.id + 1}
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {t.pos === -1 ? 'Yard' : t.pos === 57 ? '✅ Home' : `Pos: ${t.pos}`}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Winner Banner */}
        {state.winner && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <h3 style={{ fontSize: '1.5rem', color: state.winner === role ? '#059669' : '#dc2626', fontFamily: 'var(--font-world)', marginBottom: '0.6rem' }}>
              {state.winner === role ? '🎉 Champion! All 4 tokens home!' : `💔 ${opponentName || 'Partner'} Won!`}
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
