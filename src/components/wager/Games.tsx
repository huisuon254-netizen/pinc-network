import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  ArrowLeft,
  Trophy,
  RotateCcw,
  Swords,
  Hash,
  Plus,
  Target,
  Clock,
  CheckCircle,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type GameType = "tic_tac_toe" | "number_guessing" | "rock_paper_scissors" | null;

interface GameStats {
  wins: number;
  losses: number;
  draws: number;
  points: number;
}

// ── Tic-Tac-Toe ──────────────────────────────────────────────────────────────

function TicTacToe({ onResult }: { onResult: (result: "win" | "loss" | "draw") => void }) {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const winLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  const checkWinner = useCallback((b: (string | null)[]): string | null => {
    for (const [a, c, d] of winLines) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
    }
    return null;
  }, []);

  const checkDraw = useCallback((b: (string | null)[]): boolean => {
    return b.every((cell) => cell !== null);
  }, []);

  const aiMove = useCallback((b: (string | null)[]) => {
    const empty = b.map((cell, i) => (cell === null ? i : -1)).filter((i) => i >= 0);
    if (empty.length === 0) return;
    const randomIdx = empty[Math.floor(Math.random() * empty.length)];
    const newBoard = [...b];
    newBoard[randomIdx] = "O";
    setBoard(newBoard);

    const w = checkWinner(newBoard);
    if (w) {
      setWinner(w);
      setGameOver(true);
      onResult("loss");
    } else if (checkDraw(newBoard)) {
      setGameOver(true);
      onResult("draw");
    } else {
      setIsPlayerTurn(true);
    }
  }, [checkWinner, checkDraw, onResult]);

  const handleCellClick = (index: number) => {
    if (board[index] || gameOver || !isPlayerTurn) return;

    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);

    const w = checkWinner(newBoard);
    if (w) {
      setWinner(w);
      setGameOver(true);
      onResult("win");
    } else if (checkDraw(newBoard)) {
      setGameOver(true);
      onResult("draw");
    } else {
      setIsPlayerTurn(false);
    }
  };

  useEffect(() => {
    if (!isPlayerTurn && !gameOver) {
      const timer = setTimeout(() => aiMove(board), 400);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, gameOver, board, aiMove]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setGameOver(false);
    setWinner(null);
  };

  const cellStyle = "w-20 h-20 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] flex items-center justify-center text-2xl font-bold transition-colors cursor-pointer";

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-4">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
          {gameOver ? "Game Over" : isPlayerTurn ? "Your Turn (X)" : "AI Thinking..."}
        </div>
        {gameOver && winner && (
          <div className={`text-lg font-bold ${winner === "X" ? "text-emerald-400" : "text-red-400"}`}>
            {winner === "X" ? "You Win! +2 pts" : "AI Wins! +0 pts"}
          </div>
        )}
        {gameOver && !winner && (
          <div className="text-lg font-bold text-amber-400">Draw! +1 pt</div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {board.map((cell, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleCellClick(i)}
            className={cellStyle}
            style={{ color: cell === "X" ? "#a78bfa" : cell === "O" ? "#f87171" : undefined }}
          >
            {cell}
          </button>
        ))}
      </div>

      {gameOver && (
        <button
          type="button"
          onClick={resetGame}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Play Again
        </button>
      )}
    </div>
  );
}

// ── Number Guessing Game ─────────────────────────────────────────────────────

