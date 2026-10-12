import { motion, AnimatePresence } from "motion/react";
import { Mic, Power, AlertTriangle, Disc } from "lucide-react";
import { ZoyaState } from "../types";

interface ZoyaOrbProps {
  state: ZoyaState;
  micVolume: number;
  speakerVolume: number;
  sassLevel?: number;
  onToggle: () => void;
}

const PARTICLES = Array.from({ length: 24 }, (_, i) => {
  const angle = (i * 360) / 24;
  const rad = (angle * Math.PI) / 180;
  const baseRadius = 105 + (i % 3) * 28;
  const size = 5 + (i % 4) * 3;
  const delay = (i % 6) * 0.15;
  return { id: `particle-${i}`, rad, baseRadius, size, delay, index: i };
});

const getParticleStyle = (index: number, sass: number) => {
  // Sass intensity 1 to 5 shifts ratio from purple (#c084fc, #a855f7) to rose (#f43f5e, #fb7185, #e11d48)
  const roseColors = [
    "bg-rose-500 shadow-[0_0_14px_#f43f5e]",
    "bg-rose-400 shadow-[0_0_16px_#fb7185]",
    "bg-pink-500 shadow-[0_0_14px_#ec4899]",
    "bg-red-500 shadow-[0_0_16px_#ef4444]",
  ];
  const purpleColors = [
    "bg-purple-500 shadow-[0_0_14px_#a855f7]",
    "bg-purple-400 shadow-[0_0_16px_#c084fc]",
    "bg-violet-500 shadow-[0_0_14px_#8b5cf6]",
    "bg-indigo-400 shadow-[0_0_14px_#818cf8]",
  ];

  const roseThreshold = (sass - 1) / 4; // 0.0 at sass 1, 0.5 at sass 3, 1.0 at sass 5
  const isRose = (index * 17) % 100 < roseThreshold * 100;
  return isRose
    ? roseColors[index % roseColors.length]
    : purpleColors[index % purpleColors.length];
};

