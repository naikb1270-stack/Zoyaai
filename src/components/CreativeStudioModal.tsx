import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Image, Video, Sparkles, Loader2, Download, Eye } from "lucide-react";
import { CreativeAsset } from "../types";

interface CreativeStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreativeStudioModal({ isOpen, onClose }: CreativeStudioModalProps) {
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState<"image" | "video">("image");
  const [style, setStyle] = useState("freefire-cyber");
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<CreativeAsset[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-creative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, type, style }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate creative asset");
      }

      const data: CreativeAsset = await response.json();
      setAssets((prev) => [data, ...prev]);
      setPrompt("");
    } catch (err: any) {
      setError(err.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-2xl bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border-b border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-sans font-bold text-slate-100">
                  AI Creative Studio (Images & Short-Videos)
                </h3>
                <p className="text-xs text-slate-400">
                  Built-in real-time image and animated short-video generation
                </p>
              </div>
            </div>
            <button
              id="close-creative-studio-btn"
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Generate Form */}
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setType("image")}
                  className={`flex-1 py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                    type === "image"
                      ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/25"
                      : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Image className="w-4 h-4" />
                  Real-time Image
                </button>
                <button
                  type="button"
                  onClick={() => setType("video")}
                  className={`flex-1 py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                    type === "video"
                      ? "bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/25"
                      : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Video className="w-4 h-4" />
                  Short-Video Animation
                </button>
              </div>

              <div className="flex gap-2">
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
                >
                  <option value="freefire-cyber">Free Fire MAX Cyber</option>
                  <option value="neon-cyberpunk">Neon Cyberpunk</option>
                  <option value="romantic-rose">Romantic Rose Glow</option>
                  <option value="anime-rival">Anime Rival Studio</option>
                </select>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    type === "image"
                      ? "e.g. Cyberpunk Zoya Free Fire MAX Booyah victory banner..."
                      : "e.g. Animated short-video sequence of Free Fire Airdrop drop..."
                  }
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md disabled:opacity-50 transition-all cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Generate
                </button>
              </div>

              {error && (
                <div className="text-xs text-red-400 bg-red-950/40 border border-red-500/30 p-3 rounded-xl">
                  {error}
                </div>
              )}
            </form>

            {/* Generated Assets Feed */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">
                Generated Creations ({assets.length})
              </h4>

              {assets.length === 0 ? (
                <div className="p-10 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-xs">
                  No creative assets yet. Enter a prompt above to generate real-time graphics or short-videos!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden flex flex-col"
                    >
                      <div className="relative bg-slate-950 aspect-video flex items-center justify-center p-2">
                        <img
                          src={asset.url}
                          alt={asset.title}
                          className="w-full h-full object-contain"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-sm text-[10px] font-mono uppercase text-purple-300 border border-purple-500/30">
                          {asset.type}
                        </span>
                      </div>
                      <div className="p-3.5 flex flex-col justify-between flex-1">
                        <div>
                          <div className="text-xs font-bold text-slate-200 line-clamp-1">
                            {asset.title}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                            {asset.prompt}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/50 text-[10px] text-slate-500">
                          <span>{new Date(asset.createdAt).toLocaleTimeString()}</span>
                          <a
                            href={asset.url}
                            download={`${asset.title}.svg`}
                            className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-medium"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Save
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Powered by Gemini • Real-time SVG & Video Engine
            </span>
            <button
              id="close-creative-footer-btn"
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
