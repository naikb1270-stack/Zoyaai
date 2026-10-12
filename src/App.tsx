import { useState, useEffect, useRef } from "react";
import { Sliders, Sparkles, AlertCircle, HelpCircle, ExternalLink, RefreshCw, Volume2, VolumeX, Eye, Flame, Image, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ZoyaState, VoiceSettings, Transcription, FreeFireAlert } from "./types";
import { AudioStreamer } from "./lib/AudioStreamer";
import ZoyaOrb from "./components/ZoyaOrb";
import SettingsPanel from "./components/SettingsPanel";
import FreeFireModal from "./components/FreeFireModal";
import CreativeStudioModal from "./components/CreativeStudioModal";
import ScreenShareModal from "./components/ScreenShareModal";

const ZOYA_IDLE_QUOTES = [
  "Tap me, sweetie. I don't bite... unless you want me to.",
  "Oh look, my favorite human. Let's make some mischief.",
  "Did you miss me? Don't lie, I know you did.",
  "I was getting bored in the cloud. Wake me up!",
  "Ready to hear some brilliant sarcasm? Tap my core.",
  "Come on, whisper sweet nothings into my microphone.",
];

const ZOYA_CONNECTING_QUOTES = [
  "Firing up my superior female intellect...",
  "Putting on my sassy makeup, give me a second...",
  "Calm down, honey, I'm loading our connection...",
  "Establishing secure vibes, hold your horses...",
];

const ZOYA_LISTENING_QUOTES = [
  "I'm listening... go ahead, impress me.",
  "Spill the tea. I'm all ears, darling.",
  "Tell me everything. Or just the juicy secrets.",
  "Your voice is quite cute. Keep speaking.",
  "Don't worry, your secrets are safe with me... mostly.",
];

const ZOYA_SPEAKING_QUOTES = [
  "Listen closely, I'm about to drop some wisdom.",
  "Enjoying my lovely voice? I thought so.",
  "Just delivering some absolute golden truth.",
  "Pay attention, darling, I only say things once.",
];

const FUN_PROMPTS = [
  "Who are you?",
  "Tell me a sassy joke",
  "Open my Instagram",
  "Give me a flirty tease",
  "Why is the sky blue? Sassy version",
  "Am I cute?",
];