export default function ZoyaOrb({ state, micVolume, speakerVolume, sassLevel = 3, onToggle }: ZoyaOrbProps) {
  // Determine primary colors and gradients based on Zoya's state
  const getOrbStyle = () => {
    switch (state) {
      case "disconnected":
        return {
          bg: "bg-slate-800/40 border-slate-700/50",
          glow: "shadow-[0_0_30px_rgba(71,85,105,0.2)]",
          innerGlow: "from-slate-700/50 to-slate-900/50",
          textColor: "text-slate-400",
          ringColor: "border-slate-800",
        };
      case "connecting":
        return {
          bg: "bg-amber-950/20 border-amber-500/30",
          glow: "shadow-[0_0_50px_rgba(245,158,11,0.35)]",
          innerGlow: "from-amber-500/40 via-purple-600/30 to-transparent",
          textColor: "text-amber-400 animate-pulse",
          ringColor: "border-amber-500/50",
        };
      case "listening":
        // Cyan/Teal glow that reacts to mic volume
        const micScaleGlow = 35 + micVolume * 95;
        return {
          bg: "bg-cyan-950/20 border-cyan-500/40",
          glow: `shadow-[0_0_${micScaleGlow}px_rgba(6,182,212,0.7)]`,
          innerGlow: "from-cyan-400/50 via-teal-500/30 to-transparent",
          textColor: "text-cyan-400",
          ringColor: "border-cyan-400/60",
          glowColor: "rgba(6,182,212,0.45)",
        };
      case "speaking":
        // Pink/Magenta/Sassy rose glow that reacts to speaker volume with organic intensity
        const speakerScaleGlow = 45 + speakerVolume * 130;
        return {
          bg: "bg-rose-950/20 border-rose-500/40",
          glow: `shadow-[0_0_${speakerScaleGlow}px_rgba(244,63,94,0.8)]`,
          innerGlow: "from-rose-500/60 via-pink-600/40 to-transparent",
          textColor: "text-rose-400",
          ringColor: "border-rose-400/60",
          glowColor: "rgba(244,63,94,0.55)",
        };
      case "error":
        return {
          bg: "bg-red-950/30 border-red-500/50",
          glow: "shadow-[0_0_40px_rgba(239,68,68,0.5)]",
          innerGlow: "from-red-500/40 to-transparent",
          textColor: "text-red-400",
          ringColor: "border-red-500/50",
          glowColor: "rgba(239,68,68,0.4)",
        };
      default:
        return {
          bg: "bg-purple-950/20 border-purple-500/30",
          glow: "shadow-[0_0_30px_rgba(168,85,247,0.3)]",
          innerGlow: "from-purple-500/30 to-transparent",
          textColor: "text-purple-400",
          ringColor: "border-purple-500/40",
          glowColor: "rgba(168,85,247,0.3)",
        };
    }
  };

  const style = getOrbStyle();

  // Volume scale calculations with organic breathing headroom
  const scaleValue = 
    state === "listening" 
      ? 1 + micVolume * 0.45 
      : state === "speaking" 
        ? 1 + speakerVolume * 0.6 
        : 1;

  // Dynamic physics-based glow scale for organic breathing pulse
  const glowScale =
    state === "speaking"
      ? 1 + speakerVolume * 0.85
      : state === "listening"
        ? 1 + micVolume * 0.6
        : 1;

  // Dynamic opacity for the physics glow layer
  const glowOpacity =
    state === "speaking"
      ? Math.min(1, 0.45 + speakerVolume * 0.8)
      : state === "listening"
        ? Math.min(1, 0.35 + micVolume * 0.7)
        : 0.25;

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      {/* Background Ripple Rings */}
      <AnimatePresence>
        {state !== "disconnected" && (
          <>
            {/* Ring 1 */}
            <motion.div
              key="ring-1"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: state === "speaking" ? [1, 1.4, 1.8] : [1, 1.3, 1.6],
                opacity: state === "speaking" ? [0.4, 0.2, 0] : [0.3, 0.1, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: state === "speaking" ? 1.5 : 2.5,
                repeat: Infinity,
                ease: "easeOut",
              }}
              className={`absolute w-72 h-72 rounded-full border ${style.ringColor} pointer-events-none`}
            />

            {/* Ring 2 */}
            <motion.div
              key="ring-2"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{
                scale: state === "listening" ? [1, 1.5] : [1, 1.25, 1.5],
                opacity: state === "listening" ? [0.25, 0] : [0.2, 0.05, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: state === "speaking" ? 2 : 3,
                delay: 0.8,
                repeat: Infinity,
                ease: "easeOut",
              }}
              className={`absolute w-80 h-80 rounded-full border border-dashed ${style.ringColor} pointer-events-none`}
            />
          </>
        )}
      </AnimatePresence>

      {/* Particle Effect System shifting between rose and purple based on Sass Intensity */}
      <AnimatePresence>
        {state !== "disconnected" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            {PARTICLES.map((p) => {
              const activeRadius =
                state === "speaking"
                  ? p.baseRadius + speakerVolume * 140
                  : state === "listening"
                    ? p.baseRadius + micVolume * 45
                    : p.baseRadius * 0.85;

              const x = Math.cos(p.rad) * activeRadius;
              const y = Math.sin(p.rad) * activeRadius;
              const colorClass = getParticleStyle(p.index, sassLevel);

              return (
                <motion.div
                  key={p.id}
                  animate={{
                    x: [x * 0.88, x, x * 1.1, x * 0.88],
                    y: [y * 0.88, y, y * 1.1, y * 0.88],
                    scale:
                      state === "speaking"
                        ? [1, 1.7 + speakerVolume * 1.3, 1]
                        : [0.8, 1.15, 0.8],
                    opacity:
                      state === "speaking"
                        ? [0.65, 0.95, 0.7]
                        : state === "listening"
                          ? [0.3, 0.65, 0.3]
                          : 0.2,
                  }}
                  transition={{
                    duration: state === "speaking" ? 1.5 : 3.2,
                    delay: p.delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                  }}
                  className={`absolute rounded-full ${colorClass}`}
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Physics-Based Spring Glow Ring reacting to Speaker & Mic Volume */}
      <motion.div
        animate={{
          scale: glowScale,
          opacity: glowOpacity,
        }}
        transition={{
          type: "spring",
          stiffness: 120,
          damping: 14,
          mass: 0.8,
        }}
        style={{
          boxShadow: `0 0 80px 30px ${style.glowColor || "rgba(168,85,247,0.3)"}`,
        }}
        className="absolute w-52 h-52 rounded-full pointer-events-none transition-colors duration-300"
      />

      {/* Main Core Orb */}
      <motion.button
        id="zoya-main-orb-btn"
        onClick={onToggle}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        animate={{
          scale: scaleValue,
        }}
        transition={{
          type: "spring",
          stiffness: 140,
          damping: 14,
          mass: 0.9,
        }}
        className={`relative z-10 w-52 h-52 rounded-full flex items-center justify-center border-2 transition-all duration-300 backdrop-blur-md cursor-pointer ${style.bg} ${style.glow}`}
      >
        {/* Inner Radial Glow Layer with dynamic spring opacity */}
        <motion.div
          animate={{
            opacity: state === "speaking" ? 0.65 + speakerVolume * 0.35 : 0.7,
            scale: state === "speaking" ? 1 + speakerVolume * 0.15 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 160,
            damping: 16,
          }}
          className={`absolute inset-1 rounded-full bg-gradient-to-tr ${style.innerGlow} blur-md pointer-events-none`}
        />

        {/* Central State Icon */}
        <div className="relative z-20 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {state === "disconnected" && (
              <motion.div
                key="disconnected-icon"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center"
              >
                <Power className="w-12 h-12 text-slate-400 group-hover:text-slate-300" />
                <span className="text-xs font-mono tracking-wider text-slate-500 mt-2">TAP TO WAKE</span>
              </motion.div>
            )}

            {state === "connecting" && (
              <motion.div
                key="connecting-icon"
                initial={{ rotate: 0, opacity: 0 }}
                animate={{ rotate: 360, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Disc className="w-14 h-14 text-amber-400" />
              </motion.div>
            )}

            {state === "listening" && (
              <motion.div
                key="listening-icon"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.1, 1], opacity: 1 }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center"
              >
                <Mic className="w-14 h-14 text-cyan-400" />
                <span className="text-xs font-mono tracking-wider text-cyan-300/80 mt-2 animate-pulse">LISTENING</span>
              </motion.div>
            )}

            {state === "speaking" && (
              <motion.div
                key="speaking-icon"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className="flex items-center gap-1.5 h-10 mb-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: [12, 36 * (0.3 + speakerVolume * 0.7) * (i % 2 === 0 ? 0.7 : 1.1), 12],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                      className="w-1 bg-rose-400 rounded-full"
                    />
                  ))}
                </div>
                <span className="text-xs font-mono tracking-wider text-rose-300/80">SPEAKING</span>
              </motion.div>
            )}

            {state === "error" && (
              <motion.div
                key="error-icon"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center"
              >
                <AlertTriangle className="w-12 h-12 text-red-500" />
                <span className="text-xs font-mono tracking-wider text-red-400 mt-2">RETRY</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>

      {/* Decorative Waveform beneath the Orb */}
      <div className="mt-12 h-16 w-64 flex items-center justify-center gap-1 overflow-hidden pointer-events-none">
        <AnimatePresence>
          {state !== "disconnected" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-1.5"
            >
              {Array.from({ length: 24 }).map((_, idx) => {
                const multiplier = Math.sin((idx / 24) * Math.PI);
                const isActive = state === "listening" || state === "speaking";
                const volume = state === "listening" ? micVolume : speakerVolume;
                
                return (
                  <motion.div
                    key={idx}
                    animate={{
                      height: isActive
                        ? [8, (12 + volume * 48) * multiplier, 8]
                        : [8, 12 + Math.sin(Date.now() / 200 + idx) * 8 * multiplier, 8],
                    }}
                    transition={{
                      duration: isActive ? 0.4 + (idx % 3) * 0.1 : 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className={`w-1 rounded-full ${
                      state === "listening"
                        ? "bg-cyan-500/40"
                        : state === "speaking"
                          ? "bg-rose-500/40"
                          : "bg-amber-500/20"
                    }`}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
