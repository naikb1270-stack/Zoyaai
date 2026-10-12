import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Flame, ShieldAlert, Crosshair, Crown, Sparkles, Send, Volume2 } from "lucide-react";
import { FreeFireAlert } from "../types";

interface FreeFireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerTaunt: (alert: FreeFireAlert) => void;
  rivalModeActive: boolean;
}

export default function FreeFireModal({
  isOpen,
  onClose,
  onTriggerTaunt,
  rivalModeActive,
}: FreeFireModalProps) {
  const [alerts, setAlerts] = useState<FreeFireAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<FreeFireAlert | null>(null);
  const [customTauntInput, setCustomTauntInput] = useState("");

  useEffect(() => {
    if (isOpen && alerts.length === 0) {
      setLoading(true);
      fetch("/api/freefire-alerts")
        .then((res) => res.json())
        .then((data) => {
          setAlerts(data);
          setLoading(false);
        })
        .catch(() => {
          setAlerts([
            {
              id: "alert-zone",
              title: "Red Zone Shrinking!",
              type: "zone",
              message: "Red Zone incoming! Loot chhod aur bhaag na, noob! *giggles*",
              tauntOdia: "ଆରେ Red Zone ଆସିଗଲା! ଲୁଟ୍ ଛାଡି ଶୀଘ୍ର ପଳା, ନହେଲେ finish ହେଇଯିବୁ! ହିହି!",
              icon: "🚨",
            },
            {
              id: "alert-airdrop",
              title: "Level 3 Airdrop Incoming!",
              type: "airdrop",
              message: "Airdrop drop hua hai! Level 3 vest milgaya kya ya camper ki tarah baithe ho? *laughs*",
              tauntOdia: "Airdrop ପଡ଼ିଲାଣି! Level 3 ଲୁଟ୍ କରିବୁ ନା ଘରେ ଲୁଚିକି ବସିବୁ? ହାହା!",
              icon: "📦",
            },
            {
              id: "alert-rush",
              title: "Enemy Squad Rush Alert!",
              type: "rush",
              message: "Squad rush kar rahi hai! Headshot rate dikha apna, ya fir gloo wall lagake bhaag jayega? *giggles*",
              tauntOdia: "Enemy Squad rush କଲେଣି! Headshot ଦେବୁ ନା Gloo wall ପକେଇ ପଳେଇବୁ? ହିହି!",
              icon: "⚔️",
            },
            {
              id: "alert-booyah",
              title: "BOOYAH! Victory Challenge",
              type: "booyah",
              message: "BOOYAH! Okay okay, maybe your aim isn't so bad today na! But 1v1 me in custom room next! *laughs*",
              tauntOdia: "ବାଃ BOOYAH କଲୁ! ଆଜି ତୋ aim ଟିକେ ଭଲ ଅଛି! କିନ୍ତୁ next match ମୋ ସହ 1v1 ହଉ! ହିହି!",
              icon: "👑",
            },
          ]);
          setLoading(false);
        });
    }
  }, [isOpen, alerts.length]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border-b border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
                🔥
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-sans font-bold text-slate-100">
                    Free Fire MAX Alerts & Rival Hub
                  </h3>
                  {rivalModeActive && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Rival Mode Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Playful gaming antagonist alerts, competitive banter & Odia taunts
                </p>
              </div>
            </div>
            <button
              id="close-freefire-modal-btn"
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200/90 leading-relaxed">
                <strong>Zoya's Rival Persona:</strong> She presents herself as an adorable visual AI, but is programmed to taunt your Free Fire MAX gameplay with witty banter, challenge your headshot rate, and laugh out loud!
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">
                Trigger Gaming Alert & Taunt
              </h4>

              {loading ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Loading Free Fire MAX alerts...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {alerts.map((alert) => (
                    <button
                      key={alert.id}
                      onClick={() => {
                        setSelectedAlert(alert);
                        onTriggerTaunt(alert);
                      }}
                      className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between group ${
                        selectedAlert?.id === alert.id
                          ? "bg-amber-500/20 border-amber-500 text-amber-100"
                          : "bg-slate-800/50 border-slate-700/60 hover:border-amber-500/50 text-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{alert.icon}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/60 text-slate-400 uppercase">
                          {alert.type}
                        </span>
                      </div>
                      <div className="font-semibold text-sm">{alert.title}</div>
                      <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                        "{alert.message}"
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Alert Preview / Odia Taunt */}
            {selectedAlert && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-amber-400 font-medium">
                    ⚡ ZOYA'S RIVAL TAUNT (ENGLISH & ODIA)
                  </span>
                  <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
                </div>
                <p className="text-sm font-sans text-slate-200 italic">
                  "{selectedAlert.message}"
                </p>
                {selectedAlert.tauntOdia && (
                  <p className="text-xs font-sans text-amber-300/90 pt-1 border-t border-slate-800">
                    ଓଡ଼ିଆ: "{selectedAlert.tauntOdia}"
                  </p>
                )}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Free Fire MAX • Competitive Rival Mode
            </span>
            <button
              id="close-freefire-footer-btn"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              Close Hub
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
