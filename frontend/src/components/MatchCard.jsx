import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Clock, Lock, Radio, Check, X, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { format, parseISO, differenceInSeconds } from "date-fns";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MatchCard = ({ match, showPredictionInput = true, userPrediction = null, onPredictionSaved }) => {
  const [homeScore, setHomeScore] = useState(userPrediction?.home_score ?? "");
  const [awayScore, setAwayScore] = useState(userPrediction?.away_score ?? "");
  const [isJoker, setIsJoker] = useState(userPrediction?.is_joker ?? false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [countdownSeconds, setCountdownSeconds] = useState(Infinity);
  const [isTyping, setIsTyping] = useState(false);

  const matchDate = parseISO(match.utc_date);
  const lockTime = new Date(matchDate.getTime() - 15 * 60 * 1000);
  const now = new Date();
  const isLocked = now >= lockTime;
  const isLive = match.status === "IN_PLAY" || match.status === "PAUSED";
  const isFinished = match.status === "FINISHED";

  useEffect(() => {
    if (userPrediction) {
      setHomeScore(userPrediction.home_score);
      setAwayScore(userPrediction.away_score);
      setIsJoker(userPrediction.is_joker);
    }
  }, [userPrediction]);

  useEffect(() => {
    if (isLocked || isFinished) return;

    const timer = setInterval(() => {
      const diff = differenceInSeconds(lockTime, new Date());
      if (diff <= 0) {
        setCountdown("LOCKED");
        setCountdownSeconds(0);
        clearInterval(timer);
      } else {
        setCountdownSeconds(diff);
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setCountdown(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lockTime, isLocked, isFinished]);

  const savePrediction = async () => {
    if (homeScore === "" || awayScore === "") {
      toast.error("Please enter both scores");
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API}/predictions`, {
        match_id: match.id,
        home_score: parseInt(homeScore),
        away_score: parseInt(awayScore),
        is_joker: isJoker,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 600);
      toast.success("Prediction saved!");
      if (onPredictionSaved) onPredictionSaved();
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to save prediction";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const getCountdownClass = () => {
    if (countdownSeconds > 3600) return "countdown-safe";
    if (countdownSeconds > 900) return "countdown-warning";
    return "countdown-urgent";
  };

  const getStatusBadge = () => {
    if (isLive) {
      return <span className="badge-live flex items-center gap-1"><Radio className="w-3 h-3" /> LIVE</span>;
    }
    if (isFinished) {
      return <span className="badge-finished">FINISHED</span>;
    }
    if (isLocked) {
      return <span className="badge-locked flex items-center gap-1"><Lock className="w-3 h-3" /> LOCKED</span>;
    }
    return <span className="badge-upcoming flex items-center gap-1"><Clock className="w-3 h-3" /> OPEN</span>;
  };

  const getPointsBadge = () => {
    if (!isFinished || !userPrediction) return null;
    
    const points = userPrediction.points_earned || 0;
    if (points === 4) {
      return <span className="points-pop bg-[#22C55E] text-white px-2 py-0.5 text-xs font-bold rounded flex items-center gap-1"><Check className="w-3 h-3" /> +4 Exact</span>;
    }
    if (points === 3) {
      return <span className="points-pop bg-[#3B82F6] text-white px-2 py-0.5 text-xs font-bold rounded flex items-center gap-1"><Check className="w-3 h-3" /> +3 Diff</span>;
    }
    if (points === 2) {
      return <span className="points-pop bg-[#F59E0B] text-white px-2 py-0.5 text-xs font-bold rounded flex items-center gap-1"><Check className="w-3 h-3" /> +2 Tendency</span>;
    }
    return <span className="points-pop bg-[#EF4444] text-white px-2 py-0.5 text-xs font-bold rounded flex items-center gap-1"><X className="w-3 h-3" /> 0</span>;
  };

  return (
    <div 
      className={`stadium-card p-5 ${isFinished && userPrediction ? (
        userPrediction.points_earned === 4 ? "correct-exact border-2" :
        userPrediction.points_earned === 3 ? "correct-diff border-2" :
        userPrediction.points_earned === 2 ? "correct-tendency border-2" :
        userPrediction.points_earned === 0 ? "incorrect border-2" : ""
      ) : ""}`}
      data-testid={`match-card-${match.id}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          {getPointsBadge()}
        </div>
        {!isLocked && !isFinished && countdown && (
          <div className={`text-xs font-mono flex items-center gap-1 ${getCountdownClass()}`}>
            <Clock className="w-3 h-3" />
            Locks in {countdown}
          </div>
        )}
      </div>

      {/* Match Info */}
      <div className="flex items-center justify-between gap-4">
        {/* Home Team */}
        <div className="flex-1 text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-[#1E293B] flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-[0_0_15px_rgba(0,255,136,0.2)]">
            {match.home_team.crest ? (
              <img src={match.home_team.crest} alt={match.home_team.name} className="w-8 h-8 object-contain drop-shadow-lg" />
            ) : (
              <span className="text-lg font-bold text-[#64748B]">{match.home_team.short_name?.substring(0, 2)}</span>
            )}
          </div>
          <div className="text-sm font-medium text-white truncate">{match.home_team.name}</div>
          <div className="text-xs text-[#64748B]">{match.home_team.short_name}</div>
        </div>

        {/* Score / Prediction */}
        <div className="flex flex-col items-center gap-2">
          {isFinished || isLive ? (
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold text-white font-score score-depth">{match.score?.home ?? "-"}</span>
              <span className="text-2xl text-[#64748B]">:</span>
              <span className="text-4xl font-bold text-white font-score score-depth">{match.score?.away ?? "-"}</span>
            </div>
          ) : showPredictionInput && !isLocked ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="20"
                value={homeScore}
                onChange={(e) => { setHomeScore(e.target.value); setIsTyping(true); setTimeout(() => setIsTyping(false), 300); }}
                className={`input-score ${isTyping ? 'ring-1 ring-[#00FF88]/30' : ''}`}
                placeholder="-"
                data-testid={`home-score-input-${match.id}`}
              />
              <span className="text-xl text-[#64748B]">:</span>
              <input
                type="number"
                min="0"
                max="20"
                value={awayScore}
                onChange={(e) => { setAwayScore(e.target.value); setIsTyping(true); setTimeout(() => setIsTyping(false), 300); }}
                className={`input-score ${isTyping ? 'ring-1 ring-[#00FF88]/30' : ''}`}
                placeholder="-"
                data-testid={`away-score-input-${match.id}`}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-[#64748B] font-score">{userPrediction?.home_score ?? "-"}</span>
              <span className="text-xl text-[#64748B]">:</span>
              <span className="text-3xl font-bold text-[#64748B] font-score">{userPrediction?.away_score ?? "-"}</span>
            </div>
          )}

          {/* Time */}
          <div className="text-xs text-[#94A3B8]">
            {format(matchDate, "MMM d, yyyy • HH:mm")}
          </div>
        </div>

        {/* Away Team */}
        <div className="flex-1 text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-[#1E293B] flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-[0_0_15px_rgba(0,255,136,0.2)]">
            {match.away_team.crest ? (
              <img src={match.away_team.crest} alt={match.away_team.name} className="w-8 h-8 object-contain drop-shadow-lg" />
            ) : (
              <span className="text-lg font-bold text-[#64748B]">{match.away_team.short_name?.substring(0, 2)}</span>
            )}
          </div>
          <div className="text-sm font-medium text-white truncate">{match.away_team.name}</div>
          <div className="text-xs text-[#64748B]">{match.away_team.short_name}</div>
        </div>
      </div>

      {/* Joker & Save */}
      {showPredictionInput && !isLocked && !isFinished && (
        <div className="mt-4 pt-4 border-t border-[#1E293B] flex items-center justify-between">
          <button
            onClick={() => setIsJoker(!isJoker)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              isJoker
                ? "bg-[#D946EF]/20 text-[#D946EF] border border-[#D946EF] joker-active shadow-[0_0_15px_rgba(217,70,239,0.3)]"
                : "bg-[#1E293B] text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/80"
            }`}
            data-testid={`joker-toggle-${match.id}`}
          >
            <Zap className={`w-4 h-4 transition-all duration-300 ${isJoker ? "scale-125 drop-shadow-[0_0_6px_rgba(217,70,239,0.8)]" : ""}`} />
            2x Joker
          </button>
          
          <Button
            onClick={savePrediction}
            disabled={saving || homeScore === "" || awayScore === ""}
            className={`btn-primary px-6 rounded-lg ${saveSuccess ? "save-success" : ""}`}
            data-testid={`save-prediction-${match.id}`}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Saving
              </span>
            ) : saveSuccess ? (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Saved!
              </span>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      )}

      {/* User prediction display for locked/finished */}
      {(isLocked || isFinished) && userPrediction && (
        <div className="mt-4 pt-4 border-t border-[#1E293B]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#64748B]">Your prediction:</span>
            <span className="text-white font-medium font-score">
              {userPrediction.home_score} - {userPrediction.away_score}
              {userPrediction.is_joker && (
                <span className="ml-2 text-[#D946EF]">
                  <Zap className="w-4 h-4 inline" /> 2x
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Group/Stage info */}
      {match.group && (
        <div className="mt-3 text-center">
          <span className="text-xs text-[#64748B]">
            {match.group.replace("GROUP_", "Group ")} • Matchday {match.matchday}
          </span>
        </div>
      )}
    </div>
  );
};

export default MatchCard;
