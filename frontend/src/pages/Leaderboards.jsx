import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Trophy, TrendingUp, TrendingDown, Minus, Users, Search } from "lucide-react";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription 
} from "../components/ui/dialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Leaderboards = () => {
  const { user } = useAuth();
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState("global");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [leaderboardRes, groupsRes] = await Promise.all([
        axios.get(`${API}/leaderboards?limit=100`),
        axios.get(`${API}/groups`),
      ]);
      
      setGlobalLeaderboard(leaderboardRes.data);
      setGroups(groupsRes.data);
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

  const getRankBadge = (rank) => {
    if (rank === 1) return "medal-gold";
    if (rank === 2) return "medal-silver";
    if (rank === 3) return "medal-bronze";
    return "bg-[#1E293B] text-[#94A3B8]";
  };

  const filteredLeaderboard = globalLeaderboard.filter(entry =>
    entry.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const LeaderboardTable = ({ data }) => (
    <div className="stadium-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#1E293B] text-xs text-[#94A3B8]">
              <th className="px-4 py-3 text-left">Rank</th>
              <th className="px-4 py-3 text-left">Player</th>
              <th className="px-4 py-3 text-center hidden md:table-cell">Predictions</th>
              <th className="px-4 py-3 text-center hidden md:table-cell">Exact</th>
              <th className="px-4 py-3 text-center hidden md:table-cell">Diff</th>
              <th className="px-4 py-3 text-center hidden md:table-cell">Tendency</th>
              <th className="px-4 py-3 text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry) => (
              <tr 
                key={entry.user_id}
                className={`border-b border-[#1E293B] cursor-pointer transition-all duration-300 row-slide-in ${
                  entry.user_id === user?.id 
                    ? "bg-[#00FF88]/10 hover:bg-[#00FF88]/20 user-row-highlight" 
                    : "hover:bg-[#1E293B]/50"
                }`}
                style={{ animationDelay: `${data.indexOf(entry) * 0.05}s` }}
                onClick={() => setSelectedUser(entry)}
                data-testid={`leaderboard-row-${entry.rank}`}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-transform hover:scale-110 ${getRankBadge(entry.rank)}`}>
                      {entry.rank}
                    </span>
                    {getMovementIcon(entry.movement)}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1E293B] flex items-center justify-center">
                      {entry.avatar ? (
                        <img src={entry.avatar} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        <span className="text-sm font-bold text-[#64748B]">
                          {entry.username?.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-white">{entry.username}</span>
                      {entry.user_id === user?.id && (
                        <span className="ml-2 text-xs text-[#00FF88]">(You)</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-center hidden md:table-cell">
                  <span className="text-sm text-[#94A3B8]">{entry.predictions_count}</span>
                </td>
                <td className="px-4 py-4 text-center hidden md:table-cell">
                  <span className="text-sm text-[#22C55E] font-medium">{entry.exact_scores || 0}</span>
                </td>
                <td className="px-4 py-4 text-center hidden md:table-cell">
                  <span className="text-sm text-[#3B82F6] font-medium">{entry.goal_diffs || 0}</span>
                </td>
                <td className="px-4 py-4 text-center hidden md:table-cell">
                  <span className="text-sm text-[#F59E0B] font-medium">{entry.tendencies || 0}</span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-xl font-bold text-[#00FF88] font-score score-depth counter-animate">{entry.total_points}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="p-12 text-center">
          <Users className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
          <p className="text-[#94A3B8]">No rankings yet</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 
          className="text-3xl md:text-4xl font-bold text-white mb-2"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          data-testid="leaderboards-title"
        >
          <Trophy className="w-8 h-8 inline mr-3 text-[#F59E0B]" />
          LEADERBOARDS
        </h1>
        <p className="text-[#94A3B8]">
          See how you rank against other predictors
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
        <Input
          type="text"
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#151922] border-[#1E293B] text-white placeholder:text-[#64748B] focus:border-[#00FF88]"
          data-testid="search-input"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-[#151922] border border-[#1E293B] p-1 rounded-xl">
          <TabsTrigger 
            value="global"
            className="data-[state=active]:bg-[#00FF88] data-[state=active]:text-black rounded-lg"
            data-testid="tab-global"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Global
          </TabsTrigger>
          {groups.map((group) => (
            <TabsTrigger 
              key={group.id}
              value={group.id}
              className="data-[state=active]:bg-[#00FF88] data-[state=active]:text-black rounded-lg"
              data-testid={`tab-group-${group.id}`}
            >
              <Users className="w-4 h-4 mr-2" />
              {group.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="global" className="mt-6">
          {loading ? (
            <div className="stadium-card p-8">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 skeleton-shimmer" />
                ))}
              </div>
            </div>
          ) : (
            <LeaderboardTable data={filteredLeaderboard} />
          )}
        </TabsContent>

        {groups.map((group) => (
          <TabsContent key={group.id} value={group.id} className="mt-6">
            <GroupLeaderboard groupId={group.id} user={user} onUserClick={setSelectedUser} />
          </TabsContent>
        ))}
      </Tabs>

      {/* User Detail Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="bg-[#151922] border-[#1E293B] text-white max-w-md">
          <DialogHeader>
            <DialogTitle 
              className="text-xl font-bold"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              PLAYER STATS
            </DialogTitle>
            <DialogDescription className="text-[#94A3B8]">
              Detailed breakdown for {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6 mt-4">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#1E293B] flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#64748B]">
                    {selectedUser.username?.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedUser.username}</h3>
                  <p className="text-[#94A3B8]">Rank #{selectedUser.rank}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0B0E14] rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-[#00FF88] font-score">{selectedUser.total_points}</div>
                  <div className="text-xs text-[#94A3B8] mt-1">Total Points</div>
                </div>
                <div className="bg-[#0B0E14] rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-white font-score">{selectedUser.predictions_count}</div>
                  <div className="text-xs text-[#94A3B8] mt-1">Predictions</div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-[#94A3B8] uppercase">Points Breakdown</h4>
                <div className="flex items-center justify-between p-3 bg-[#0B0E14] rounded-lg">
                  <span className="text-sm text-[#94A3B8]">Exact Scores</span>
                  <span className="text-lg font-bold text-[#22C55E] font-score">
                    {selectedUser.exact_scores || 0} × 4 = {(selectedUser.exact_scores || 0) * 4}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#0B0E14] rounded-lg">
                  <span className="text-sm text-[#94A3B8]">Goal Differences</span>
                  <span className="text-lg font-bold text-[#3B82F6] font-score">
                    {selectedUser.goal_diffs || 0} × 3 = {(selectedUser.goal_diffs || 0) * 3}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#0B0E14] rounded-lg">
                  <span className="text-sm text-[#94A3B8]">Correct Tendencies</span>
                  <span className="text-lg font-bold text-[#F59E0B] font-score">
                    {selectedUser.tendencies || 0} × 2 = {(selectedUser.tendencies || 0) * 2}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const GroupLeaderboard = ({ groupId, user, onUserClick }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroupLeaderboard();
  }, [groupId]);

  const fetchGroupLeaderboard = async () => {
    try {
      const res = await axios.get(`${API}/leaderboards/group/${groupId}`);
      setLeaderboard(res.data);
    } catch (error) {
      console.error("Failed to fetch group leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return "medal-gold";
    if (rank === 2) return "medal-silver";
    if (rank === 3) return "medal-bronze";
    return "bg-[#1E293B] text-[#94A3B8]";
  };

  if (loading) {
    return (
      <div className="stadium-card p-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="stadium-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#1E293B] text-xs text-[#94A3B8]">
              <th className="px-4 py-3 text-left">Rank</th>
              <th className="px-4 py-3 text-left">Player</th>
              <th className="px-4 py-3 text-center">Predictions</th>
              <th className="px-4 py-3 text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry) => (
              <tr 
                key={entry.user_id}
                className={`border-b border-[#1E293B] cursor-pointer transition-all duration-300 row-slide-in ${
                  entry.user_id === user?.id 
                    ? "bg-[#00FF88]/10 hover:bg-[#00FF88]/20 user-row-highlight" 
                    : "hover:bg-[#1E293B]/50"
                }`}
                style={{ animationDelay: `${leaderboard.indexOf(entry) * 0.05}s` }}
                onClick={() => onUserClick(entry)}
              >
                <td className="px-4 py-4">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-transform hover:scale-110 ${getRankBadge(entry.rank)}`}>
                    {entry.rank}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm font-medium text-white">{entry.username}</span>
                  {entry.user_id === user?.id && (
                    <span className="ml-2 text-xs text-[#00FF88]">(You)</span>
                  )}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="text-sm text-[#94A3B8]">{entry.predictions_count}</span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-xl font-bold text-[#00FF88] font-score score-depth counter-animate">{entry.total_points}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {leaderboard.length === 0 && (
        <div className="p-12 text-center">
          <Users className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
          <p className="text-[#94A3B8]">No members in this group yet</p>
        </div>
      )}
    </div>
  );
};

export default Leaderboards;
