import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { 
  Trophy, Users, ArrowLeft, Shield, Copy, 
  Crown, Medal, Calendar
} from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LeagueDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [league, setLeague] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeagueData = async () => {
      try {
        const [leagueRes, leaderboardRes] = await Promise.all([
          axios.get(`${API}/groups/${id}`),
          axios.get(`${API}/leaderboards/group/${id}`)
        ]);
        setLeague(leagueRes.data);
        setLeaderboard(leaderboardRes.data);
      } catch (error) {
        console.error("Error fetching league details:", error);
        toast.error("Failed to load league details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchLeagueData();
  }, [id]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Invite code copied!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-muted-foreground animate-pulse font-heading tracking-widest uppercase">
            Loading League...
          </div>
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="container-page flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Shield className="w-16 h-16 text-muted-foreground opacity-50" />
        <h1 className="text-2xl font-bold text-white">League Not Found</h1>
        <Link to="/my-groups">
          <Button variant="secondary">Back to My Leagues</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <Link to="/my-groups" className="inline-flex items-center text-sm text-muted-foreground hover:text-white transition-colors w-fit">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Leagues
        </Link>
        
        <div className="relative overflow-hidden rounded-3xl bg-surface-raised border border-white/5 shadow-2xl p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-primary/5 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-[0_0_30px_rgba(255,190,11,0.2)]">
                <Trophy className="w-10 h-10 text-accent" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold font-heading text-white mb-2">{league.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> {league.member_count} Members
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> Created 2026
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-surface-sunken border border-white/10 rounded-xl px-4 py-2 flex flex-col items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Invite Code</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-mono font-bold text-white tracking-widest">{league.code}</span>
                  <button 
                    onClick={() => copyToClipboard(league.code)}
                    className="p-1 hover:text-white text-muted-foreground transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="stadium-card bg-surface-raised/50 border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white font-heading">Standings</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-xs text-muted-foreground uppercase font-heading tracking-wider">
              <tr>
                <th className="px-6 py-4 w-24 text-center">Rank</th>
                <th className="px-6 py-4">Player</th>
                <th className="px-6 py-4 text-center">Preds</th>
                <th className="px-6 py-4 text-center">Exact</th>
                <th className="px-6 py-4 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leaderboard.map((player, index) => (
                <tr 
                  key={player.user_id} 
                  className={`
                    hover:bg-white/5 transition-colors
                    ${player.user_id === user?.id ? "bg-primary/5" : ""}
                  `}
                >
                  <td className="px-6 py-4 text-center">
                    <div className={`
                      w-8 h-8 rounded-lg mx-auto flex items-center justify-center font-bold text-sm font-heading
                      ${index === 0 ? "bg-accent text-accent-foreground shadow-[0_0_15px_rgba(255,190,11,0.4)]" :
                        index === 1 ? "bg-slate-300 text-slate-900" :
                        index === 2 ? "bg-amber-700 text-amber-100" :
                        "text-muted-foreground bg-surface-sunken"}
                    `}>
                      {index <= 2 ? <Crown className="w-4 h-4" /> : index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-raised border border-white/10 flex items-center justify-center text-sm font-bold text-muted-foreground">
                        {player.avatar ? (
                          <img src={player.avatar} alt={player.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          player.username.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          {player.username}
                          {player.user_id === user?.id && (
                            <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">YOU</span>
                          )}
                        </div>
                        {index === 0 && <div className="text-xs text-accent">Current Leader</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-muted-foreground">{player.predictions_count}</td>
                  <td className="px-6 py-4 text-center font-mono text-muted-foreground">{player.exact_scores || 0}</td>
                  <td className="px-6 py-4 text-right font-heading text-xl font-bold text-white">
                    {player.total_points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {leaderboard.length === 0 && (
             <div className="p-12 text-center text-muted-foreground">
               No members yet. Share the code to invite friends!
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeagueDetails;
