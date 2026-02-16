import { useState, useEffect } from "react";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Shield } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const GroupStage = () => {
  const [standings, setStandings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const res = await axios.get(`${API}/standings`);
        setStandings(res.data);
      } catch (error) {
        console.error("Error fetching standings", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStandings();
  }, []);

  const groups = Object.keys(standings).sort();

  return (
    <div className="container-page min-h-screen">
      <div className="page-header">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading text-white mb-2">Group Stage</h1>
          <p className="text-muted-foreground">Live standings and qualifications.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-muted-foreground font-heading tracking-widest uppercase">Loading Tables...</div>
        </div>
      ) : (
        <Tabs defaultValue={groups[0]} className="space-y-8">
          <div className="overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
            <TabsList className="h-auto p-1.5 bg-surface-raised border border-white/5 rounded-xl inline-flex gap-1 min-w-max">
              {groups.map((group) => (
                <TabsTrigger 
                  key={group} 
                  value={group}
                  className="rounded-lg px-4 py-2 font-heading font-bold"
                >
                  {group.replace("GROUP_", "Group ")}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {groups.map((group) => (
            <TabsContent key={group} value={group} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="stadium-card bg-surface-raised/50 border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-raised flex items-center justify-center border border-white/5 text-lg font-bold font-heading text-primary shadow-[0_0_15px_rgba(0,255,128,0.2)]">
                    {group.replace("GROUP_", "")}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white font-heading">
                      {group.replace("GROUP_", "Group ")}
                    </h2>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">World Cup 2026</div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-white/5 font-heading tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Pos</th>
                        <th className="px-6 py-4">Team</th>
                        <th className="px-6 py-4 text-center">MP</th>
                        <th className="px-6 py-4 text-center">W</th>
                        <th className="px-6 py-4 text-center">D</th>
                        <th className="px-6 py-4 text-center">L</th>
                        <th className="px-6 py-4 text-center">GD</th>
                        <th className="px-6 py-4 text-center">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {standings[group].map((team, index) => (
                        <tr 
                          key={team.team_id} 
                          className={`
                            hover:bg-white/5 transition-colors
                            ${index < 2 ? "bg-primary/[0.02]" : ""}
                          `}
                        >
                          <td className="px-6 py-4">
                            <div className={`
                              w-6 h-6 rounded flex items-center justify-center text-xs font-bold
                              ${index < 2 ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(0,255,128,0.3)]" : "bg-surface-sunken text-muted-foreground"}
                            `}>
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center p-1">
                              <Shield className="w-4 h-4 text-white/50" />
                            </div>
                            {team.team}
                            {index < 2 && <span className="text-[10px] text-primary ml-2 uppercase tracking-wide font-bold bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">Q</span>}
                          </td>
                          <td className="px-6 py-4 text-center font-mono text-muted-foreground">{team.played}</td>
                          <td className="px-6 py-4 text-center font-mono text-muted-foreground">{team.won}</td>
                          <td className="px-6 py-4 text-center font-mono text-muted-foreground">{team.drawn}</td>
                          <td className="px-6 py-4 text-center font-mono text-muted-foreground">{team.lost}</td>
                          <td className="px-6 py-4 text-center font-mono font-bold text-white">
                            {team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}
                          </td>
                          <td className="px-6 py-4 text-center font-heading text-lg font-bold text-accent">
                            {team.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default GroupStage;
