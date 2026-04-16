import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  Music,
  Gamepad2,
  Trophy,
  RefreshCcw,
  Zap
} from 'lucide-react';

// --- Constants & Types ---
const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 2;

type Point = { x: number; y: number };

const TRACKS = [
  {
    id: 1,
    title: "Neon Nights",
    artist: "AI Synth Hero",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://picsum.photos/seed/neon1/400/400"
  },
  {
    id: 2,
    title: "Cyber Runner",
    artist: "Digital Phantom",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://picsum.photos/seed/cyber/400/400"
  },
  {
    id: 3,
    title: "Digital Dream",
    artist: "Binary Soul",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://picsum.photos/seed/dream/400/400"
  }
];

// --- Utilities ---
const getRandomPoint = (): Point => ({
  x: Math.floor(Math.random() * GRID_SIZE),
  y: Math.floor(Math.random() * GRID_SIZE)
});

// --- Components ---

const SnakeGame = ({ onScoreChange }: { onScoreChange: (score: number) => void }) => {
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Point>({ x: 0, y: -1 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const resetGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(getRandomPoint());
    setDirection({ x: 0, y: -1 });
    setIsGameOver(false);
    setScore(0);
    setGameStarted(false);
    onScoreChange(0);
  }, [onScoreChange]);

  const moveSnake = useCallback(() => {
    if (isGameOver || !gameStarted) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE
      };

      // Check collision with self
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => {
          const newScore = s + 10;
          onScoreChange(newScore);
          return newScore;
        });
        setFood(getRandomPoint());
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isGameOver, gameStarted, onScoreChange]);

  useEffect(() => {
    if (gameStarted && !isGameOver) {
      const speed = Math.max(50, INITIAL_SPEED - score / SPEED_INCREMENT);
      gameLoopRef.current = setInterval(moveSnake, speed);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake, gameStarted, isGameOver, score]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted && e.key.startsWith('Arrow')) {
        setGameStarted(true);
      }
      
      switch (e.key) {
        case 'ArrowUp': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, gameStarted]);

  return (
    <div className="relative w-full aspect-square max-w-[500px] border-2 border-accent-cyan shadow-[0_0_30px_rgba(0,242,255,0.1)] rounded-sm overflow-hidden bg-accent-cyan/5">
      <div 
        className="grid w-full h-full" 
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const x = i % GRID_SIZE;
          const y = Math.floor(i / GRID_SIZE);
          const isSnake = snake.some(s => s.x === x && s.y === y);
          const isFood = food.x === x && food.y === y;
          const isHead = snake[0].x === x && snake[0].y === y;

          return (
            <div 
              key={i} 
              className={`w-full h-full border-[0.5px] border-white/5 flex items-center justify-center transition-all duration-200`}
            >
              {isSnake && (
                <motion.div 
                  layoutId={`snake-${x}-${y}`}
                  className={`w-[85%] h-[85%] rounded-[2px] ${isHead ? 'bg-accent-green shadow-[0_0_12px_var(--color-accent-green)]' : 'bg-accent-green/60'}`}
                />
              )}
              {isFood && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-[70%] h-[70%] rounded-full bg-accent-pink shadow-[0_0_15px_var(--color-accent-pink)]"
                />
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {!gameStarted && !isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-10 p-6 text-center"
          >
            <Gamepad2 className="w-16 h-16 text-accent-cyan mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-widest font-sans">Neon Synth</h2>
            <p className="text-accent-cyan/70 mb-6 text-sm">Use Arrow Keys to Navigate the Synth Grid</p>
            <button 
              onClick={() => setGameStarted(true)}
              className="px-8 py-3 bg-accent-cyan text-black font-bold rounded-full hover:bg-white transition-all shadow-[0_0_20px_var(--color-accent-cyan)] active:scale-95"
            >
              START SYSTEM
            </button>
          </motion.div>
        )}

        {isGameOver && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-lg z-20 p-6 text-center"
          >
            <Zap className="w-16 h-16 text-accent-pink mb-4" />
            <h2 className="text-4xl font-black text-accent-pink mb-2 uppercase italic tracking-tighter">System Failure</h2>
            <p className="text-white text-xl mb-1 font-mono">Final Score: {score}</p>
            <p className="text-text-secondary mb-8 text-sm uppercase tracking-widest font-sans">Game Over</p>
            <button 
              onClick={resetGame}
              className="flex items-center gap-2 px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-accent-cyan transition-all active:scale-95 group shadow-xl"
            >
              <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              REBOOT SYSTEM
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [showVisualizer, setShowVisualizer] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const track = TRACKS[currentTrackIndex];

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
    }
  }, [score, highScore]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [currentTrackIndex, volume, isPlaying]);

  return (
    <div className="h-screen bg-bg-primary text-white font-sans selection:bg-accent-cyan/30 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="h-[60px] relative z-10 px-10 flex items-center justify-between border-b border-border-subtle bg-bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black tracking-[2px] uppercase text-accent-cyan leading-none font-sans">NEON SYNTH</h1>
        </div>

        <div className="flex items-center gap-6 font-mono">
          <div className="bg-bg-card border border-accent-pink px-3 py-1 rounded shadow-[0_0_10px_rgba(255,0,123,0.2)]">
            <span className="text-[0.7rem] text-text-secondary uppercase tracking-widest mr-2">Score:</span>
            <span className="text-accent-cyan tabular-nums">{String(score).padStart(4, '0')}</span>
          </div>
          <div className="bg-bg-card border border-accent-pink px-3 py-1 rounded shadow-[0_0_10px_rgba(255,0,123,0.2)]">
            <span className="text-[0.7rem] text-text-secondary uppercase tracking-widest mr-2">High:</span>
            <span className="text-accent-pink tabular-nums">{String(highScore).padStart(4, '0')}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 grid grid-cols-[300px_1fr] overflow-hidden">
        
        {/* Sidebar: Playlist */}
        <aside className="bg-bg-card border-r border-border-subtle p-[30px] flex flex-col overflow-y-auto">
          <h3 className="text-[0.7rem] font-bold text-text-secondary uppercase tracking-[2px] mb-5">AI GENERATED TRACKS</h3>
          <div className="flex flex-col gap-2">
            {TRACKS.map((t, index) => (
              <button
                key={t.id}
                onClick={() => {
                  setCurrentTrackIndex(index);
                  setIsPlaying(true);
                }}
                className={`flex flex-col items-start p-3 rounded-lg transition-all text-left border-l-3 ${
                  currentTrackIndex === index 
                    ? 'bg-accent-cyan/10 border-accent-cyan' 
                    : 'border-transparent hover:bg-white/5'
                }`}
              >
                <span className={`text-[0.9rem] font-semibold ${currentTrackIndex === index ? 'text-accent-cyan' : 'text-white'}`}>
                  {t.title}
                </span>
                <span className="text-[0.75rem] text-text-secondary mt-0.5">
                  {t.artist} • 03:22
                </span>
              </button>
            ))}
          </div>

          <div className="mt-auto pt-6 border-t border-border-subtle/50">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-[0.7rem] font-bold text-text-secondary uppercase tracking-[2px]">VISUALIZER</h3>
                <button 
                  onClick={() => setShowVisualizer(!showVisualizer)}
                  className={`text-[8px] px-1.5 py-0.5 rounded cursor-pointer ${showVisualizer ? 'bg-accent-cyan text-black' : 'bg-white/10 text-white'}`}
                >
                  {showVisualizer ? 'ON' : 'OFF'}
                </button>
             </div>
             <div className="h-16 flex items-end justify-between gap-1 overflow-hidden">
                {Array.from({ length: 15 }).map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ 
                      height: isPlaying && showVisualizer ? [8, Math.random() * 40 + 8, 4, Math.random() * 30 + 8] : 2 
                    }}
                    transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.5, ease: "easeInOut" }}
                    className="flex-1 bg-accent-cyan rounded-t-[1px]"
                  />
                ))}
             </div>
          </div>
        </aside>

        {/* Game Viewport */}
        <section className="flex items-center justify-center bg-[radial-gradient(circle_at_center,_#1a1a24_0%,_#050507_100%)] relative">
          <SnakeGame onScoreChange={setScore} />
          <div className="absolute bottom-10 text-text-secondary text-[0.7rem] tracking-[1px] uppercase">
             Use arrow keys to navigate the synth grid
          </div>
        </section>
      </main>

      {/* Audio Element */}
      <audio 
        ref={audioRef} 
        src={track.url} 
        onEnded={nextTrack}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Footer Controls */}
      <footer className="h-[100px] relative z-10 px-10 bg-[#0c0c11] border-t border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-4 w-[250px]">
          <div className="w-[50px] h-[50px] rounded bg-gradient-to-br from-accent-pink to-accent-cyan flex items-center justify-center overflow-hidden">
            <img 
              src={track.cover} 
              alt={track.title} 
              className={`w-full h-full object-cover opacity-80 ${isPlaying ? 'animate-[spin_20s_linear_infinite]' : ''}`} 
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="overflow-hidden">
            <p className="text-[0.85rem] font-semibold truncate leading-tight">{track.title}</p>
            <p className="text-[0.7rem] text-text-secondary truncate">{track.artist}</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-[30px]">
            <button 
              onClick={prevTrack}
              className="text-white/70 hover:text-white transition-colors text-xl"
            >
              ⏮
            </button>
            <button 
              onClick={togglePlay}
              className="w-[45px] h-[45px] rounded-full bg-white text-bg-primary flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            >
              {isPlaying ? <Pause className="fill-current w-5 h-5" /> : <Play className="fill-current w-5 h-5 ml-0.5" />}
            </button>
            <button 
              onClick={nextTrack}
              className="text-white/70 hover:text-white transition-colors text-xl"
            >
              ⏭
            </button>
          </div>
          <div className="w-[400px] h-1 bg-border-subtle rounded-sm relative">
            <motion.div 
              animate={{ width: isPlaying ? '100%' : '0%' }}
              transition={{ duration: 180, ease: "linear" }}
              className="absolute left-0 top-0 h-full bg-accent-cyan shadow-[0_0_8px_var(--color-accent-cyan)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-[250px] justify-end">
          <span className="text-[0.7rem] text-text-secondary uppercase">vol</span>
          <div className="w-[100px] h-1 bg-border-subtle rounded-sm relative group">
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
            />
            <div 
              style={{ width: `${volume * 100}%` }}
              className="h-full bg-accent-cyan shadow-[0_0_8px_var(--color-accent-cyan)]"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
