import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Maximize,
  Trophy,
  AlertTriangle,
  Loader2,
  RotateCcw,
} from "lucide-react";
import type { GDGame, GDGameEvent, GameResult } from "../../types";

interface GameDistributionPlayerProps {
  game: GDGame;
  betAmount?: number;
  onBack: () => void;
  onGameResult?: (result: GameResult) => void;
}

type GameStatus = "loading" | "ready" | "playing" | "paused" | "ended" | "error";

export function GameDistributionPlayer({
  game,
  betAmount = 0,
  onBack,
  onGameResult,
}: GameDistributionPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<GameStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const loadedRef = useRef(false);
  const statusRef = useRef<GameStatus>("loading");

  const syncStatus = useCallback((s: GameStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setGameTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    const safetyTimeout = setTimeout(() => {
      if (statusRef.current === "loading") {
        console.log("[GD Player] Safety timeout: transitioning from loading to ready");
        syncStatus("ready");
      }
    }, 8000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(safetyTimeout);
    };
  }, [syncStatus]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;

      const evtType: string = e.data.event || e.data.type || "unknown";

      console.log("[GD Player] Event:", evtType);

      switch (evtType) {
        case "SDK_READY":
        case "game_ready":
        case "GAME_READY":
          syncStatus("ready");
          break;
        case "SDK_GAME_START":
        case "game_start":
        case "GAME_START":
          syncStatus("playing");
          break;
        case "SDK_GAME_PAUSE":
        case "game_pause":
        case "GAME_PAUSE":
          syncStatus("paused");
          break;
        case "game_end":
        case "GAME_END":
          syncStatus("ended");
          break;
        case "SDK_ERROR":
        case "GD_SDK_ERROR":
        case "error":
          console.error("[GD Player] GD error:", e.data.description);
          syncStatus("error");
          setError(e.data.description || "Game encountered an error");
          break;
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [syncStatus]);

  useEffect(() => {
    if (status === "ended") {
      if (timerRef.current) clearInterval(timerRef.current);
      const gameResult: GameResult = {
        session_id: sessionId || `local_${Date.now()}`,
        game_id: game.id,
        player_id: "current_user",
        score,
        result: score > 0 ? "win" : "draw",
        bet_amount: betAmount,
        payout: score > 0 ? betAmount * 2 : 0,
        timestamp: Date.now(),
      };
      onGameResult?.(gameResult);
    }
  }, [status, score, sessionId, game.id, betAmount, onGameResult]);

  const toggleMute = useCallback(() => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage({ action: muted ? "unmute" : "mute" }, "*");
    setMuted(!muted);
  }, [muted]);

  const goFullscreen = useCallback(() => {
    iframeRef.current?.requestFullscreen?.();
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const buildGameUrl = () => {
    if (game.url && game.url.includes("gamedistribution.com")) {
      return game.url;
    }
    const gameId = game.id.replace(/^gd_/, "");
    return `https://html5.gamedistribution.com/${gameId}/`;
  };

  const reloadGame = useCallback(() => {
    syncStatus("loading");
    setError(null);
    setScore(0);
    setGameTime(0);
    setIframeKey((k) => k + 1);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setGameTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, [syncStatus]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 px-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Games
        </button>
        <h2 className="text-lg font-bold text-white">{game.title}</h2>
        <div className="flex items-center gap-2">
          {betAmount > 0 && (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Bet: {betAmount} pts
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 px-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <div className={`w-2 h-2 rounded-full ${
            status === "playing" ? "bg-emerald-400 animate-pulse" :
            status === "loading" ? "bg-amber-400 animate-pulse" :
            status === "error" ? "bg-red-400" :
            "bg-slate-500"
          }`} />
          <span className="uppercase tracking-wider font-medium">{status}</span>
        </div>

        <div className="text-xs text-slate-500 font-mono">{formatTime(gameTime)}</div>

        {score > 0 && (
          <div className="text-xs font-medium px-2 py-0.5 rounded bg-violet-500/20 text-violet-400">
            Score: {score}
          </div>
        )}

        <div className="flex-1" />

        <button
          type="button"
          onClick={toggleMute}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={goFullscreen}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          title="Fullscreen"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 rounded-xl overflow-hidden border border-white/[0.06] bg-black relative">
        {status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-3" />
            <p className="text-sm text-slate-400">Loading game...</p>
            <p className="text-xs text-slate-600 mt-1">{game.title}</p>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
            <AlertTriangle className="w-8 h-8 text-red-400 mb-3" />
            <p className="text-sm text-red-400 mb-2">Game Error</p>
            <p className="text-xs text-slate-500 mb-4">{error}</p>
            <button
              type="button"
              onClick={reloadGame}
              className="px-4 py-2 rounded-lg bg-white/10 text-sm text-white hover:bg-white/20 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {status === "ended" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
            <Trophy className="w-10 h-10 text-amber-400 mb-3" />
            <p className="text-lg font-bold text-white mb-1">Game Over</p>
            <p className="text-sm text-slate-400 mb-1">Score: {score}</p>
            <p className="text-xs text-slate-500 mb-4">Time: {formatTime(gameTime)}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 rounded-lg bg-white/10 text-sm text-white hover:bg-white/20 transition-colors"
              >
                Back to Games
              </button>
              <button
                type="button"
                onClick={reloadGame}
                className="px-4 py-2 rounded-lg bg-violet-600 text-sm text-white hover:bg-violet-500 transition-colors"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={buildGameUrl()}
          className="w-full h-full border-0"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture; gamepad; accelerometer; gyroscope"
          allowFullScreen
          title={game.title}
        />
      </div>

      <div className="mt-3 px-2">
        <div className="flex items-center gap-2 text-[10px] text-slate-600">
          <span>Powered by GameDistribution | {game.provider || "Unknown Provider"}</span>
          <span>|</span>
          <span>{game.plays?.toLocaleString() ?? 0} plays</span>
          <span>|</span>
          <span>Rating: {game.rating ?? 0}/5</span>
        </div>
      </div>
    </div>
  );
}
