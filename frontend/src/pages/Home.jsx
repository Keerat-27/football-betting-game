import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { 
  Trophy, Calendar, ArrowRight, Clock, 
  TrendingUp, TrendingDown, Minus, Users,
  Activity, Star, Zap
} from "lucide-react";
import MatchCard from "../components/MatchCard";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Animated counter hook
const useCountUp = (target, duration = 1200) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(target) || 0;
    if (start === end) return;

    let totalMilSec = duration;
    let incrementTime = (totalMilSec / end) * 1000;

    let timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === end) clearInterval(timer);
    }, 10); // Simplified for React perf

    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
};

const Home = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, matchesRes, leaderboardRes] = await Promise.all([
          axios.get(`${API}/users/${user.id}`),
          axios.get(`${API}/matches`),
          axios.get(`${API}/leaderboard`)
        ]);

        setStats(statsRes.data);
        
        // Filter for upcoming/live matches and sort by date
        const now = new Date();
        const upcoming = matchesRes.data
          .filter(m => new Date(m.utc_date) > new Date(now.getTime() - 2 * 60 * 60 * 1000))
          .sort((a, b) => new Date(a.utc_date) - new Date(b.utc_date))
          .slice(0, 3);
          
        setUpcomingMatches(upcoming);
        setLeaderboard(leaderboardRes.data.slice(0, 5));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  const userRank = leaderboard.findIndex(u => u.id === user?.id) + 1;
  const countPoints = useCountUp(stats?.total_points || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-muted-foreground animate-pulse font-heading tracking-widest uppercase">Loading Arena...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-surface-raised border border-white/5 shadow-2xl p-8 lg:p-12 mb-12">
        {/* CSS Gradient Mesh Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-6 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-xs font-bold uppercase tracking-widest text-primary animate-in fade-in slide-in-from-left-4 duration-700">
              <Zap className="w-3.5 h-3.5 fill-primary" />
              Live Tournament
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[0.9] drop-shadow-sm">
              PREDICT <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">THE GLORY</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed font-sans">
              Join thousands of football fans predicting match outcomes for the World Cup 2026. Compete for the crown in the ultimate prediction arena.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to="/fixtures">
                <Button size="lg" className="rounded-full shadow-[0_0_20px_rgba(0,255,128,0.3)]">
                  Make Predictions <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/leaderboards">
                <Button variant="outline" size="lg" className="rounded-full border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-sm">
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Stats Card */}
          <div className="w-full md:w-80 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/50 to-accent opacity-20 blur-2xl rounded-3xl transform group-hover:scale-105 transition-transform duration-500" />
            <div className="relative bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-raised border border-white/5 flex items-center justify-center text-sm font-bold">
                    {user?.username?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white uppercase tracking-wide">My Rank</div>
                    <div className="text-xs text-muted-foreground">Global League</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white font-heading">#{userRank || "-"}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Points</div>
                  <div className="text-3xl font-bold text-primary font-heading text-glow">{countPoints}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Accuracy</div>
                  <div className="text-3xl font-bold text-white font-heading">
                     {stats?.total_predictions > 0 
                      ? Math.round((stats.correct_predictions / stats.total_predictions) * 100) 
                      : 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Points", value: stats?.total_points || 0, icon: Star, color: "text-accent" },
          { label: "Predictions", value: stats?.total_predictions || 0, icon: Activity, color: "text-blue-400" },
          { label: "Perfect Scores", value: stats?.exact_scores || 0, icon: Trophy, color: "text-primary" },
          { label: "Leagues", value: 3, icon: Users, color: "text-purple-400" },
        ].map((stat, i) => (
          <div key={i} className="stat-card group">
            <div className={`p-2 rounded-xl bg-surface-raised mb-2 group-hover:scale-110 transition-transform duration-300 ${stat.color.replace('text-', 'bg-')}/10`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold font-heading text-white">{stat.value}</div>
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Matches */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-heading text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              UPCOMING MATCHES
            </h2>
            <Link to="/fixtures">
              <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-wider">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          
          <div className="space-y-4">
            {upcomingMatches.length > 0 ? (
              upcomingMatches.map(match => (
                <MatchCard key={match.id} match={match} onPredictionSaved={() => {}} />
              ))
            ) : (
              <div className="p-8 rounded-2xl border border-white/5 bg-surface-raised/50 text-center space-y-3">
                <Calendar className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
                <div className="text-muted-foreground">No upcoming matches scheduled soon.</div>
                <Link to="/fixtures"><Button variant="secondary">Check Full Schedule</Button></Link>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard Widget */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-heading text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              TOP PREDICTORS
            </h2>
          </div>
          
          <div className="bg-surface-raised/50 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden">
            {leaderboard.map((player, index) => (
              <div 
                key={player.id} 
                className={`flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${
                  player.id === user.id ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-heading
                    ${index === 0 ? "bg-accent text-accent-foreground shadow-[0_0_10px_rgba(255,190,11,0.4)]" : 
                      index === 1 ? "bg-slate-300 text-slate-900" :
                      index === 2 ? "bg-amber-700 text-amber-100" : "bg-surface-sunken text-muted-foreground"}
                  `}>
                    {index + 1}
                  </div>
                  <div className="font-bold text-sm text-white">
                    {player.username}
                    {player.id === user.id && <span className="ml-2 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">YOU</span>}
                  </div>
                </div>
                <div className="font-heading font-bold text-accent">{player.total_points} <span className="text-[10px] text-muted-foreground font-sans">PTS</span></div>
              </div>
            ))}
            
            <Link to="/leaderboards" className="block p-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
              View Full Standings
            </Link>
          </div>
          
          {/* My Groups Quick Link */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-surface-raised to-surface-sunken border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full translate-x-10 -translate-y-10 group-hover:bg-primary/20 transition-colors" />
            <Users className="w-8 h-8 text-white mb-4" />
            <h3 className="text-lg font-heading text-white mb-2">Private Leagues</h3>
            <p className="text-sm text-muted-foreground mb-4">Compete with friends in private groups.</p>
            <Link to="/my-groups">
              <Button variant="secondary" className="w-full">Go to My Leagues</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
