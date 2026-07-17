import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';

interface Upgrade {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  lps: number; // Love points Per Second
  count: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
}

interface Props { onBack: () => void; }

export const OfflineLoveClicker: React.FC<Props> = ({ onBack }) => {
  const [love, setLove] = useState(() => parseFloat(localStorage.getItem('clicker_love') || '0'));
  const [upgrades, setUpgrades] = useState<Upgrade[]>(() => {
    const saved = localStorage.getItem('clicker_upgrades');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [
      { id: 'cupid', name: 'Chibi Cupid 👼', emoji: '👼', cost: 15, lps: 1, count: 0 },
      { id: 'chocolates', name: 'Box of Chocolates 🍫', emoji: '🍫', cost: 100, lps: 5, count: 0 },
      { id: 'letter', name: 'Love Letter 💌', emoji: '💌', cost: 500, lps: 15, count: 0 },
      { id: 'bouquet', name: 'Magic Bouquet 💐', emoji: '💐', cost: 2000, lps: 60, count: 0 },
      { id: 'cottage', name: 'Cozy Cottage 🏡', emoji: '🏡', cost: 10000, lps: 250, count: 0 },
    ];
  });

  const [floaters, setFloaters] = useState<FloatingText[]>([]);
  const floaterIdRef = useRef(0);
  const [heartScale, setHeartScale] = useState(1);

  // Compute total Love points Per Second
  const lps = upgrades.reduce((sum, u) => sum + (u.lps * u.count), 0);

  // Auto-generation loop (runs every 100ms for smooth UI updates)
  useEffect(() => {
    const interval = setInterval(() => {
      if (lps > 0) {
        setLove(prev => {
          const next = prev + (lps / 10);
          localStorage.setItem('clicker_love', next.toString());
          return next;
        });
      }
    }, 100);
    return () => clearInterval(interval);
  }, [lps]);

  // Periodic auto-save of upgrades state
  useEffect(() => {
    localStorage.setItem('clicker_upgrades', JSON.stringify(upgrades));
  }, [upgrades]);

  const handleHeartClick = (e: React.MouseEvent<HTMLDivElement>) => {
    setLove(prev => {
      const next = prev + 1;
      localStorage.setItem('clicker_love', next.toString());
      return next;
    });

    // Animate heart size bounce
    setHeartScale(0.9);
    setTimeout(() => setHeartScale(1.1), 80);
    setTimeout(() => setHeartScale(1), 160);

    // Spawn floating text
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const sweetMessages = ['❤️', '💖', '💕', '+1', '✨', '🌸', '🧸', '💋', '💝'];
    const text = sweetMessages[Math.floor(Math.random() * sweetMessages.length)];
    const id = floaterIdRef.current++;
    
    setFloaters(prev => [...prev, { id, x, y, text }]);
    
    // Cleanup floater after 1s
    setTimeout(() => {
      setFloaters(prev => prev.filter(f => f.id !== id));
    }, 1000);
  };

  const buyUpgrade = (upgradeId: string) => {
    const u = upgrades.find(item => item.id === upgradeId);
    if (!u || love < u.cost) return;

    setLove(prev => prev - u.cost);
    setUpgrades(prev =>
      prev.map(item => {
        if (item.id === upgradeId) {
          return {
            ...item,
            count: item.count + 1,
            cost: Math.round(item.cost * 1.15), // Increase cost by 15%
          };
        }
        return item;
      })
    );
  };

  const resetAll = () => {
    if (window.confirm("Are you sure you want to reset your game?")) {
      setLove(0);
      setUpgrades([
        { id: 'cupid', name: 'Chibi Cupid 👼', emoji: '👼', cost: 15, lps: 1, count: 0 },
        { id: 'chocolates', name: 'Box of Chocolates 🍫', emoji: '🍫', cost: 100, lps: 5, count: 0 },
        { id: 'letter', name: 'Love Letter 💌', emoji: '💌', cost: 500, lps: 15, count: 0 },
        { id: 'bouquet', name: 'Magic Bouquet 💐', emoji: '💐', cost: 2000, lps: 60, count: 0 },
        { id: 'cottage', name: 'Cozy Cottage 🏡', emoji: '🏡', cost: 10000, lps: 250, count: 0 },
      ]);
      localStorage.removeItem('clicker_love');
      localStorage.removeItem('clicker_upgrades');
    }
  };

  return (
    <div className="container-cute" style={{ maxWidth: '780px' }}>
      <div className="card-cute" style={{ background: '#faf5ff', border: '3px solid #1e1b4b' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={onBack} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <span className="badge-cute">Love Clicker 💖</span>
          <button onClick={resetAll} className="btn-cute btn-cute-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} title="Reset game">
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Game Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* Left panel: giant heart and stats */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', border: '3px solid #1e1b4b', borderRadius: '20px', padding: '2rem 1rem', boxShadow: '4px 4px 0px #1e1b4b' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Love Points</div>
            <div className="font-cute" style={{ fontSize: '2.5rem', color: '#ec4899', margin: '0.2rem 0' }}>
              {Math.floor(love).toLocaleString()} 💕
            </div>
            <div style={{ fontSize: '0.85rem', color: '#7c3aed', fontWeight: 700 }}>
              Generating {lps.toFixed(1)} / sec
            </div>

            {/* Clickable Area */}
            <div 
              onClick={handleHeartClick}
              style={{
                position: 'relative',
                width: '180px',
                height: '180px',
                margin: '2rem 0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${heartScale})`,
                transition: 'transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                userSelect: 'none',
              }}
            >
              {/* Floating Emojis */}
              {floaters.map(f => (
                <div
                  key={f.id}
                  style={{
                    position: 'absolute',
                    left: `${f.x}px`,
                    top: `${f.y}px`,
                    fontSize: '1.8rem',
                    pointerEvents: 'none',
                    animation: 'float-up-fade 1s forwards',
                    fontWeight: 'bold',
                    textShadow: '1px 1px 0px #1e1b4b',
                  }}
                >
                  {f.text}
                </div>
              ))}

              {/* Big Heart SVG */}
              <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%', fill: '#ec4899', stroke: '#1e1b4b', strokeWidth: 1.5, filter: 'drop-shadow(4px 4px 0px #1e1b4b)' }}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af', textAlign: 'center' }}>
              Tap the giant heart as fast as you can! 🧸
            </p>
          </div>

          {/* Right panel: upgrades shop */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <h3 className="font-cute" style={{ margin: '0 0 0.5rem', color: '#1e1b4b', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Upgrade Shop 🛍️</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
              {upgrades.map(u => {
                const canBuy = love >= u.cost;
                return (
                  <button
                    key={u.id}
                    onClick={() => buyUpgrade(u.id)}
                    disabled={!canBuy}
                    className="btn-cute"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.8rem 1rem',
                      background: canBuy ? '#fff' : '#f3f4f6',
                      borderColor: canBuy ? '#1e1b4b' : '#d1d5db',
                      color: '#1e1b4b',
                      borderRadius: '16px',
                      opacity: 1,
                      transform: 'none',
                      boxShadow: canBuy ? '3px 3px 0px #1e1b4b' : '1px 1px 0px #d1d5db',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textAlign: 'left' }}>
                      <span style={{ fontSize: '1.8rem' }}>{u.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{u.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                          +{u.lps} points/s • Owned: <strong>{u.count}</strong>
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '0.95rem', color: canBuy ? '#ec4899' : '#9ca3af' }}>
                      💕 {u.cost}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Styled animation keyframes locally */}
      <style>{`
        @keyframes float-up-fade {
          0% { transform: translateY(0) scale(0.8); opacity: 1; }
          100% { transform: translateY(-80px) scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