function NumberGuessing({ onResult }: { onResult: (result: "win" | "loss" | "draw") => void }) {
  const [target] = useState(() => Math.floor(Math.random() * 100) + 1);
  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [maxAttempts] = useState(7);

  const handleGuess = () => {
    const num = parseInt(guess);
    if (isNaN(num) || num < 1 || num > 100 || gameOver) return;

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (num === target) {
      setFeedback(`Correct! The number was ${target}`);
      setGameOver(true);
      onResult("win");
    } else if (newAttempts >= maxAttempts) {
      setFeedback(`Out of attempts! The number was ${target}`);
      setGameOver(true);
      onResult("loss");
    } else if (num < target) {
      setFeedback(`Higher! (${maxAttempts - newAttempts} attempts left)`);
    } else {
      setFeedback(`Lower! (${maxAttempts - newAttempts} attempts left)`);
    }
    setGuess("");
  };

  const resetGame = () => {
    setGuess("");
    setAttempts(0);
    setFeedback("");
    setGameOver(false);
  };

  return (
    <div className="flex flex-col items-center max-w-sm mx-auto">
      <div className="text-center mb-6">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Guess the Number</div>
        <div className="text-sm text-slate-400">1 to 100 · {maxAttempts} attempts</div>
      </div>

      <div className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Hash className="w-4 h-4 text-violet-400" />
          <span className="text-sm text-slate-400">Attempts: {attempts}/{maxAttempts}</span>
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={100}
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGuess()}
            disabled={gameOver}
            placeholder="Enter 1-100"
            className="flex-1 rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleGuess}
            disabled={gameOver || !guess}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-sm font-semibold text-white transition-colors"
          >
            Guess
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`w-full rounded-lg p-3 text-sm font-medium text-center mb-4 ${
          gameOver
            ? feedback.includes("Correct")
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
            : "bg-white/[0.03] border border-white/[0.06] text-slate-300"
        }`}>
          {feedback}
        </div>
      )}

      {gameOver && (
        <button
          type="button"
          onClick={resetGame}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Play Again
        </button>
      )}
    </div>
  );
}

// ── Rock Paper Scissors ──────────────────────────────────────────────────────

function RockPaperScissors({ onResult }: { onResult: (result: "win" | "loss" | "draw") => void }) {
  const [playerChoice, setPlayerChoice] = useState<string | null>(null);
  const [aiChoice, setAiChoice] = useState<string | null>(null);
  const [result, setResult] = useState<"win" | "loss" | "draw" | null>(null);
  const [round, setRound] = useState(0);

  const choices = [
    { id: "rock", emoji: "🪨", label: "Rock" },
    { id: "paper", emoji: "📄", label: "Paper" },
    { id: "scissors", emoji: "✂️", label: "Scissors" },
  ];

  const determineWinner = (player: string, ai: string): "win" | "loss" | "draw" => {
    if (player === ai) return "draw";
    if (
      (player === "rock" && ai === "scissors") ||
      (player === "paper" && ai === "rock") ||
      (player === "scissors" && ai === "paper")
    ) return "win";
    return "loss";
  };

  const handleChoice = (choice: string) => {
    const aiIdx = Math.floor(Math.random() * 3);
    const ai = choices[aiIdx].id;
    const res = determineWinner(choice, ai);

    setPlayerChoice(choice);
    setAiChoice(ai);
    setResult(res);
    setRound((r) => r + 1);
    onResult(res);
  };

  const resetGame = () => {
    setPlayerChoice(null);
    setAiChoice(null);
    setResult(null);
  };

  const resultText = () => {
    if (!result) return "";
    if (result === "win") return "You Win! +2 pts";
    if (result === "loss") return "AI Wins! +0 pts";
    return "Draw! +1 pt";
  };

  const resultColor = () => {
    if (result === "win") return "text-emerald-400";
    if (result === "loss") return "text-red-400";
    return "text-amber-400";
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-6">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Rock Paper Scissors</div>
        <div className="text-sm text-slate-400">Round {round + 1}</div>
      </div>

      <div className="flex gap-4 mb-6">
        {choices.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => handleChoice(c.id)}
            disabled={!!result}
            className="w-24 h-24 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-violet-500/40 flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-40"
          >
            <span className="text-3xl">{c.emoji}</span>
            <span className="text-[10px] text-slate-500">{c.label}</span>
          </button>
        ))}
      </div>

      {playerChoice && aiChoice && (
        <div className="w-full max-w-sm rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-1">You</div>
              <span className="text-2xl">{choices.find((c) => c.id === playerChoice)?.emoji}</span>
            </div>
            <Swords className="w-5 h-5 text-slate-600" />
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-1">AI</div>
              <span className="text-2xl">{choices.find((c) => c.id === aiChoice)?.emoji}</span>
            </div>
          </div>
          <div className={`text-center font-bold ${resultColor()}`}>
            {resultText()}
          </div>
        </div>
      )}

      {result && (
        <button
          type="button"
          onClick={resetGame}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Play Again
        </button>
      )}
    </div>
  );
}

