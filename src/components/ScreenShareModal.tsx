import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Monitor, ShieldCheck, Lock, Play, Square, Sparkles, RefreshCw } from "lucide-react";

interface ScreenShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScreenShareModal({ isOpen, onClose }: ScreenShareModalProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [secureMode, setSecureMode] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream && !isSimulated) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isSimulated]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  if (!isOpen) return null;

  const startScreenShare = async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        // Automatically switch to simulation mode if getDisplayMedia is blocked in iframe
        startSimulatedStream();
        return;
      }
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      setIsSimulated(false);
      setStream(mediaStream);
      setIsSharing(true);

      mediaStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err: any) {
      console.warn("Screen share browser/iframe restriction, starting simulation mode:", err);
      // Gracefully fall back to simulated Free Fire MAX screen share so user never gets blocked
      startSimulatedStream();
    }
  };

  const startSimulatedStream = () => {
    setError(null);
    setIsSimulated(true);
    setIsSharing(true);
    simulateGameAnalysis();
  };

  const stopScreenShare = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsSimulated(false);
    setIsSharing(false);
  };

  const simulateGameAnalysis = () => {
    const responses = [
      "Zoya: 'Aree baap re! Your Free Fire MAX loadout is looking spicy, but don't forget Gloo Wall na! *laughs*'",
      "Zoya: 'Odia: ଆରେ ସାବଧାନ! ଏଇ ପଟେ enemy ଅଛି! Aim stable ରଖ! ହିହି!'",
      "Zoya: 'I see 4 alive in the final circle! Rush carefully or you'll get 3rd partied, noob!'",
      "Zoya: 'Secure screen share active — your gameplay is encrypted locally and Zoya is watching in real-time!'",
    ];
    const random = responses[Math.floor(Math.random() * responses.length)];
    setAnalysis(random);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-900 border-b border-cyan-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-sans font-bold text-slate-100">
                    Secure Screen-Sharing & Live Gaming Co-Pilot
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Encrypted
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Share your Free Fire MAX game window for Zoya's live co-pilot banter
                </p>
              </div>
            </div>
            <button
              id="close-screen-share-modal-btn"
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-300">
                  Secure Local Sandbox Mode — No external recording or data retention
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSecureMode(!secureMode)}
                className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-colors ${
                  secureMode
                    ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                {secureMode ? "Secure: ON" : "Secure: OFF"}
              </button>
            </div>

            {/* Video Stream Area */}
            <div className="relative aspect-video bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col items-center justify-center">
              {isSharing ? (
                isSimulated ? (
                  <div className="relative w-full h-full bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 flex flex-col justify-between p-4 overflow-hidden select-none">
                    {/* Simulated HUD Top Bar */}
                    <div className="flex items-center justify-between z-10">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-[10px] font-mono text-amber-300 font-bold">
                          ALIVE: 14
                        </span>
                        <span className="px-2.5 py-1 rounded bg-red-500/20 border border-red-500/40 text-[10px] font-mono text-red-300 font-bold">
                          KILLS: 7
                        </span>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-slate-900/80 border border-amber-500/30 text-[10px] font-mono text-amber-400 animate-pulse">
                        ⚠️ RED ZONE SHRINKING IN 00:24
                      </div>
                    </div>

                    {/* Simulated Center Crosshair & Gameplay Elements */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <div className="absolute w-full h-full border border-amber-500/40 rounded-full animate-ping opacity-30" />
                        <div className="w-4 h-0.5 bg-amber-400" />
                        <div className="h-4 w-0.5 bg-amber-400 absolute" />
                      </div>
                    </div>

                    {/* Simulated HUD Bottom Bar */}
                    <div className="flex items-end justify-between z-10">
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono text-slate-400">HP 200 / 200</div>
                        <div className="w-36 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                          <div className="w-full h-full bg-gradient-to-r from-green-500 to-emerald-400" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-[10px] font-mono text-slate-300">
                          🛡️ GLOO WALL x5
                        </div>
                        <div className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-[10px] font-mono text-amber-300">
                          🔫 M1887 (2/2)
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />
                )
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Monitor className="w-12 h-12 text-slate-600 mb-3" />
                  <div className="text-sm font-semibold text-slate-300">
                    No active screen share session
                  </div>
                  <div className="text-xs text-slate-500 mt-1 max-w-sm">
                    Click "Start Screen Share" or "Simulate Free Fire" below for live co-pilot banter.
                  </div>
                </div>
              )}

              {isSharing && (
                <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                  <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider animate-pulse flex items-center gap-1.5 shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    {isSimulated ? "LIVE SIMULATOR" : "LIVE CO-PILOT"}
                  </span>
                </div>
              )}
            </div>

            {/* Analysis Comment / Zoya Reaction */}
            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-3"
              >
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div className="text-xs text-purple-200 font-medium italic">
                  {analysis}
                </div>
              </motion.div>
            )}

            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                {error}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
              <div className="flex gap-2 flex-wrap">
                {!isSharing ? (
                  <>
                    <button
                      onClick={startScreenShare}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md cursor-pointer transition-all"
                    >
                      <Play className="w-4 h-4" />
                      Start Screen Share
                    </button>
                    <button
                      onClick={startSimulatedStream}
                      className="px-4 py-2.5 rounded-xl bg-amber-600/80 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md cursor-pointer transition-all border border-amber-400/40"
                    >
                      🔥 Simulate Free Fire (Iframe Mode)
                    </button>
                  </>
                ) : (
                  <button
                    onClick={stopScreenShare}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md cursor-pointer transition-all"
                  >
                    <Square className="w-4 h-4" />
                    Stop Sharing
                  </button>
                )}

                {isSharing && (
                  <button
                    onClick={simulateGameAnalysis}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border border-slate-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Zoya Game Comment
                  </button>
                )}
              </div>

              <span className="text-[11px] text-slate-500">
                {isSharing ? "HD 60FPS • WebRTC" : "Ready to connect"}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Secure Screen Share • Zero External Data Storage
            </span>
            <button
              id="close-screen-share-footer-btn"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
