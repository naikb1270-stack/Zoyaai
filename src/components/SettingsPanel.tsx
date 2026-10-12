import { motion } from "motion/react";
import { Sliders, X, Sparkles, MessageSquare, Mic, Lock, Globe } from "lucide-react";
import { VoiceSettings } from "../types";

interface SettingsPanelProps {
  settings: VoiceSettings;
  onUpdate: (settings: VoiceSettings) => void;
  onClose: () => void;
}

const VOICES = [
  { id: "Aoede", name: "Aoede", desc: "Cute Smile & Vibrant female voice (Recommended Default!)", gender: "Female" },
  { id: "Kore", name: "Kore", desc: "Cute Smile & Sweet Romantic female voice (Warm & Gentle)", gender: "Female" },
  { id: "Puck", name: "Puck", desc: "Sassy & energetic female voice (Bold & Playful)", gender: "Female" },
  { id: "Zephyr", name: "Zephyr", desc: "Chill & neutral voice", gender: "Neutral" },
  { id: "Fenrir", name: "Fenrir", desc: "Cool & confident male voice", gender: "Male" },
  { id: "Charon", name: "Charon", desc: "Deep & slow male voice", gender: "Male" },
];

const LANGUAGES = [
  { id: "Odia (ଓଡ଼ିଆ)", name: "Odia (ଓଡ଼ିଆ)", desc: "Authentic spoken Odia with warm flirty & romantic charm" },
  { id: "Odia + English", name: "Odia + English", desc: "Bilingual mix of Odia & stylish English slang" },
  { id: "Hindi", name: "Hindi / Hinglish", desc: "Sassy & romantic Bollywood girlfriend style" },
  { id: "English", name: "English", desc: "Standard English with sassy & romantic attitude" },
];

const SASS_DESCRIPTIONS = [
  "Lv 1: Sweetheart (Gentle cute smile, loving romantic partner 💖)",
  "Lv 2: Romantic Bestie (Warm affection, playful flirty smiles 😊)",
  "Lv 3: Sassy Girlfriend (Flirty romance + bold witty banter 🔥)",
  "Lv 4: Spicy Tease (Highly flirty, sarcastic & passionate love)",
  "Lv 5: Absolute Diva (Maximum attitude, intense romantic passion!)",
];

