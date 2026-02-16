import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { 
  Mail, Trophy, Star, Activity, 
  MapPin, Calendar, Edit2, LogOut, Check, X, TrendingUp
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Profile = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [statsRes, predsRes] = await Promise.all([
          axios.get(`${API}/users/${user.id}`),
          axios.get(`${API}/predictions/user/${user.id}`)
        ]);
        setStats(statsRes.data);
        setPredictions(predsRes.data);
      } catch (error) {
        console.error("Error fetching profile data", error);
      }
    };

    if (user) fetchProfileData();
  }, [user]);

  return (
    <div className="container-page min-h-screen space-y-8">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-surface-raised border border-white/5 shadow-2xl">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/5 to-accent/10 relative">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        </div>
        
        <div className="px-8 pb-8 flex flex-col md:flex-row items-end -mt-12 gap-6 relative z-10">
          <div className="w-24 h-24 rounded-2xl bg-background border-4 border-surface-raised shadow-xl flex items-center justify-center p-1">
            <div className="w-full h-full rounded-xl bg-surface-raised flex items-center justify-center text-3xl font-bold font-heading text-primary">
              {user?.username?.substring(0, 2).toUpperCase()}
            </div>
          </div>
          
          <div className="flex-1 space-y-1 pb-2">
            <h1 className="text-3xl font-bold font-heading text-white">{user?.username}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {user?.email}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Global League</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Joined 2026</span>
            </div>
          </div>

          <div className="flex gap-3 pb-2">
            <Button variant="outline" size="sm" className="border-white/10 bg-white/5 hover:bg-white/10">
              <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
            </Button>
            <Button variant="destructive" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Points", value: stats?.total_points || 0, icon: Star, color: "text-accent", bg: "bg-accent/10" },
          { label: "Exact Scores", value: stats?.exact_scores || 0, icon: Trophy, color: "text-primary", bg: "bg-primary/10" },
          { label: "Accuracy", value: `${stats?.total_predictions > 0 ? Math.round((stats.correct_predictions / stats.total_predictions) * 100) : 0}%`, icon: Activity, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Predictions", value: stats?.total_predictions || 0, icon: Check, color: "text-purple-400", bg: "bg-purple-500/10" },
        ].map((stat, i) => (
          <div key={i} className="bg-surface-raised/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 hover:bg-white/5 transition-colors group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-3xl font-bold font-heading text-white mb-1">{stat.value}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Prediction History */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="history" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-bold text-white">Prediction History</h2>
              <TabsList className="bg-surface-raised p-1 rounded-xl h-auto border border-white/5">
                <TabsTrigger value="history" className="rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wide">All</TabsTrigger>
                <TabsTrigger value="exact" className="rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wide">Exact</TabsTrigger>
                <TabsTrigger value="missed" className="rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wide">Missed</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="history" className="space-y-3">
              {predictions.length > 0 ? (
                predictions.map((pred) => (
                  <div key={pred.id} className="bg-surface-raised/30 border border-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-10 h-10 rounded-lg flex flex-col items-center justify-center text-xs font-bold border
                        ${pred.points_earned === 4 ? "bg-accent/10 border-accent/20 text-accent" : 
                          pred.points_earned > 0 ? "bg-primary/10 border-primary/20 text-primary" : "bg-white/5 border-white/10 text-muted-foreground"}
                      `}>
                        <span className="text-lg leading-none font-heading">{pred.points_earned || 0}</span>
                        <span className="text-[8px] uppercase">PTS</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white mb-0.5">Match #{pred.match_id}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          Prediction: <span className="text-white font-mono">{pred.home_score} - {pred.away_score}</span>
                          {pred.is_joker && <span className="bg-accent/20 text-accent px-1.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5"><Activity className="w-3 h-3" /> Joker</span>}
                        </div>
                      </div>
                    </div>
                    {pred.points_earned === 4 ? (
                      <div className="px-2 py-1 bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider rounded border border-accent/20 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-accent" /> Perfect
                      </div>
                    ) : pred.points_earned > 0 ? (
                      <div className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded border border-primary/20 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Hit
                      </div>
                    ) : (
                      <div className="px-2 py-1 bg-white/5 text-muted-foreground text-[10px] font-bold uppercase tracking-wider rounded border border-white/10 flex items-center gap-1">
                        <X className="w-3 h-3" /> Miss
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-surface-raised/20 rounded-2xl border border-dashed border-white/5">
                  <div className="text-muted-foreground">No predictions yet.</div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Breakdown Stats */}
        <div className="space-y-6">
          <h2 className="text-xl font-heading font-bold text-white">Performance</h2>
          <div className="bg-surface-raised/50 border border-white/5 rounded-2xl p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <span>Exact Scores (4pts)</span>
                <span className="text-white">12%</span>
              </div>
              <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                <div className="h-full bg-accent w-[12%] rounded-full shadow-[0_0_10px_rgba(255,190,11,0.5)]" />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <span>Correct Diff (3pts)</span>
                <span className="text-white">28%</span>
              </div>
              <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[28%] rounded-full" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <span>Tendency (2pts)</span>
                <span className="text-white">45%</span>
              </div>
              <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[45%] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)]" />
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center gap-3 p-3 bg-surface-sunken rounded-xl">
                 <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold">
                   <TrendingUp className="w-5 h-5" />
                 </div>
                 <div>
                   <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Current Form</div>
                   <div className="text-sm font-bold text-white">Top 15% of players</div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
