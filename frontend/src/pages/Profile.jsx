import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { 
  User, Trophy, Target, Calendar, 
  Check, TrendingUp, Percent, Users
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import MatchCard from "../components/MatchCard";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [matches, setMatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, predictionsRes, matchesRes] = await Promise.all([
        axios.get(`${API}/users/profile`),
        axios.get(`${API}/predictions`),
        axios.get(`${API}/matches`),
      ]);
      
      setProfile(profileRes.data);
      setPredictions(predictionsRes.data);
      
      // Create match lookup
      const matchMap = {};
      matchesRes.data.forEach(m => {
        matchMap[m.id] = m;
      });
      setMatches(matchMap);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterPredictions = (status) => {
    return predictions.filter(p => {
      const match = matches[p.match_id];
      if (!match) return false;
      
      if (status === "upcoming") return match.status === "SCHEDULED";
      if (status === "live") return match.status === "IN_PLAY" || match.status === "PAUSED";
      if (status === "finished") return match.status === "FINISHED";
      return true;
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="stadium-card h-48 animate-pulse" />
          <div className="stadium-card h-32 animate-pulse" />
          <div className="stadium-card h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  const stats = profile?.stats || {};

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="stadium-card p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-[#1E293B] flex items-center justify-center">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-24 h-24 rounded-2xl" />
            ) : (
              <span className="text-3xl font-bold text-[#64748B]">
                {user?.username?.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 
              className="text-3xl font-bold text-white mb-2"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
              data-testid="profile-username"
            >
              {user?.username}
            </h1>
            <p className="text-[#94A3B8]">{user?.email}</p>
            <div className="flex items-center justify-center md:justify-start gap-4 mt-3">
              <span className="text-sm text-[#94A3B8]">
                <Trophy className="w-4 h-4 inline mr-1 text-[#F59E0B]" />
                Rank #{stats.global_rank || "-"}
              </span>
              <span className="text-sm text-[#94A3B8]">
                <Users className="w-4 h-4 inline mr-1 text-[#3B82F6]" />
                {stats.groups_count || 0} groups
              </span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-5xl font-bold text-[#00FF88] font-score">{stats.total_points || 0}</div>
            <div className="text-sm text-[#94A3B8] mt-1">Total Points</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="stadium-card p-4 text-center">
          <Target className="w-6 h-6 text-[#22C55E] mx-auto mb-2" />
          <div className="text-2xl font-bold text-white font-score">{stats.exact_scores || 0}</div>
          <div className="text-xs text-[#94A3B8]">Exact Scores</div>
        </div>
        <div className="stadium-card p-4 text-center">
          <TrendingUp className="w-6 h-6 text-[#3B82F6] mx-auto mb-2" />
          <div className="text-2xl font-bold text-white font-score">{stats.goal_diffs || 0}</div>
          <div className="text-xs text-[#94A3B8]">Goal Diffs</div>
        </div>
        <div className="stadium-card p-4 text-center">
          <Check className="w-6 h-6 text-[#F59E0B] mx-auto mb-2" />
          <div className="text-2xl font-bold text-white font-score">{stats.tendencies || 0}</div>
          <div className="text-xs text-[#94A3B8]">Tendencies</div>
        </div>
        <div className="stadium-card p-4 text-center">
          <Percent className="w-6 h-6 text-[#D946EF] mx-auto mb-2" />
          <div className="text-2xl font-bold text-white font-score">{stats.accuracy || 0}%</div>
          <div className="text-xs text-[#94A3B8]">Accuracy</div>
        </div>
      </div>

      {/* Points Breakdown */}
      <div className="stadium-card p-6 mb-8">
        <h2 
          className="text-xl font-bold text-white mb-4"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          POINTS BREAKDOWN
        </h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[#94A3B8]">Exact Score (×4)</span>
            <div className="flex items-center gap-4">
              <div className="w-32 h-2 bg-[#0B0E14] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#22C55E] rounded-full"
                  style={{ width: `${Math.min((stats.exact_scores || 0) / Math.max(stats.predictions_count, 1) * 100, 100)}%` }}
                />
              </div>
              <span className="text-lg font-bold text-[#22C55E] font-score w-16 text-right">
                {(stats.exact_scores || 0) * 4}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#94A3B8]">Goal Difference (×3)</span>
            <div className="flex items-center gap-4">
              <div className="w-32 h-2 bg-[#0B0E14] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#3B82F6] rounded-full"
                  style={{ width: `${Math.min((stats.goal_diffs || 0) / Math.max(stats.predictions_count, 1) * 100, 100)}%` }}
                />
              </div>
              <span className="text-lg font-bold text-[#3B82F6] font-score w-16 text-right">
                {(stats.goal_diffs || 0) * 3}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#94A3B8]">Correct Tendency (×2)</span>
            <div className="flex items-center gap-4">
              <div className="w-32 h-2 bg-[#0B0E14] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#F59E0B] rounded-full"
                  style={{ width: `${Math.min((stats.tendencies || 0) / Math.max(stats.predictions_count, 1) * 100, 100)}%` }}
                />
              </div>
              <span className="text-lg font-bold text-[#F59E0B] font-score w-16 text-right">
                {(stats.tendencies || 0) * 2}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* My Predictions */}
      <div className="stadium-card p-6">
        <h2 
          className="text-xl font-bold text-white mb-4"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          MY PREDICTIONS
        </h2>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#0B0E14] border border-[#1E293B] p-1 rounded-xl mb-6">
            <TabsTrigger 
              value="upcoming"
              className="data-[state=active]:bg-[#00FF88] data-[state=active]:text-black rounded-lg"
            >
              Upcoming ({filterPredictions("upcoming").length})
            </TabsTrigger>
            <TabsTrigger 
              value="live"
              className="data-[state=active]:bg-[#EF4444] data-[state=active]:text-white rounded-lg"
            >
              Live ({filterPredictions("live").length})
            </TabsTrigger>
            <TabsTrigger 
              value="finished"
              className="data-[state=active]:bg-[#00FF88] data-[state=active]:text-black rounded-lg"
            >
              Finished ({filterPredictions("finished").length})
            </TabsTrigger>
          </TabsList>

          {["upcoming", "live", "finished"].map((status) => (
            <TabsContent key={status} value={status}>
              {filterPredictions(status).length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {filterPredictions(status).map((pred) => {
                    const match = matches[pred.match_id];
                    if (!match) return null;
                    return (
                      <MatchCard
                        key={pred.id}
                        match={match}
                        userPrediction={pred}
                        showPredictionInput={false}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
                  <p className="text-[#94A3B8]">No {status} predictions</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