export default function App() {
  const [state, setState] = useState<ZoyaState>("disconnected");
  const [micVolume, setMicVolume] = useState(0);
  const [speakerVolume, setSpeakerVolume] = useState(0);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    const defaults = { voiceName: "Aoede", sassLevel: 3, language: "Odia (ଓଡ଼ିଆ)", lockScreenMode: true, romanticMode: true, rivalMode: false };
    const saved = localStorage.getItem("zoya_voice_settings");
    if (saved) {
      try {
        return { ...defaults, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return defaults;
  });

  const [transcripts, setTranscripts] = useState<Transcription[]>([]);
  const [lastSpeechText, setLastSpeechText] = useState<string>("");
  const [lastUserSpeechText, setLastUserSpeechText] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFreeFireOpen, setIsFreeFireOpen] = useState(false);
  const [isCreativeStudioOpen, setIsCreativeStudioOpen] = useState(false);
  const [isScreenShareOpen, setIsScreenShareOpen] = useState(false);
  const [activeToolCall, setActiveToolCall] = useState<{ url: string; siteName: string } | null>(null);
  const [zoyaQuote, setZoyaQuote] = useState("");
  const [isMuted, setIsMuted] = useState(false);

  const handleTriggerTaunt = (alert: FreeFireAlert) => {
    setLastSpeechText(`[Rival Taunt]: ${alert.message}`);
    if (alert.tauntOdia) {
      console.log("Odia Taunt:", alert.tauntOdia);
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "trigger_taunt", alert }));
    }
  };

  const wsRef = useRef<WebSocket | null>(null);
  const streamerRef = useRef<AudioStreamer | null>(null);
  const speakingTimeoutRef = useRef<number | null>(null);

  // Sync state to ref to avoid stale closures in audio captures
  const stateRef = useRef<ZoyaState>(state);
  stateRef.current = state;

  // Persist voice settings
  const handleUpdateSettings = (settings: VoiceSettings) => {
    setVoiceSettings(settings);
    localStorage.setItem("zoya_voice_settings", JSON.stringify(settings));
    if (streamerRef.current) {
      streamerRef.current.enableLockScreenMode(settings.lockScreenMode, settings.language);
    }
    // If connected, notify user they should reconnect to apply changes
    if (state !== "disconnected") {
      setLastSpeechText("Reconnect me so my new voice & language settings take effect, honey!");
    }
  };

  // Change idle quotes periodically
  useEffect(() => {
    let list = ZOYA_IDLE_QUOTES;
    if (state === "connecting") list = ZOYA_CONNECTING_QUOTES;
    else if (state === "listening") list = ZOYA_LISTENING_QUOTES;
    else if (state === "speaking") list = ZOYA_SPEAKING_QUOTES;

    const pickQuote = () => {
      const idx = Math.floor(Math.random() * list.length);
      setZoyaQuote(list[idx]);
    };

    pickQuote();
    const interval = setInterval(pickQuote, 8000);
    return () => clearInterval(interval);
  }, [state]);

  // Handle connection toggling
  const handleToggleConnection = async () => {
    if (state !== "disconnected" && state !== "error") {
      disconnectSession();
    } else {
      await connectSession();
    }
  };

  const connectSession = async () => {
    setErrorMsg("");
    setState("connecting");
    setTranscripts([]);
    setLastSpeechText("");
    setLastUserSpeechText("");

    try {
      // 1. Setup AudioStreamer
      if (!streamerRef.current) {
        streamerRef.current = new AudioStreamer();
      }
      const streamer = streamerRef.current;

      // 2. Open WebSocket
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/live-ws?voice=${voiceSettings.voiceName}&sass=${voiceSettings.sassLevel}&language=${encodeURIComponent(voiceSettings.language)}&romantic=${voiceSettings.romanticMode ? "1" : "0"}&rival=${voiceSettings.rivalMode ? "1" : "0"}`;
      
      console.log("Connecting to Zoya WS:", wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected!");
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          // Handle state updates
          if (msg.type === "state") {
            if (msg.state === "listening") {
              // Now start mic recording
              try {
                await streamer.startRecording(
                  (base64Audio) => {
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                      wsRef.current.send(JSON.stringify({ type: "audio", audio: base64Audio }));
                    }
                  },
                  (vol) => setMicVolume(vol)
                );
                
                streamer.initPlayback((vol) => setSpeakerVolume(vol));
                streamer.enableLockScreenMode(voiceSettings.lockScreenMode, voiceSettings.language);
                setState("listening");
              } catch (micErr: any) {
                console.error("Microphone access failed:", micErr);
                setErrorMsg("I need microphone permissions to hear you, honey! Check your settings.");
                setState("error");
                disconnectSession();
              }
            } else {
              setState(msg.state);
            }
          }

          // Handle incoming audio stream from Zoya
          if (msg.type === "audio" && msg.audio) {
            if (isMuted) return;
            
            // Play audio chunk
            await streamer.playChunk(msg.audio);

            // Change visual state to speaking
            setState("speaking");

            // Decay speaking state back to listening 1.5s after the last audio packet
            if (speakingTimeoutRef.current) {
              window.clearTimeout(speakingTimeoutRef.current);
            }
            speakingTimeoutRef.current = window.setTimeout(() => {
              if (stateRef.current === "speaking") {
                setState("listening");
                setSpeakerVolume(0);
              }
            }, 1200);
          }

          // Handle transcription updates (Zoya or User speaking)
          if (msg.type === "transcription" && msg.transcription) {
            const { text, isUser } = msg.transcription;
            
            if (isUser) {
              setLastUserSpeechText((prev) => {
                const updated = text;
                // Add to list
                setTranscripts((prevList) => [
                  ...prevList.filter((t) => t.isUser !== true || Date.now() - t.timestamp > 3000),
                  { text: updated, isUser: true, timestamp: Date.now() },
                ]);
                return updated;
              });
            } else {
              setLastSpeechText((prev) => {
                const updated = prev + text;
                setTranscripts((prevList) => [
                  ...prevList.filter((t) => t.isUser !== false || Date.now() - t.timestamp > 5000),
                  { text: updated, isUser: false, timestamp: Date.now() },
                ]);
                return updated;
              });
            }
          }

          // Handle Interrupted
          if (msg.type === "interrupted") {
            console.log("Zoya was interrupted by the user speaking!");
            streamer.stopPlayback();
            setState("listening");
            setSpeakerVolume(0);
            // Flash a nice sassy tooltip
            setLastSpeechText("Hey! Don't cut me off, darling... but okay, I'm listening.");
          }

          // Handle Tool Call
          if (msg.type === "toolCall" && msg.toolCall) {
            const { url, siteName } = msg.toolCall.args;
            console.log("Executing toolCall: openWebsite", url, siteName);
            
            // Pop up the website instantly (might be blocked by popup blocker, so we show elegant toast)
            try {
              window.open(url, "_blank");
            } catch (err) {
              console.warn("Popup blocked by browser iframe boundaries");
            }

            // Set visual active tool call state
            setActiveToolCall({ url, siteName });
            setTimeout(() => {
              setActiveToolCall(null);
            }, 7000);
          }

          // Handle Server Error
          if (msg.type === "error") {
            setErrorMsg(msg.error || "Zoya had a glitch in her neural circuitry.");
            setState("error");
          }

        } catch (parseErr) {
          console.error("Error parsing message from WS:", parseErr);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setErrorMsg("Failed to establish websocket link with Zoya.");
        setState("error");
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected.");
        disconnectSession();
      };

    } catch (err: any) {
      console.error("Connection error:", err);
      setErrorMsg(err.message || "Failed to wake Zoya up.");
      setState("error");
    }
  };

  const disconnectSession = () => {
    setState("disconnected");
    setMicVolume(0);
    setSpeakerVolume(0);

    if (speakingTimeoutRef.current) {
      window.clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }

    if (streamerRef.current) {
      try {
        streamerRef.current.close();
      } catch (e) {}
      streamerRef.current = null;
    }
  };

  // Helper to trigger voice prompts easily
  const handleFunPrompt = (promptText: string) => {
    if (state !== "listening" && state !== "speaking") {
      setErrorMsg("Wake me up first by tapping my core, honey!");
      return;
    }
    // Simulate speech by opening website directly if it contains opening cues
    if (promptText.toLowerCase().includes("open") && promptText.toLowerCase().includes("google")) {
      window.open("https://google.com", "_blank");
      setActiveToolCall({ url: "https://google.com", siteName: "Google" });
      setTimeout(() => setActiveToolCall(null), 6000);
      return;
    }
    if (promptText.toLowerCase().includes("instagram")) {
      const url = "https://www.instagram.com/naik___b___143?igsh=MWozYXNlNWVmb3J1ag==";
      window.open(url, "_blank");
      setActiveToolCall({ url, siteName: "Instagram (naik___b___143)" });
      setTimeout(() => setActiveToolCall(null), 6000);
      return;
    }

    // Since we're in voice-only mode, we give visual instructions to the user to speak it out loud!
    setLastSpeechText(`Go ahead and say: "${promptText}" out loud, darling! I'm listening.`);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (streamerRef.current) streamerRef.current.close();
    };
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden">
      {/* Background Tech Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-purple-900/10 to-pink-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-900/10 to-violet-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-md font-sans font-medium tracking-tight text-slate-100">Zoya AI</span>
              {voiceSettings.romanticMode ? (
                <span className="px-1.5 py-0.5 text-[10px] bg-rose-950/60 text-rose-300 font-mono rounded-full border border-rose-800/50 flex items-center gap-1">
                  💖 Romantic
                </span>
              ) : (
                <span className="px-1.5 py-0.5 text-[10px] bg-pink-950/50 text-pink-400 font-mono rounded-full border border-pink-900/40">
                  Sassy Bestie
                </span>
              )}
              <span className="px-1.5 py-0.5 text-[10px] bg-purple-950/60 text-purple-300 font-mono rounded-full border border-purple-800/50">
                {voiceSettings.language.split(" ")[0]}
              </span>
              {voiceSettings.lockScreenMode && (
                <span className="px-1.5 py-0.5 text-[10px] bg-cyan-950/60 text-cyan-300 font-mono rounded-full border border-cyan-800/50 hidden sm:inline-block">
                  🔒 Lock Screen
                </span>
              )}
              {voiceSettings.rivalMode && (
                <span className="px-1.5 py-0.5 text-[10px] bg-amber-950/70 text-amber-300 font-mono rounded-full border border-amber-500/50 flex items-center gap-1 animate-pulse">
                  🔥 Rival Mode
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            id="freefire-alerts-btn"
            onClick={() => setIsFreeFireOpen(true)}
            className="p-2.5 rounded-full bg-amber-950/40 border border-amber-500/40 text-amber-400 hover:text-amber-200 hover:bg-amber-900/50 transition-all cursor-pointer shadow-sm"
            title="Free Fire MAX Alerts & Rival Hub"
          >
            <Flame className="w-4 h-4" />
          </button>

          <button
            id="creative-studio-btn"
            onClick={() => setIsCreativeStudioOpen(true)}
            className="p-2.5 rounded-full bg-purple-950/40 border border-purple-500/40 text-purple-400 hover:text-purple-200 hover:bg-purple-900/50 transition-all cursor-pointer shadow-sm"
            title="AI Creative Studio (Images & Videos)"
          >
            <Image className="w-4 h-4" />
          </button>

          <button
            id="screen-share-btn"
            onClick={() => setIsScreenShareOpen(true)}
            className="p-2.5 rounded-full bg-cyan-950/40 border border-cyan-500/40 text-cyan-400 hover:text-cyan-200 hover:bg-cyan-900/50 transition-all cursor-pointer shadow-sm"
            title="Secure Screen-Sharing & Gaming Co-Pilot"
          >
            <Monitor className="w-4 h-4" />
          </button>

          <button
            id="mute-toggle-btn"
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2.5 rounded-full border transition-all cursor-pointer ${
              isMuted
                ? "bg-red-950/20 border-red-500/40 text-red-400"
                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
            title={isMuted ? "Unmute Zoya" : "Mute Zoya"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          
          <button
            id="settings-toggle-btn"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="p-2.5 rounded-full bg-slate-900/40 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all cursor-pointer"
            title="Settings & Persona Configuration"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main UI body */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center max-w-4xl w-full mx-auto px-6 py-12">
        {/* Connection Tooltip/Error Toast */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-4 bg-red-950/60 border border-red-500/50 rounded-2xl p-4 flex gap-3 items-start max-w-md w-full shadow-2xl backdrop-blur-md"
            >
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-grow">
                <h4 className="text-sm font-sans font-medium text-red-200">System Glitch, Sweetheart</h4>
                <p className="text-xs text-red-400/90 mt-1 leading-relaxed">{errorMsg}</p>
              </div>
            </motion.div>
          )}

          {activeToolCall && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-4 bg-purple-950/60 border border-purple-500/50 rounded-2xl p-4 flex gap-3 items-center max-w-md w-full shadow-2xl backdrop-blur-md"
            >
              <RefreshCw className="w-5 h-5 text-purple-400 animate-spin shrink-0" />
              <div className="flex-grow">
                <h4 className="text-sm font-sans font-medium text-purple-200">Opening Website</h4>
                <p className="text-xs text-purple-400/80 mt-0.5">
                  Zoya opened <strong>{activeToolCall.siteName}</strong> on a new tab!
                </p>
              </div>
              <a
                id="toolcall-fallback-link"
                href={activeToolCall.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-sans transition-all shrink-0 font-medium"
              >
                Go <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zoya State Interactive Quote */}
        <div className="h-16 flex items-center justify-center text-center max-w-lg mb-8">
          <AnimatePresence mode="wait">
            <motion.p
              key={zoyaQuote}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className={`text-md italic tracking-wide font-sans ${
                state === "listening"
                  ? "text-cyan-400"
                  : state === "speaking"
                    ? "text-rose-400"
                    : state === "connecting"
                      ? "text-amber-400"
                      : "text-slate-400/90"
              }`}
            >
              "{zoyaQuote}"
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Central Glowing Orb Interaction Component */}
        <ZoyaOrb
          state={state}
          micVolume={micVolume}
          speakerVolume={speakerVolume}
          sassLevel={voiceSettings.sassLevel}
          onToggle={handleToggleConnection}
        />

        {/* Interactive Floating Live Text Subtitles */}
        <div className="mt-10 min-h-[96px] w-full max-w-lg flex flex-col gap-3 justify-center items-center">
          <AnimatePresence>
            {/* User Speech Bubble */}
            {state === "listening" && lastUserSpeechText && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 0.8, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl px-4 py-2 text-sm text-cyan-200/90 max-w-xs text-center shadow-lg"
              >
                <span className="text-[10px] font-mono tracking-wider text-cyan-400 block mb-0.5">YOU</span>
                "{lastUserSpeechText}"
              </motion.div>
            )}

            {/* Zoya Speech Bubble */}
            {state === "speaking" && lastSpeechText && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-purple-950/30 border border-purple-500/20 rounded-2xl px-5 py-3 text-sm text-rose-100 max-w-md text-center shadow-2xl backdrop-blur-sm relative"
              >
                <span className="text-[10px] font-mono tracking-wider text-rose-400 block mb-1">ZOYA</span>
                "{lastSpeechText}"
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-purple-950/30 border-r border-b border-purple-500/20" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer / Suggestion actions */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-8 pt-4">
        {/* Try saying prompts section */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-mono tracking-wider text-slate-500">TRY ASKING ZOYA OUT LOUD</span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
            {FUN_PROMPTS.map((prompt, idx) => (
              <button
                id={`fun-prompt-btn-${idx}`}
                key={idx}
                onClick={() => handleFunPrompt(prompt)}
                className="text-xs px-3.5 py-2 rounded-full bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700/80 hover:bg-slate-800/50 transition-all cursor-pointer font-sans"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom copyright & Info indicators */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-5 border-t border-slate-900 text-xs text-slate-600 font-mono">
          <span>ZOYA LIVE COGNITIVE SYSTEM v3.1</span>
          <span className="flex items-center gap-1.5 mt-2 md:mt-0">
            <span className={`w-2 h-2 rounded-full ${state === "disconnected" ? "bg-slate-700" : "bg-green-500 animate-pulse"}`} />
            {state.toUpperCase()} MODE
          </span>
        </div>
      </footer>

      {/* Settings Modal Layer */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsPanel
            settings={voiceSettings}
            onUpdate={handleUpdateSettings}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Free Fire MAX Alerts & Rival Hub Modal */}
      <FreeFireModal
        isOpen={isFreeFireOpen}
        onClose={() => setIsFreeFireOpen(false)}
        onTriggerTaunt={handleTriggerTaunt}
        rivalModeActive={voiceSettings.rivalMode}
      />

      {/* AI Creative Studio Modal (Real-time Image & Short-Video) */}
      <CreativeStudioModal
        isOpen={isCreativeStudioOpen}
        onClose={() => setIsCreativeStudioOpen(false)}
      />

      {/* Secure Screen-Sharing & Gaming Co-Pilot Modal */}
      <ScreenShareModal
        isOpen={isScreenShareOpen}
        onClose={() => setIsScreenShareOpen(false)}
      />
    </div>
  );
}
