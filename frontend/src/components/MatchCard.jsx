import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Clock, Lock, Radio, Check, X, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { format, parseISO, differenceInSeconds } from "date-fns";
import { cn } from "../lib/utils";

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

  const getStatusBadge = () => {
    if (isLive) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider animate-pulse">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          LIVE
        </div>
      );
    }
    if (isFinished) {
      return <div className="badge badge-finished">FT</div>;
    }
    if (isLocked) {
      return <div className="badge border-orange-500/20 text-orange-500 bg-orange-500/10 flex items-center gap-1"><Lock className="w-3 h-3" /> LOCKED</div>;
    }
    return <div className="badge badge-upcoming flex items-center gap-1"><Clock className="w-3 h-3" /> {format(matchDate, "HH:mm")}</div>;
  };

  const getPredictionStatus = () => {
    if (!isFinished || !userPrediction) return null;
    
    const points = userPrediction.points_earned || 0;
    
    const badgeStyle = points === 4 ? "bg-primary/20 text-primary border-primary/20" :
                       points === 3 ? "bg-blue-500/20 text-blue-500 border-blue-500/20" :
                       points === 2 ? "bg-amber-500/20 text-amber-500 border-amber-500/20" :
                       "bg-red-500/10 text-red-500 border-red-500/20";
                       
    const label = points === 4 ? "Exact" :
                  points === 3 ? "Diff" :
                  points === 2 ? "Tendency" : "Miss";

    return (
      <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${badgeStyle}`}>
        {points > 0 ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
        {label} <span className="ml-1 text-xs">+{points}</span>
      </div>
    );
  };

  return (
    <div 
      className={cn(
        "stadium-card p-0 group",
        isFinished && userPrediction?.points_earned === 4 && "border-primary/50 shadow-[0_0_20px_rgba(0,255,128,0.1)]"
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <span className="text-xs text-muted-foreground font-medium">
            {match.group ? match.group.replace("GROUP_", "Group ") : match.stage?.replace("_", " ")}
          </span>
        </div>
        {!isLocked && !isFinished && countdown && (
          <div className={`text-xs font-mono flex items-center gap-1.5 ${
            countdownSeconds < 900 ? "text-red-400 animate-pulse" : "text-primary"
          }`}>
            <Clock className="w-3 h-3" />
            {countdown}
          </div>
        )}
        {getPredictionStatus()}
      </div>

      {/* Match Content */}
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          
          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center gap-2 text-center group/team">
            <div className="w-14 h-14 rounded-2xl bg-surface-raised border border-white/5 flex items-center justify-center p-2.5 transition-all duration-300 group-hover/team:scale-110 group-hover/team:border-white/20 group-hover/team:shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              {match.home_team.crest ? (
                <img src={match.home_team.crest} alt={match.home_team.name} className="w-full h-full object-contain drop-shadow-md" />
              ) : (
                <span className="text-xl font-bold text-muted-foreground">{match.home_team.short_name?.substring(0, 2)}</span>
              )}
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight mb-0.5">{match.home_team.name}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{match.home_team.short_name}</div>
            </div>
          </div>

          {/* Center Score/Input */}
          <div className="flex flex-col items-center gap-3 w-32 shrink-0">
            {isFinished || isLive ? (
              <div className="flex items-center gap-2">
                <span className="text-4xl font-bold text-white font-heading text-glow">{match.score?.home ?? 0}</span>
                <span className="text-xl text-muted-foreground/50 font-heading">:</span>
                <span className="text-4xl font-bold text-white font-heading text-glow">{match.score?.away ?? 0}</span>
              </div>
            ) : showPredictionInput && !isLocked ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={homeScore}
                  onChange={(e) => { setHomeScore(e.target.value); setIsTyping(true); setTimeout(() => setIsTyping(false), 300); }}
                  className={cn(
                    "w-12 h-14 bg-surface-sunken border border-white/10 rounded-lg text-center text-2xl font-bold text-white font-heading focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all",
                    isTyping && "border-primary/50"
                  )}
                  placeholder="-"
                />
                <span className="text-muted-foreground/50 font-heading text-xl">:</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={awayScore}
                  onChange={(e) => { setAwayScore(e.target.value); setIsTyping(true); setTimeout(() => setIsTyping(false), 300); }}
                  className={cn(
                    "w-12 h-14 bg-surface-sunken border border-white/10 rounded-lg text-center text-2xl font-bold text-white font-heading focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all",
                    isTyping && "border-primary/50"
                  )}
                  placeholder="-"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-3xl font-bold text-muted-foreground font-heading">{userPrediction?.home_score ?? "-"}</span>
                  <span className="text-muted-foreground/30 font-heading">:</span>
                  <span className="text-3xl font-bold text-muted-foreground font-heading">{userPrediction?.away_score ?? "-"}</span>
                </div>
                {!isLocked && <div className="text-[10px] text-muted-foreground uppercase tracking-widest">PREDICTION</div>}
              </div>
            )}
            
            {/* Joker Indicator if Locked */}
            {(isLocked || isFinished) && userPrediction?.is_joker && (
               <div className="flex items-center gap-1 text-[10px] font-bold text-accent uppercase tracking-wider">
                 <Zap className="w-3 h-3 fill-accent" /> Joker Active
               </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center gap-2 text-center group/team">
            <div className="w-14 h-14 rounded-2xl bg-surface-raised border border-white/5 flex items-center justify-center p-2.5 transition-all duration-300 group-hover/team:scale-110 group-hover/team:border-white/20 group-hover/team:shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              {match.away_team.crest ? (
                <img src={match.away_team.crest} alt={match.away_team.name} className="w-full h-full object-contain drop-shadow-md" />
              ) : (
                <span className="text-xl font-bold text-muted-foreground">{match.away_team.short_name?.substring(0, 2)}</span>
              )}
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight mb-0.5">{match.away_team.name}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{match.away_team.short_name}</div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer / Actions */}
      {showPredictionInput && !isLocked && !isFinished && (
        <div className="px-4 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between gap-3">
          <button
            onClick={() => setIsJoker(!isJoker)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 border",
              isJoker
                ? "bg-accent/10 text-accent border-accent/30 shadow-[0_0_10px_rgba(255,190,11,0.2)]"
                : "bg-transparent text-muted-foreground border-transparent hover:bg-white/5 hover:text-white"
            )}
          >
            <Zap className={cn("w-3.5 h-3.5 transition-all", isJoker && "fill-accent scale-110")} />
            2x Joker
          </button>
          
          <Button
            onClick={savePrediction}
            disabled={saving || homeScore === "" || awayScore === ""}
            size="sm"
            className={cn(
              "btn-primary h-9 px-6 text-xs",
              saveSuccess && "bg-success text-white border-none shadow-[0_0_15px_rgba(34,197,94,0.4)]"
            )}
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : saveSuccess ? (
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> SAVED</span>
            ) : (
              "SAVE PREDICTION"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default MatchCard;
