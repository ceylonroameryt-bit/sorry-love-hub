import React, { useState, useEffect } from 'react';
import { musicEngine, TAYLOR_SWIFT_SONGS, type Song } from '../utils/tsMelodies';
import { triggerHaptic } from '../utils/haptics';
import { Play, Pause, SkipForward, SkipBack, Sparkles, ChevronDown } from 'lucide-react';

export const TaylorMusicWidget: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song>(TAYLOR_SWIFT_SONGS[0]);
  const [expanded, setExpanded] = useState(false);
  const [activeNote, setActiveNote] = useState<string>('');

  useEffect(() => {
    // Keep widget state in sync with engine
    setIsPlaying(musicEngine.getIsPlaying());
    setCurrentSong(musicEngine.getCurrentSong());
  }, []);

  const handleTogglePlay = () => {
    triggerHaptic('pop');
    const playing = musicEngine.toggle((note, song) => {
      setActiveNote(note);
      setCurrentSong(song);
    });
    setIsPlaying(playing);
  };

  const handleNext = () => {
    triggerHaptic('light');
    const nextIdx = (musicEngine.getSongIndex() + 1) % TAYLOR_SWIFT_SONGS.length;
    musicEngine.playSong(nextIdx, (note, song) => {
      setActiveNote(note);
      setCurrentSong(song);
    });
    setIsPlaying(true);
    setCurrentSong(TAYLOR_SWIFT_SONGS[nextIdx]);
  };

  const handlePrev = () => {
    triggerHaptic('light');
    const prevIdx = (musicEngine.getSongIndex() - 1 + TAYLOR_SWIFT_SONGS.length) % TAYLOR_SWIFT_SONGS.length;
    musicEngine.playSong(prevIdx, (note, song) => {
      setActiveNote(note);
      setCurrentSong(song);
    });
    setIsPlaying(true);
    setCurrentSong(TAYLOR_SWIFT_SONGS[prevIdx]);
  };

  const handleSelectSong = (idx: number) => {
    triggerHaptic('medium');
    musicEngine.playSong(idx, (note, song) => {
      setActiveNote(note);
      setCurrentSong(song);
    });
    setIsPlaying(true);
    setCurrentSong(TAYLOR_SWIFT_SONGS[idx]);
    setExpanded(false);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9990,
      width: 'calc(100% - 32px)',
      maxWidth: '420px',
    }}>
      {/* ── Expanded Playlist Drawer ── */}
      {expanded && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1.5px solid rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          padding: '1.2rem',
          marginBottom: '10px',
          boxShadow: '0 20px 50px rgba(139, 92, 246, 0.22), 0 4px 20px rgba(0,0,0,0.06)',
          animation: 'pop-in 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <span style={{
              fontFamily: 'var(--font-world)',
              color: '#1e1b4b',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Sparkles size={16} color="#ec4899" /> Taylor Swift Radio 💖
            </span>
            <button
              onClick={() => { triggerHaptic('light'); setExpanded(false); }}
              style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px' }}
            >
              <ChevronDown size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
            {TAYLOR_SWIFT_SONGS.map((song, i) => {
              const isSelected = currentSong.id === song.id;
              return (
                <button
                  key={song.id}
                  onClick={() => handleSelectSong(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.9rem',
                    borderRadius: '14px',
                    border: isSelected ? '1.5px solid #a855f7' : '1px solid rgba(168, 85, 247, 0.12)',
                    background: isSelected ? 'rgba(245, 243, 255, 0.95)' : 'rgba(255, 255, 255, 0.6)',
                    color: '#1e1b4b',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.4rem' }}>{song.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? '#7c3aed' : '#1e1b4b' }}>
                        {song.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#6b7280', fontFamily: 'var(--font-cute)' }}>
                        {song.album}
                      </div>
                    </div>
                  </div>
                  {isSelected && isPlaying && (
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '16px' }}>
                      <div style={{ width: '3px', background: '#a855f7', height: '100%', animation: 'pulse-gentle 0.4s infinite alternate' }} />
                      <div style={{ width: '3px', background: '#a855f7', height: '60%', animation: 'pulse-gentle 0.6s infinite alternate' }} />
                      <div style={{ width: '3px', background: '#a855f7', height: '80%', animation: 'pulse-gentle 0.5s infinite alternate' }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Apple Dynamic Island Pill (Light Glass) ── */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(255, 255, 255, 0.95)',
        borderRadius: '50px',
        padding: '0.55rem 1rem 0.55rem 0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 12px 35px rgba(139, 92, 246, 0.18), 0 4px 15px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}>
        {/* Left: Album Artwork + Details */}
        <div
          onClick={() => { triggerHaptic('light'); setExpanded(e => !e); }}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1, minWidth: 0 }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            boxShadow: '0 4px 10px rgba(168,85,247,0.3)',
            flexShrink: 0,
            animation: isPlaying ? 'wiggle 2s ease-in-out infinite' : 'none',
          }}>
            {currentSong.emoji}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#1e1b4b',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontFamily: 'var(--font-cute)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <span>{currentSong.title}</span>
            </div>
            <div style={{
              fontSize: '0.68rem',
              color: '#6b7280',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontFamily: 'var(--font-cute)',
            }}>
              {isPlaying ? `🎵 Playing • ${activeNote || 'synth'}` : 'Tap to play Taylor Swift 💖'}
            </div>
          </div>
        </div>

        {/* Right: Audio Waveform & Player Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
          {/* Animated Waveform indicator */}
          {isPlaying && (
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center', height: '14px', marginRight: '4px' }}>
              <span style={{ width: '2px', height: '12px', background: '#a855f7', borderRadius: '2px', animation: 'pulse-gentle 0.4s infinite alternate' }} />
              <span style={{ width: '2px', height: '8px', background: '#ec4899', borderRadius: '2px', animation: 'pulse-gentle 0.7s infinite alternate' }} />
              <span style={{ width: '2px', height: '14px', background: '#a855f7', borderRadius: '2px', animation: 'pulse-gentle 0.5s infinite alternate' }} />
            </div>
          )}

          <button
            onClick={handlePrev}
            style={{
              background: 'rgba(168, 85, 247, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4c1d95',
              cursor: 'pointer',
            }}
          >
            <SkipBack size={14} />
          </button>

          <button
            onClick={handleTogglePlay}
            style={{
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(168,85,247,0.35)',
              transition: 'transform 0.15s active',
            }}
          >
            {isPlaying ? <Pause size={16} fill="#fff" /> : <Play size={16} fill="#fff" style={{ marginLeft: '2px' }} />}
          </button>

          <button
            onClick={handleNext}
            style={{
              background: 'rgba(168, 85, 247, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4c1d95',
              cursor: 'pointer',
            }}
          >
            <SkipForward size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
