import React, { useState } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw, Heart, Award, Send } from 'lucide-react';

import { FINISH_SENTENCE_PROMPTS as PROMPTS } from '../data/questions';

interface FsState {
  phase: 'writing' | 'reading' | 'ended';
  round: number;
  promptIndex: number;
  hostHalf: string;
  guestHalf: string;
}

const ROUNDS = 5;

function makeInitial(): FsState {
  return { phase: 'writing', round: 1, promptIndex: Math.floor(Math.random() * PROMPTS.length), hostHalf: '', guestHalf: '' };
}

export const FinishSentence: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName } = useGamePeer();
  const state: FsState = gameState ?? makeInitial();
  const [draft, setDraft] = useState('');

  const prompt = PROMPTS[state.promptIndex % PROMPTS.length];
  const myHalf = role === 'host' ? state.hostHalf : state.guestHalf;
  const theirHalf = role === 'host' ? state.guestHalf : state.hostHalf;

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
    sendGameAction({ ...makeInitial(), round: state.round + 1, phase: 'writing' });
    setDraft('');
  };

  const reset = () => { sendGameAction(makeInitial()); setDraft(''); };

  return (
    <div className="container-cute" style={{ maxWidth: '660px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Finish the Sentence ✍️</span>
          <button onClick={reset} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}><RefreshCw size={14} /></button>
        </div>

        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#6b7280', marginBottom: '1.5rem' }}>
          Round {state.round}/{ROUNDS} — Both complete the same prompt, then read each other's answer!
        </div>

        {/* Prompt */}
        <div style={{ background: '#fff', border: '2px solid #ddd6fe', borderRadius: '20px', padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <Heart size={20} color="#ec4899" fill="#ec4899" style={{ marginBottom: '0.5rem', animation: 'pulse-gentle 2s infinite' }} />
          <h3 className="font-cute" style={{ fontSize: '1.3rem', color: '#4c1d95', margin: 0, lineHeight: 1.5 }}>
            "{prompt}"
          </h3>
        </div>

        {state.phase === 'writing' && (
          <div>
            {!myHalf ? (
              <div>
                <textarea value={draft} onChange={e => setDraft(e.target.value)}
                  placeholder="Write your completion here..."
                  className="input-cute"
                  rows={3}
                  style={{ width: '100%', resize: 'none', fontSize: '1rem', fontFamily: 'inherit', marginBottom: '0.8rem' }} />
                <button onClick={submit} disabled={!draft.trim()} className="btn-cute btn-cute-primary"
                  style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' }}>
                  <Send size={15} /> Submit My Answer
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', background: '#f5f3ff', borderRadius: '16px', padding: '1.2rem', animation: 'pop-in 0.3s ease' }}>
                <div className="font-cute" style={{ color: '#7c3aed', marginBottom: '0.5rem' }}>✅ Your answer is in!</div>
                <p style={{ color: '#8b5cf6', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                  Waiting for {opponentName || 'partner'} to finish...
                  <Heart size={14} color="#7c3aed" fill="#7c3aed" style={{ animation: 'pulse-gentle 1s infinite' }} />
                </p>
              </div>
            )}
          </div>
        )}

        {state.phase === 'reading' && (
          <div style={{ animation: 'pop-in 0.4s ease' }}>
            <h3 className="font-cute" style={{ fontSize: '1.3rem', color: '#4c1d95', textAlign: 'center', marginBottom: '1.2rem' }}>Read Each Other's Answers! 📖</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: '🫵 Your Completion', text: myHalf, bg: '#f5f3ff', border: '#ddd6fe', color: '#4c1d95' },
                { label: `💜 ${opponentName || 'Partner'}'s Completion`, text: theirHalf, bg: '#fdf2f8', border: '#fbcfe8', color: '#4c1d95' },
              ].map(({ label, text, bg, border, color }) => (
                <div key={label} style={{ background: bg, border: `2px solid ${border}`, borderRadius: '18px', padding: '1.2rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7c3aed', marginBottom: '0.5rem' }}>{label}</div>
                  <div style={{ fontSize: '1rem', color, fontStyle: 'italic', lineHeight: 1.5 }}>
                    "{prompt} <strong>{text}</strong>"
                  </div>
                </div>
              ))}
            </div>
            {role === 'host' ? (
              <button onClick={next} className="btn-cute btn-cute-primary" style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' }}>
                {state.round >= ROUNDS ? 'Finish Game 🏁' : 'Next Prompt ➡️'}
              </button>
            ) : <p style={{ textAlign: 'center', color: '#8b5cf6', fontSize: '0.9rem' }}>Waiting for host to continue...</p>}
          </div>
        )}

        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '2rem 0', animation: 'pop-in 0.4s ease' }}>
            <Award size={60} color="#7c3aed" style={{ margin: '0 auto 1rem', animation: 'float 3s ease infinite' }} />
            <h2 className="font-cute" style={{ fontSize: '2rem', color: '#4c1d95', marginBottom: '1rem' }}>All Sentences Finished! ✍️</h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>You've just learned {ROUNDS} new things about each other! 💜</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={reset} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' }}>Play Again</button>
              <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary">Back to Lobby</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
