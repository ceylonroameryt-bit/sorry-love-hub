import React, { useState, useEffect } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { RefreshCw, Send } from 'lucide-react';
import { GameHeader } from './GameHeader';
import { FINISH_SENTENCE_PROMPTS as PROMPTS } from '../data/questions';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface FsState {
  phase: 'writing' | 'reading' | 'ended';
  round: number;
  promptIndex: number;
  promptOrder: number[];
  hostHalf: string;
  guestHalf: string;
}

const ROUNDS = 5;

function makeInitial(): FsState {
  const order = shuffle(PROMPTS.map((_, i) => i));
  return {
    phase: 'writing',
    round: 1,
    promptIndex: 0,
    promptOrder: order.slice(0, ROUNDS),
    hostHalf: '',
    guestHalf: ''
  };
}

export const FinishSentence: React.FC = () => {
  const { role, sendGameAction, gameState, opponentName } = useGamePeer();

  // Host auto-initialization for fresh shuffled prompts
  useEffect(() => {
    if (role === 'host' && (!gameState || !gameState.promptOrder)) {
      sendGameAction(makeInitial());
    }
  }, [role, gameState, sendGameAction]);

  const state: FsState = gameState ?? makeInitial();
  const [draft, setDraft] = useState('');

  const promptOrder = state.promptOrder ?? PROMPTS.map((_, i) => i).slice(0, ROUNDS);
  const currentPromptIdx = promptOrder[state.promptIndex % promptOrder.length] ?? 0;
  const prompt = PROMPTS[currentPromptIdx];

  const myHalf = role === 'host' ? state.hostHalf : state.guestHalf;

  const submit = () => {
    if (!draft.trim() || myHalf) return;
    const ns = { ...state };
    if (role === 'host') ns.hostHalf = draft.trim();
    else ns.guestHalf = draft.trim();
    if (ns.hostHalf && ns.guestHalf) ns.phase = 'reading';
    sendGameAction(ns);
    setDraft('');
  };

  const next = () => {
    if (role !== 'host') return;
    if (state.round >= ROUNDS) { sendGameAction({ ...state, phase: 'ended' }); return; }
    sendGameAction({
      ...state,
      round: state.round + 1,
      promptIndex: state.promptIndex + 1,
      phase: 'writing',
      hostHalf: '',
      guestHalf: ''
    });
    setDraft('');
  };

  const reset = () => { sendGameAction(makeInitial()); setDraft(''); };

  return (
    <div className="game-container-responsive">
      <GameHeader
        title="Finish the Sentence"
        emoji="✍️"
        instructions={[
          "Read the sentence starter prompt together.",
          "Both you and your partner complete the sentence independently in secret.",
          "Once both submit, reveal and read each other's romantic or funny answers!"
        ]}
      />

      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
          <span className="badge-cute" style={{ background: '#fce7f3', color: '#ec4899' }}>
            Sentence {state.round} of {ROUNDS}
          </span>
        </div>

        {/* Ended Phase */}
        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>✍️💖</div>
            <h2 className="heading-lg" style={{ color: '#ec4899', marginBottom: '0.5rem' }}>
              All Sentences Complete!
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '1rem' }}>
              Hope you enjoyed reading each other's custom endings!
            </p>
            {role === 'host' && (
              <button onClick={reset} className="btn-cute btn-cute-primary" style={{ padding: '0.7rem 1.8rem', background: '#ec4899', borderColor: '#ec4899' }}>
                <RefreshCw size={18} /> Play Again
              </button>
            )}
          </div>
        )}

        {/* Writing or Reading Phase */}
        {state.phase !== 'ended' && (
          <div>
            {/* Prompt Box */}
            <div style={{
              background: '#ffffff',
              border: '2px solid #ec4899',
              borderRadius: '20px',
              padding: '1.4rem 1.2rem',
              textAlign: 'center',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 14px rgba(236,72,153,0.08)'
            }}>
              <span style={{ fontSize: '0.8rem', color: '#ec4899', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.4rem' }}>
                PROMPT STARTER
              </span>
              <p style={{ fontSize: '1.25rem', color: '#1e1b4b', fontWeight: 700, margin: 0, fontFamily: 'var(--font-cute)' }}>
                "{prompt} ..."
              </p>
            </div>

            {/* Writing Input */}
            {state.phase === 'writing' && (
              <div style={{ marginBottom: '1.2rem' }}>
                {myHalf ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '1.2rem',
                    background: '#f3e8ff',
                    border: '1.5px solid #c084fc',
                    borderRadius: '16px',
                    color: '#6d28d9',
                    fontWeight: 600
                  }}>
                    ✅ Locked in! Waiting for {opponentName || 'partner'} to submit their sentence... ⏳
                  </div>
                ) : (
                  <div>
                    <textarea
                      className="input-cute"
                      placeholder="Finish the sentence here..."
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      rows={3}
                      style={{ borderRadius: '16px', resize: 'none', marginBottom: '0.8rem', fontSize: '1rem' }}
                    />
                    <button
                      onClick={submit}
                      disabled={!draft.trim()}
                      className="btn-cute btn-cute-primary"
                      style={{ width: '100%', padding: '0.8rem', justifyContent: 'center', background: '#ec4899', borderColor: '#ec4899' }}
                    >
                      <Send size={16} /> Submit Ending
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Reading Phase */}
            {state.phase === 'reading' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                  {/* Host Ending */}
                  <div style={{ background: '#ffffff', border: '1.5px solid #7c3aed', borderRadius: '16px', padding: '1rem 1.2rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 700, marginBottom: '0.3rem' }}>👑 Host's Ending:</div>
                    <div style={{ fontSize: '1.05rem', color: '#1e1b4b', fontFamily: 'var(--font-cute)' }}>
                      "{prompt} <strong style={{ color: '#7c3aed' }}>{state.hostHalf}</strong>"
                    </div>
                  </div>

                  {/* Guest Ending */}
                  <div style={{ background: '#ffffff', border: '1.5px solid #ec4899', borderRadius: '16px', padding: '1rem 1.2rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#ec4899', fontWeight: 700, marginBottom: '0.3rem' }}>🌸 Guest's Ending:</div>
                    <div style={{ fontSize: '1.05rem', color: '#1e1b4b', fontFamily: 'var(--font-cute)' }}>
                      "{prompt} <strong style={{ color: '#ec4899' }}>{state.guestHalf}</strong>"
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  {role === 'host' && (
                    <button onClick={next} className="btn-cute btn-cute-primary" style={{ padding: '0.65rem 1.6rem', background: '#ec4899', borderColor: '#ec4899' }}>
                      Next Sentence ➔
                    </button>
                  )}
                  {role === 'guest' && (
                    <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Waiting for host to continue...</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
