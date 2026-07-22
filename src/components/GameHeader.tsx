import React, { useState } from 'react';
import { useGamePeer } from '../utils/peerConnection';
import { triggerHaptic } from '../utils/haptics';
import { ArrowLeft, HelpCircle, ChevronUp, Crown, Wifi } from 'lucide-react';

interface GameHeaderProps {
  title: string;
  emoji: string;
  instructions: string[];
  onBack?: () => void;
  extraRight?: React.ReactNode;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  title,
  emoji,
  instructions,
  onBack,
  extraRight
}) => {
  const { selectGame, role, playerName, opponentName, isConnected } = useGamePeer();
  const [showInstructions, setShowInstructions] = useState(false);

  const handleBack = () => {
    triggerHaptic('light');
    if (onBack) {
      onBack();
    } else {
      selectGame(null);
    }
  };

  const toggleInstructions = () => {
    triggerHaptic('light');
    setShowInstructions(prev => !prev);
  };

  return (
    <div style={{ width: '100%', marginBottom: '1rem' }}>
      {/* Main Top Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        background: '#ffffff',
        border: '2px solid #ddd6fe',
        borderRadius: '20px',
        padding: '0.6rem 1rem',
        boxShadow: '0 4px 14px rgba(124, 58, 237, 0.08)'
      }}>
        {/* Left: Back Button & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={handleBack}
            className="btn-cute btn-cute-secondary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', minHeight: '38px' }}
            title="Exit Game to Lobby"
          >
            <ArrowLeft size={16} />
            <span style={{ fontFamily: 'var(--font-cute)' }}>Lobby</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '1.4rem' }}>{emoji}</span>
            <h2 style={{
              fontFamily: 'var(--font-world)',
              fontSize: '1.2rem',
              color: '#1e1b4b',
              margin: 0,
              lineHeight: 1.2
            }}>
              {title}
            </h2>
          </div>
        </div>

        {/* Right: Instructions Button, Players & Extra Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {extraRight}

          {isConnected && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.78rem',
              background: '#f3e8ff',
              color: '#6d28d9',
              padding: '0.3rem 0.7rem',
              borderRadius: '50px',
              fontWeight: 700,
              fontFamily: 'var(--font-cute)'
            }}>
              {role === 'host' ? <Crown size={12} color="#7c3aed" /> : <Wifi size={12} color="#059669" />}
              <span>{playerName}</span>
              <span style={{ opacity: 0.6 }}>vs</span>
              <span>{opponentName || 'Partner'}</span>
            </div>
          )}

          <button
            onClick={toggleInstructions}
            className="btn-cute btn-cute-secondary"
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.82rem',
              minHeight: '38px',
              backgroundColor: showInstructions ? '#f3e8ff' : '#ffffff',
              borderColor: showInstructions ? '#7c3aed' : '#ddd6fe',
              color: showInstructions ? '#7c3aed' : '#4c1d95'
            }}
          >
            {showInstructions ? <ChevronUp size={15} /> : <HelpCircle size={15} />}
            <span>How to Play</span>
          </button>
        </div>
      </div>

      {/* Expandable Instructions Drawer */}
      {showInstructions && (
        <div className="instruction-drawer" style={{ marginTop: '0.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 700,
            color: '#7c3aed',
            fontSize: '0.95rem',
            fontFamily: 'var(--font-cute)'
          }}>
            <HelpCircle size={16} /> How to Play {title} {emoji}
          </div>
          <ul>
            {instructions.map((inst, index) => (
              <li key={index}>{inst}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