export default function SettingsPanel({ settings, onUpdate, onClose }: SettingsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed inset-x-4 bottom-4 md:inset-auto md:right-6 md:bottom-24 md:w-96 z-50 bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-purple-400" />
          <h3 className="text-md font-sans font-medium text-slate-100">Zoya's Settings</h3>
        </div>
        <button
          id="close-settings-btn"
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-1">
        {/* Voice Selection */}
        <div>
          <label className="text-xs font-mono tracking-wider text-slate-400 block mb-2.5">
            VOICE TONALITY
          </label>
          <div className="space-y-2">
            {VOICES.map((v) => (
              <button
                id={`voice-select-${v.id}`}
                key={v.id}
                onClick={() => onUpdate({ ...settings, voiceName: v.id })}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                  settings.voiceName === v.id
                    ? "bg-purple-950/30 border-purple-500/60 text-purple-200"
                    : "bg-slate-950/20 border-slate-800/80 text-slate-400 hover:border-slate-700/80 hover:text-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 font-sans font-medium text-sm">
                    {v.name}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      v.gender === "Female" 
                        ? "bg-pink-950/40 text-pink-400 border border-pink-900/30" 
                        : "bg-blue-950/40 text-blue-400 border border-blue-900/30"
                    }`}>
                      {v.gender}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 group-hover:text-slate-400/90 mt-0.5 transition-colors">
                    {v.desc}
                  </div>
                </div>
                {settings.voiceName === v.id && (
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div>
          <label className="text-xs font-mono tracking-wider text-slate-400 block mb-2.5 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-purple-400" />
            PREFERRED LANGUAGE
          </label>
          <div className="space-y-2">
            {LANGUAGES.map((lang) => (
              <button
                id={`lang-select-${lang.id}`}
                key={lang.id}
                onClick={() => onUpdate({ ...settings, language: lang.id })}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                  settings.language === lang.id
                    ? "bg-purple-950/30 border-purple-500/60 text-purple-200"
                    : "bg-slate-950/20 border-slate-800/80 text-slate-400 hover:border-slate-700/80 hover:text-slate-200"
                }`}
              >
                <div>
                  <div className="font-sans font-medium text-sm">{lang.name}</div>
                  <div className="text-xs text-slate-500 group-hover:text-slate-400/90 mt-0.5 transition-colors">
                    {lang.desc}
                  </div>
                </div>
                {settings.language === lang.id && (
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Lock Screen / Background Audio Mode */}
        <div className="p-3.5 bg-purple-950/20 border border-purple-500/30 rounded-xl flex items-center justify-between">
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-sans font-medium text-slate-100">Lock Screen Voice Call</div>
              <div className="text-xs text-slate-400 mt-0.5">Keep talking to Zoya when phone screen is locked or asleep</div>
            </div>
          </div>
          <button
            id="toggle-lock-screen-btn"
            type="button"
            onClick={() => onUpdate({ ...settings, lockScreenMode: !settings.lockScreenMode })}
            className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer shrink-0 ml-2 ${
              settings.lockScreenMode ? "bg-purple-600 justify-end" : "bg-slate-800 justify-start"
            }`}
          >
            <motion.div
              layout
              className="w-4 h-4 rounded-full bg-white shadow-md"
            />
          </button>
        </div>

        {/* Romantic Partner Mode Toggle */}
        <div className="p-3.5 bg-rose-950/25 border border-rose-500/40 rounded-xl flex items-center justify-between">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-sans font-medium text-slate-100 flex items-center gap-1.5">
                Romantic Partner Mode <span className="text-xs bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded-full">💖 Pyar se baat kare</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">Cute smiling voice, romantic affection & flirty nicknames</div>
            </div>
          </div>
          <button
            id="toggle-romantic-mode-btn"
            type="button"
            onClick={() => onUpdate({ ...settings, romanticMode: !settings.romanticMode })}
            className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer shrink-0 ml-2 ${
              settings.romanticMode ? "bg-rose-600 justify-end" : "bg-slate-800 justify-start"
            }`}
          >
            <motion.div
              layout
              className="w-4 h-4 rounded-full bg-white shadow-md"
            />
          </button>
        </div>

        {/* Rival Mode Toggle - Free Fire MAX Gaming Antagonist */}
        <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-xl flex items-center justify-between">
          <div className="flex items-start gap-2.5">
            <span className="text-base mt-0.5 shrink-0">🔥</span>
            <div>
              <div className="text-sm font-sans font-medium text-slate-100 flex items-center gap-1.5">
                Rival Mode <span className="text-xs bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-mono">Free Fire MAX</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">Playful gaming antagonist with taunts, competitive banter & cute laughing</div>
            </div>
          </div>
          <button
            id="toggle-rival-mode-btn"
            type="button"
            onClick={() => onUpdate({ ...settings, rivalMode: !settings.rivalMode })}
            className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer shrink-0 ml-2 ${
              settings.rivalMode ? "bg-amber-600 justify-end" : "bg-slate-800 justify-start"
            }`}
          >
            <motion.div
              layout
              className="w-4 h-4 rounded-full bg-white shadow-md"
            />
          </button>
        </div>

        {/* Persona Intensity Slider (1-5) */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-mono tracking-wider text-slate-300 font-semibold flex items-center gap-1">
              PERSONA INTENSITY <span className="text-purple-400">(SASS & ROMANCE)</span>
            </label>
            <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/50 border border-purple-500/30 px-2 py-0.5 rounded-md">
              Lv. {settings.sassLevel} / 5
            </span>
          </div>
          <input
            id="persona-intensity-slider"
            type="range"
            min="1"
            max="5"
            value={settings.sassLevel}
            onChange={(e) => onUpdate({ ...settings, sassLevel: parseInt(e.target.value, 10) })}
            className="w-full accent-purple-500 bg-slate-950 h-2.5 rounded-lg appearance-none cursor-pointer mb-2"
          />
          <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-3 flex gap-2 items-start text-xs text-slate-300">
            <MessageSquare className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="font-medium">{SASS_DESCRIPTIONS[settings.sassLevel - 1]}</span>
          </div>
        </div>

        {/* Tip section */}
        <div className="p-3 bg-slate-950/60 border border-purple-950/50 rounded-xl flex gap-2 items-start text-xs text-slate-400/90 leading-relaxed">
          <Mic className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            <strong>Pro Tip:</strong> Talk to Zoya continuously. If she talks too much, you can 
            <strong> interrupt her</strong> by simply speaking over her! She will listen immediately.
          </span>
        </div>
      </div>
    </motion.div>
  );
}
