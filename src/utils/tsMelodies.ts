// Taylor Swift Songs Melody Synthesizer (Web Audio API)

export interface Song {
  id: string;
  title: string;
  album: string;
  year: string;
  emoji: string;
  accentColor: string;
  notes: { note: string; duration: number }[]; // Note frequency name + beat duration
  bpm: number;
}

// Frequency mapping for musical notes
const NOTE_FREQS: Record<string, number> = {
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
  'REST': 0
};

export const TAYLOR_SWIFT_SONGS: Song[] = [
  {
    id: 'lover',
    title: 'Lover 💗',
    album: 'Lover (2019)',
    year: '2019',
    emoji: '💗',
    accentColor: '#f472b6',
    bpm: 68,
    notes: [
      { note: 'G4', duration: 1 }, { note: 'A4', duration: 1 }, { note: 'B4', duration: 1 },
      { note: 'D5', duration: 2 }, { note: 'B4', duration: 1 }, { note: 'A4', duration: 1 },
      { note: 'G4', duration: 2 }, { note: 'E4', duration: 2 }, { note: 'G4', duration: 2 },
      { note: 'A4', duration: 2 }, { note: 'REST', duration: 1 },
      { note: 'G4', duration: 1 }, { note: 'A4', duration: 1 }, { note: 'B4', duration: 1 },
      { note: 'D5', duration: 2 }, { note: 'E5', duration: 2 }, { note: 'D5', duration: 2 },
    ]
  },
  {
    id: 'love-story',
    title: 'Love Story 🏰',
    album: 'Fearless (2008)',
    year: '2008',
    emoji: '🏰',
    accentColor: '#facc15',
    bpm: 119,
    notes: [
      { note: 'D4', duration: 1 }, { note: 'F#4', duration: 1 }, { note: 'A4', duration: 1 },
      { note: 'D5', duration: 2 }, { note: 'C#5', duration: 1 }, { note: 'B4', duration: 1 },
      { note: 'A4', duration: 2 }, { note: 'F#4', duration: 1 }, { note: 'G4', duration: 1 },
      { note: 'A4', duration: 2 }, { note: 'F#4', duration: 2 }, { note: 'E4', duration: 2 },
      { note: 'D4', duration: 3 }, { note: 'REST', duration: 1 }
    ]
  },
  {
    id: 'cruel-summer',
    title: 'Cruel Summer ☀️',
    album: 'Lover (2019)',
    year: '2019',
    emoji: '☀️',
    accentColor: '#38bdf8',
    bpm: 170,
    notes: [
      { note: 'E5', duration: 1 }, { note: 'E5', duration: 1 }, { note: 'E5', duration: 1 },
      { note: 'D5', duration: 1 }, { note: 'C5', duration: 1 }, { note: 'A4', duration: 2 },
      { note: 'C5', duration: 1 }, { note: 'D5', duration: 1 }, { note: 'E5', duration: 2 },
      { note: 'G5', duration: 2 }, { note: 'E5', duration: 2 }, { note: 'D5', duration: 2 },
      { note: 'C5', duration: 3 }, { note: 'REST', duration: 1 }
    ]
  },
  {
    id: 'enchanted',
    title: 'Enchanted ✨',
    album: 'Speak Now (2010)',
    year: '2010',
    emoji: '✨',
    accentColor: '#c084fc',
    bpm: 82,
    notes: [
      { note: 'A4', duration: 1 }, { note: 'C5', duration: 1 }, { note: 'E5', duration: 2 },
      { note: 'D5', duration: 1 }, { note: 'C5', duration: 1 }, { note: 'A4', duration: 2 },
      { note: 'G4', duration: 1 }, { note: 'A4', duration: 1 }, { note: 'C5', duration: 2 },
      { note: 'D5', duration: 2 }, { note: 'E5', duration: 3 }, { note: 'REST', duration: 1 }
    ]
  },
  {
    id: 'cardigan',
    title: 'Cardigan 🧶',
    album: 'Folklore (2020)',
    year: '2020',
    emoji: '🧶',
    accentColor: '#a7f3d0',
    bpm: 130,
    notes: [
      { note: 'C4', duration: 1 }, { note: 'E4', duration: 1 }, { note: 'G4', duration: 2 },
      { note: 'A4', duration: 2 }, { note: 'G4', duration: 1 }, { note: 'E4', duration: 1 },
      { note: 'D4', duration: 2 }, { note: 'C4', duration: 3 }, { note: 'REST', duration: 1 }
    ]
  },
  {
    id: 'style',
    title: 'Style 🕶️',
    album: '1989 (2014)',
    year: '2014',
    emoji: '🕶️',
    accentColor: '#60a5fa',
    bpm: 95,
    notes: [
      { note: 'D4', duration: 1 }, { note: 'D4', duration: 1 }, { note: 'F4', duration: 1 },
      { note: 'A4', duration: 2 }, { note: 'G4', duration: 1 }, { note: 'F4', duration: 1 },
      { note: 'D4', duration: 2 }, { note: 'C4', duration: 2 }, { note: 'D4', duration: 3 }
    ]
  },
  {
    id: 'blank-space',
    title: 'Blank Space ✍️',
    album: '1989 (2014)',
    year: '2014',
    emoji: '✍️',
    accentColor: '#f472b6',
    bpm: 96,
    notes: [
      { note: 'F4', duration: 1 }, { note: 'F4', duration: 1 }, { note: 'A4', duration: 1 },
      { note: 'C5', duration: 2 }, { note: 'A4', duration: 1 }, { note: 'F4', duration: 2 },
      { note: 'G4', duration: 1 }, { note: 'A4', duration: 2 }, { note: 'REST', duration: 1 }
    ]
  },
  {
    id: 'bejeweled',
    title: 'Bejeweled 💎',
    album: 'Midnights (2022)',
    year: '2022',
    emoji: '💎',
    accentColor: '#818cf8',
    bpm: 108,
    notes: [
      { note: 'C5', duration: 1 }, { note: 'E5', duration: 1 }, { note: 'G5', duration: 2 },
      { note: 'E5', duration: 1 }, { note: 'C5', duration: 1 }, { note: 'D5', duration: 2 },
      { note: 'C5', duration: 2 }, { note: 'A4', duration: 2 }, { note: 'C5', duration: 3 }
    ]
  }
];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentSongIndex: number = 0;
  private noteIndex: number = 0;
  private timerId: number | null = null;
  private onNoteCallback: ((note: string, song: Song) => void) | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playSong(index: number, onNote?: (note: string, song: Song) => void) {
    this.initCtx();
    this.stop();

    this.currentSongIndex = (index + TAYLOR_SWIFT_SONGS.length) % TAYLOR_SWIFT_SONGS.length;
    this.noteIndex = 0;
    this.isPlaying = true;
    this.onNoteCallback = onNote || null;

    this.playNextNote();
  }

  private playNextNote = () => {
    if (!this.isPlaying || !this.ctx) return;

    const song = TAYLOR_SWIFT_SONGS[this.currentSongIndex];
    if (!song) return;

    const noteObj = song.notes[this.noteIndex % song.notes.length];
    const freq = NOTE_FREQS[noteObj.note.replace('#', 'S')] || NOTE_FREQS[noteObj.note] || (noteObj.note.includes('F#') ? 369.99 : noteObj.note.includes('C#') ? 277.18 : 0);

    if (freq > 0) {
      this.playSynthNote(freq, noteObj.duration * (60 / song.bpm) * 0.85);
    }

    if (this.onNoteCallback) {
      this.onNoteCallback(noteObj.note, song);
    }

    this.noteIndex++;
    const stepDelayMs = (noteObj.duration * (60 / song.bpm)) * 1000;

    this.timerId = window.setTimeout(this.playNextNote, stepDelayMs);
  };

  private playSynthNote(freq: number, durationSeconds: number) {
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc2.type = 'triangle';

      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc2.frequency.setValueAtTime(freq * 0.5, this.ctx.currentTime); // Sub-octave warmth

      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + durationSeconds);
      osc2.stop(now + durationSeconds);
    } catch (e) {
      // audio error failover
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public toggle(onNote?: (note: string, song: Song) => void) {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.playSong(this.currentSongIndex, onNote);
    }
    return this.isPlaying;
  }

  public getCurrentSong(): Song {
    return TAYLOR_SWIFT_SONGS[this.currentSongIndex];
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getSongIndex(): number {
    return this.currentSongIndex;
  }
}

export const musicEngine = new AudioEngine();
