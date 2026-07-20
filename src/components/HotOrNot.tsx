import React from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { ArrowLeft, RefreshCw, Heart, Award } from 'lucide-react';

import { HOT_OR_NOT_TOPICS as TOPICS } from '../data/questions';

interface HonState {
  phase: 'voting' | 'reveal' | 'ended';
  round: number;
  topicIndex: number;
  hostRating: number | null;
  guestRating: number | null;
  hostScore: number;
  guestScore: number;
}

const TOTAL = 8;

function makeInitial(): HonState {
  return { phase: 'voting', round: 1, topicIndex: Math.floor(Math.random() * TOPICS.length), hostRating: null, guestRating: null, hostScore: 0, guestScore: 0 };
}

export const HotOrNot: React.FC = () => {
  const { role, sendGameAction, gameState, selectGame, opponentName } = useGamePeer();
  const state: HonState = gameState ?? makeInitial();

  const topic = TOPICS[state.topicIndex % TOPICS.length];
  const myRating = role === 'host' ? state.hostRating : state.guestRating;
  const theirRating = role === 'host' ? state.guestRating : state.hostRating;

  const handleRate = (rating: number) => {
    if (myRating !== null || state.phase !== 'voting') return;
    const ns = { ...state };
    if (role === 'host') ns.hostRating = rating;
    else ns.guestRating = rating;
    if (ns.hostRating !== null && ns.guestRating !== null) {
      ns.phase = 'reveal';
      const diff = Math.abs(ns.hostRating - ns.guestRating);
      if (diff <= 1) { ns.hostScore += 1; ns.guestScore += 1; }
    }
    sendGameAction(ns);
  };

  const next = () => {
    if (role !== 'host') return;
    if (state.round >= TOTAL) {
      sendGameAction({ ...state, phase: 'ended' });
    } else {
      sendGameAction({ ...state, phase: 'voting', round: state.round + 1, topicIndex: (state.topicIndex + 1) % TOPICS.length, hostRating: null, guestRating: null });
    }
  };

  const reset = () => sendGameAction(makeInitial());
  const diff = theirRating !== null && myRating !== null ? Math.abs(myRating - theirRating) : null;
  const syncPct = Math.round((state.hostScore / Math.max(state.round - (state.phase === 'voting' ? 1 : 0), 1)) * 100);

  return (
    <div className="container-cute" style={{ maxWidth: '640px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className="badge-cute">Hot or Not 🔥</span>
          <button onClick={reset} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}><RefreshCw size={14} /></button>
        </div>

        {/* Sync meter */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '0.8rem 1.2rem', border: '1px solid #ede9fe', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>
            <span>Round {state.round}/{TOTAL}</span>
            <span>Sync: {syncPct}% 🔥</span>
          </div>
          <div style={{ height: '8px', background: '#f5f3ff', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${syncPct}%`, background: 'linear-gradient(to right, #f97316, #ec4899)', borderRadius: '99px', transition: 'width 0.4s' }} />
          </div>
        </div>

        {state.phase === 'voting' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '0.8rem', animation: 'float 2s ease infinite' }}>{topic.emoji}</div>
            <h3 className="font-cute" style={{ fontSize: '1.4rem', color: '#4c1d95', marginBottom: '0.5rem' }}>{topic.topic}</h3>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Rate yourself 1–10 secretly, then see how close you both are!</p>

            {myRating === null ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} onClick={() => handleRate(n)} className="btn-cute"
                    style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px solid #ddd6fe', background: '#fff', fontWeight: 800, fontSize: '1.1rem', color: '#4c1d95', padding: 0, transition: 'all 0.2s' }}>
                    {n}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ padding: '1rem', background: '#f5f3ff', borderRadius: '16px', animation: 'pop-in 0.3s ease' }}>
                <div className="font-cute" style={{ fontSize: '1.2rem', color: '#7c3aed' }}>You rated: <strong>{myRating}/10</strong></div>
                <p style={{ color: '#8b5cf6', fontSize: '0.9rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                  Waiting for {opponentName || 'partner'}...
                  <Heart size={14} color="#7c3aed" fill="#7c3aed" style={{ animation: 'pulse-gentle 1s infinite' }} />
                </p>
              </div>
            )}
          </div>
        )}

        {state.phase === 'reveal' && (
          <div style={{ textAlign: 'center', animation: 'pop-in 0.4s ease' }}>
            <h3 className="font-cute" style={{ fontSize: '1.4rem', color: '#4c1d95', marginBottom: '1.5rem' }}>Ratings Revealed! 🔥</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {[{ label: 'You', rating: myRating }, { label: opponentName || 'Partner', rating: theirRating }].map(({ label, rating }) => (
                <div key={label} style={{ background: '#fff', border: '2px solid #ddd6fe', borderRadius: '18px', padding: '1.2rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{label}</div>
                  <div className="font-cute" style={{ fontSize: '2.5rem', color: '#7c3aed' }}>{rating}/10</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: '1.5rem', fontSize: '1rem', fontWeight: 700, color: diff !== null && diff <= 1 ? '#059669' : '#ca8a04' }}>
              {diff === 0 ? '🎯 Identical! Perfect sync!' : diff === 1 ? '🔥 Super close! +1 point each!' : diff !== null && diff <= 3 ? `💛 ${diff} apart — close enough!` : `💜 ${diff} apart — very different perspectives!`}
            </div>
            {role === 'host' ? (
              <button onClick={next} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#f97316,#ec4899)' }}>
                {state.round >= TOTAL ? 'See Final Results' : 'Next Topic ➡️'}
              </button>
            ) : <p style={{ color: '#8b5cf6', fontSize: '0.9rem' }}>Waiting for host...</p>}
          </div>
        )}

        {state.phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: '2rem 0', animation: 'pop-in 0.4s ease' }}>
            <Award size={60} color="#f97316" style={{ margin: '0 auto 1rem', animation: 'float 3s ease infinite' }} />
            <h2 className="font-cute" style={{ fontSize: '2rem', color: '#4c1d95', marginBottom: '0.5rem' }}>All Done! 🔥</h2>
            <div style={{ fontSize: '1.1rem', color: '#374151', marginBottom: '2rem' }}>
              You synced on <strong style={{ color: '#f97316', fontSize: '1.4rem' }}>{state.hostScore}</strong> out of {TOTAL} topics!<br />
              <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>{syncPct >= 80 ? '🔥 You two are practically the same person!' : syncPct >= 60 ? '💕 Great minds think alike!' : '🌈 Beautifully different!'}</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={reset} className="btn-cute btn-cute-primary" style={{ background: 'linear-gradient(135deg,#f97316,#ec4899)' }}>Play Again</button>
              <button onClick={() => selectGame(null)} className="btn-cute btn-cute-secondary">Back to Lobby</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