// ── Create Custom Game Form ──────────────────────────────────────────────────

type ChallengeType = "score" | "time" | "completion";

function CreateCustomGame({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "",
    betAmount: "",
    challengeType: "score" as ChallengeType,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.betAmount) return;

    setSubmitting(true);
    setError("");
    try {
      await invoke("cmd_create_game_session", {
        gameId: `custom_${Date.now()}`,
        betAmount: parseFloat(form.betAmount),
      });
      onCreated();
      setForm({ name: "", betAmount: "", challengeType: "score" });
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Game Name</label>
        <input
          className={inputCls}
          placeholder="e.g. Speed Chess Challenge"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Bet Amount ($)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          className={inputCls}
          placeholder="0.00"
          value={form.betAmount}
          onChange={(e) => set("betAmount", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">Challenge Type</label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: "score", label: "Score-Based", icon: <Target className="w-4 h-4" /> },
            { id: "time", label: "Time-Based", icon: <Clock className="w-4 h-4" /> },
            { id: "completion", label: "Completion", icon: <CheckCircle className="w-4 h-4" /> },
          ] as const).map((ct) => (
            <button
              key={ct.id}
              type="button"
              onClick={() => set("challengeType", ct.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-colors ${
                form.challengeType === ct.id
                  ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                  : "bg-white/[0.03] border-white/[0.06] text-slate-500 hover:text-slate-300"
              }`}
            >
              {ct.icon}
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400">{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting || !form.name.trim() || !form.betAmount}
        className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        {submitting ? "Creating..." : "Create Custom Game"}
      </button>
    </form>
  );
}

// ── Main Game Launcher ───────────────────────────────────────────────────────

export interface PlayableGame {
  id: string;
  name: string;
  type: GameType;
}

interface GameLauncherProps {
  game: PlayableGame;
  onBack: () => void;
  onStatsUpdate: (stats: GameStats) => void;
}

export function GameLauncher({ game, onBack, onStatsUpdate }: GameLauncherProps) {
  const [stats, setStats] = useState<GameStats>({ wins: 0, losses: 0, draws: 0, points: 0 });
  const [gamesPlayed, setGamesPlayed] = useState(0);

  const handleResult = useCallback((result: "win" | "loss" | "draw") => {
    setStats((prev) => {
      const newStats = { ...prev };
      if (result === "win") {
        newStats.wins += 1;
        newStats.points += 2;
      } else if (result === "draw") {
        newStats.draws += 1;
        newStats.points += 1;
      } else {
        newStats.losses += 1;
      }
      onStatsUpdate(newStats);
      return newStats;
    });
    setGamesPlayed((p) => p + 1);
  }, [onStatsUpdate]);

  const renderGame = () => {
    switch (game.type) {
      case "tic_tac_toe":
        return <TicTacToe onResult={handleResult} />;
      case "number_guessing":
        return <NumberGuessing onResult={handleResult} />;
      case "rock_paper_scissors":
        return <RockPaperScissors onResult={handleResult} />;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Games
        </button>
        <h2 className="text-lg font-bold text-white">{game.name}</h2>
        <div className="w-24" />
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center">
          <div className="text-lg font-bold text-violet-400">{stats.points}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Points</div>
        </div>
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center">
          <div className="text-lg font-bold text-emerald-400">{stats.wins}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Wins</div>
        </div>
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center">
          <div className="text-lg font-bold text-red-400">{stats.losses}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Losses</div>
        </div>
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center">
          <div className="text-lg font-bold text-amber-400">{stats.draws}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Draws</div>
        </div>
      </div>

      {/* Game */}
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
        {renderGame()}
      </div>

      {/* Games Played */}
      <div className="text-center mt-4 text-xs text-slate-500">
        Games Played: {gamesPlayed}
      </div>
    </div>
  );
}

// ── Create Custom Game View ──────────────────────────────────────────────────

export function CreateCustomGameView({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Games
        </button>
        <h2 className="text-lg font-bold text-white">Create Custom Game</h2>
        <div className="w-24" />
      </div>

      <div className="max-w-md mx-auto rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
        <CreateCustomGame onCreated={onBack} />
      </div>
    </div>
  );
}
