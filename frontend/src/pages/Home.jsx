import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { 
  Trophy, Calendar, ArrowRight, Clock, 
  TrendingUp, TrendingDown, Minus, Users
} from "lucide-react";
import MatchCard from "../components/MatchCard";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Home = () => {
  const { user } = useAuth();
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matchesRes, leaderboardRes, profileRes] = await Promise.all([
        axios.get(`${API}/matches?status=SCHEDULED`),
        axios.get(`${API}/leaderboards?limit=5`),
        axios.get(`${API}/users/profile`),
      ]);
      
      setUpcomingMatches(matchesRes.data.slice(0, 4));
      setLeaderboard(leaderboardRes.data);
      setUserStats(profileRes.data.stats);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMovementIcon = (movement) => {
    if (movement > 0) return <TrendingUp className="w-4 h-4 text-[#22C55E]" />;
    if (movement < 0) return <TrendingDown className="w-4 h-4 text-[#EF4444]" />;
    return <Minus className="w-4 h-4 text-[#64748B]" />;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative h-[60vh] min-h-[400px] flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(11, 14, 20, 0.7), rgba(11, 14, 20, 0.95)), url('https://images.pexels.com/photos/31160144/pexels-photo-31160144.jpeg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-full px-4 py-2 mb-6">
            <Trophy className="w-4 h-4 text-[#00FF88]" />
            <span className="text-sm text-[#00FF88] font-medium">FIFA World Cup 2026</span>
          </div>
          
          <h1 
            className="text-5xl md:text-7xl font-bold text-white mb-4"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            data-testid="hero-title"
          >
            PREDICT. COMPETE. WIN.
          </h1>
          
          <p className="text-lg md:text-xl text-[#94A3B8] mb-8 max-w-2xl mx-auto">
            Make your predictions for every World Cup match and compete with friends and the global community.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/fixtures">
              <Button 
                className="btn-primary h-14 px-8 text-lg rounded-xl"
                data-testid="cta-make-predictions"
              >
                Make Predictions
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/leaderboards">
              <Button 
                className="btn-secondary h-14 px-8 text-lg rounded-xl"
                data-testid="cta-view-rankings"
              >
                View Rankings
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      {userStats && (
        <section className="bg-[#151922] border-y border-[#1E293B]">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#00FF88] font-score">{userStats.total_points}</div>
                <div className="text-sm text-[#94A3B8] mt-1">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white font-score">#{userStats.global_rank}</div>
                <div className="text-sm text-[#94A3B8] mt-1">Global Rank</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white font-score">{userStats.predictions_count}</div>
                <div className="text-sm text-[#94A3B8] mt-1">Predictions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white font-score">{userStats.accuracy}%</div>
                <div className="text-sm text-[#94A3B8] mt-1">Accuracy</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Upcoming Matches */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 
                className="text-2xl font-bold text-white"
                style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
              >
                <Calendar className="w-6 h-6 inline mr-2 text-[#00FF88]" />
                UPCOMING MATCHES
              </h2>
              <Link to="/fixtures" className="text-[#00FF88] hover:text-[#00CC6A] text-sm font-medium flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="stadium-card h-48 animate-pulse" />
                ))}
              </div>
            ) : upcomingMatches.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {upcomingMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <div className="stadium-card p-12 text-center">
                <Calendar className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
                <p className="text-[#94A3B8]">No upcoming matches scheduled</p>
              </div>
            )}
          </div>

          {/* Leaderboard Widget */}
          <div className="lg:col-span-4">
            <div className="flex items-center justify-between mb-6">
              <h2 
                className="text-2xl font-bold text-white"
                style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
              >
                <Trophy className="w-6 h-6 inline mr-2 text-[#F59E0B]" />
                TOP 5
              </h2>
              <Link to="/leaderboards" className="text-[#00FF88] hover:text-[#00CC6A] text-sm font-medium flex items-center gap-1">
                Full Rankings <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="stadium-card p-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-14 bg-[#1E293B] rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : leaderboard.length > 0 ? (
                <div className="space-y-2">
                  {leaderboard.map((entry, idx) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        entry.user_id === user?.id
                          ? "bg-[#00FF88]/10 border border-[#00FF88]/30"
                          : "hover:bg-[#1E293B]/50"
                      }`}
                      data-testid={`leaderboard-row-${idx + 1}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        idx === 0 ? "bg-[#F59E0B] text-black" :
                        idx === 1 ? "bg-[#94A3B8] text-black" :
                        idx === 2 ? "bg-[#CD7F32] text-black" :
                        "bg-[#1E293B] text-[#94A3B8]"
                      }`}>
                        {entry.rank}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {entry.username}
                        </div>
                        <div className="text-xs text-[#64748B]">
                          {entry.predictions_count} predictions
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getMovementIcon(entry.movement)}
                        <div className="text-right">
                          <div className="text-lg font-bold text-[#00FF88] font-score">
                            {entry.total_points}
                          </div>
                          <div className="text-xs text-[#64748B]">pts</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
                  <p className="text-[#94A3B8]">No rankings yet</p>
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <Link to="/groups-stage" className="stadium-card p-4 hover:border-[#3B82F6] transition-colors group">
                <div className="text-[#3B82F6] mb-2">
                  <Users className="w-6 h-6" />
                </div>
                <div className="text-sm font-medium text-white group-hover:text-[#3B82F6] transition-colors">
                  Group Stage
                </div>
              </Link>
              <Link to="/knockout" className="stadium-card p-4 hover:border-[#D946EF] transition-colors group">
                <div className="text-[#D946EF] mb-2">
                  <Trophy className="w-6 h-6" />
                </div>
                <div className="text-sm font-medium text-white group-hover:text-[#D946EF] transition-colors">
                  Knockout Bracket
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
