import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Trophy, Search, Medal, User, TrendingUp, 
  MapPin, Star, Activity, Crown
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Leaderboards = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get(`${API}/leaderboard`);
      setLeaderboard(res.data);
    } catch (error) {
      console.error("Error fetching leaderboard", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async (userId) => {
    try {
      const res = await axios.get(`${API}/users/${userId}`);
      setUserStats(res.data);
    } catch (error) {
      console.error("Error fetching user stats", error);
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setUserStats(null); // Reset while loading
    fetchUserStats(user.id);
  };

  const filteredLeaderboard = leaderboard.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-page min-h-screen">
      <div className="page-header">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading text-white mb-2">Global Rankings</h1>
          <p className="text-muted-foreground">The best predictors in the world.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search players..." 
            className="pl-9 bg-surface-raised border-white/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="stadium-card bg-surface-raised/50 border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-xs text-muted-foreground uppercase font-heading tracking-wider">
              <tr>
                <th className="px-6 py-4 w-24 text-center">Rank</th>
                <th className="px-6 py-4">Player</th>
                <th className="px-6 py-4 text-center">Correct</th>
                <th className="px-6 py-4 text-center">Variances</th>
                <th className="px-6 py-4 text-right">Points</th>
                <th className="px-6 py-4 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLeaderboard.map((user, index) => (
                <tr 
                  key={user.id} 
                  onClick={() => handleUserClick(user)}
                  className="group hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 text-center">
                    <div className={`
                      w-8 h-8 rounded-lg mx-auto flex items-center justify-center font-bold text-sm font-heading
                      ${index === 0 ? "bg-accent text-accent-foreground shadow-[0_0_15px_rgba(255,190,11,0.4)]" :
                        index === 1 ? "bg-slate-300 text-slate-900 shadow-[0_0_10px_rgba(203,213,225,0.3)]" :
                        index === 2 ? "bg-amber-700 text-amber-100 shadow-[0_0_10px_rgba(180,83,9,0.3)]" :
                        "text-muted-foreground bg-surface-sunken"}
                    `}>
                      {index <= 2 ? <Crown className="w-4 h-4" /> : index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-raised border border-white/10 flex items-center justify-center text-sm font-bold text-muted-foreground">
                        {user.username.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-white group-hover:text-primary transition-colors">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-muted-foreground">{user.correct_predictions || 0}</td>
                  <td className="px-6 py-4 text-center font-mono text-muted-foreground">{12}</td> {/* Placeholder for variance */}
                  <td className="px-6 py-4 text-right font-heading text-xl font-bold text-white">
                    {user.total_points}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredLeaderboard.length === 0 && (
             <div className="p-12 text-center text-muted-foreground">
               No players found matching "{searchTerm}"
             </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md bg-surface-raised border-white/10">
          <DialogHeader className="border-b border-white/5 pb-6">
             <div className="flex flex-col items-center gap-4">
               <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-[0_0_20px_rgba(0,255,128,0.2)]">
                  <span className="text-3xl font-bold text-primary font-heading">
                    {selectedUser?.username.substring(0, 2).toUpperCase()}
                  </span>
               </div>
               <div className="text-center">
                 <DialogTitle className="text-2xl font-bold text-white mb-1">
                   {selectedUser?.username}
                 </DialogTitle>
                 <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                   <Medal className="w-4 h-4 text-accent" /> Rank #{leaderboard.findIndex(u => u.id === selectedUser?.id) + 1}
                 </div>
               </div>
             </div>
          </DialogHeader>

          {userStats ? (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="bg-surface-sunken p-4 rounded-xl text-center border border-white/5">
                <div className="text-3xl font-bold text-white font-heading mb-1">{userStats.total_points}</div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Points</div>
              </div>
              <div className="bg-surface-sunken p-4 rounded-xl text-center border border-white/5">
                <div className="text-3xl font-bold text-primary font-heading mb-1">{userStats.correct_predictions}</div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Exact Scores</div>
              </div>
              <div className="bg-surface-sunken p-4 rounded-xl text-center border border-white/5">
                <div className="text-3xl font-bold text-blue-400 font-heading mb-1">
                  {userStats?.total_predictions > 0 
                     ? Math.round((userStats.correct_predictions / userStats.total_predictions) * 100) 
                     : 0}%
                </div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Accuracy</div>
              </div>
              <div className="bg-surface-sunken p-4 rounded-xl text-center border border-white/5">
                <div className="text-3xl font-bold text-accent font-heading mb-1">24</div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Streak</div>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          
          <div className="flex justify-center pt-2">
            <Button variant="secondary" className="w-full" onClick={() => setSelectedUser(null)}>
              Close Profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leaderboards;
