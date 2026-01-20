import { useState, useEffect } from "react";
import axios from "axios";
import { Flag, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import MatchCard from "../components/MatchCard";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const GroupStage = () => {
  const [standings, setStandings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState("A");
  const [expandedGroups, setExpandedGroups] = useState({});

  const groups = ["A", "B", "C", "D", "E", "F", "G", "H"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [standingsRes, matchesRes, predictionsRes] = await Promise.all([
        axios.get(`${API}/standings`),
        axios.get(`${API}/matches?stage=GROUP_STAGE`),
        axios.get(`${API}/predictions`),
      ]);
      
      setStandings(standingsRes.data);
      setMatches(matchesRes.data);
      
      const predMap = {};
      predictionsRes.data.forEach((p) => {
        predMap[p.match_id] = p;
      });
      setPredictions(predMap);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGroupStandings = (groupLetter) => {
    const groupData = standings.find(s => s.group === groupLetter);
    return groupData?.table || [];
  };

  const getGroupMatches = (groupLetter) => {
    return matches.filter(m => m.group === `GROUP_${groupLetter}`);
  };

  const toggleGroupExpand = (group) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const GroupTable = ({ groupLetter }) => {
    const table = getGroupStandings(groupLetter);
    const groupMatches = getGroupMatches(groupLetter);
    const isExpanded = expandedGroups[groupLetter];

    return (
      <div className="stadium-card overflow-hidden">
        {/* Group Header */}
        <div className="bg-[#1E293B] px-4 py-3 flex items-center justify-between">
          <h3 
            className="text-lg font-bold text-white"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            <Flag className="w-5 h-5 inline mr-2 text-[#00FF88]" />
            GROUP {groupLetter}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleGroupExpand(groupLetter)}
            className="text-[#94A3B8] hover:text-white"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
        </div>

        {/* Standings Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-[#64748B] border-b border-[#1E293B]">
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-4 py-2 text-left">Team</th>
                <th className="px-2 py-2 text-center">P</th>
                <th className="px-2 py-2 text-center">W</th>
                <th className="px-2 py-2 text-center">D</th>
                <th className="px-2 py-2 text-center">L</th>
                <th className="px-2 py-2 text-center">GF</th>
                <th className="px-2 py-2 text-center">GA</th>
                <th className="px-2 py-2 text-center">GD</th>
                <th className="px-2 py-2 text-center font-bold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {table.length > 0 ? (
                table.map((team, idx) => (
                  <tr 
                    key={team.team}
                    className={`border-b border-[#1E293B] ${
                      idx < 2 
                        ? "bg-[#22C55E]/10" 
                        : idx === 2 
                          ? "bg-[#3B82F6]/10" 
                          : ""
                    }`}
                    data-testid={`standing-row-${groupLetter}-${idx}`}
                  >
                    <td className="px-4 py-3 text-sm">
                      <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                        idx < 2 
                          ? "bg-[#22C55E] text-black" 
                          : idx === 2 
                            ? "bg-[#3B82F6] text-white" 
                            : "bg-[#1E293B] text-[#94A3B8]"
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-white">{team.team}</span>
                    </td>
                    <td className="px-2 py-3 text-center text-sm text-[#94A3B8]">{team.played}</td>
                    <td className="px-2 py-3 text-center text-sm text-[#94A3B8]">{team.won}</td>
                    <td className="px-2 py-3 text-center text-sm text-[#94A3B8]">{team.drawn}</td>
                    <td className="px-2 py-3 text-center text-sm text-[#94A3B8]">{team.lost}</td>
                    <td className="px-2 py-3 text-center text-sm text-[#94A3B8]">{team.goals_for}</td>
                    <td className="px-2 py-3 text-center text-sm text-[#94A3B8]">{team.goals_against}</td>
                    <td className="px-2 py-3 text-center text-sm text-white font-medium">
                      {team.goal_diff > 0 ? `+${team.goal_diff}` : team.goal_diff}
                    </td>
                    <td className="px-2 py-3 text-center text-lg font-bold text-[#00FF88] font-score">{team.points}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-[#64748B]">
                    No standings data yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Group Matches (Expandable) */}
        {isExpanded && (
          <div className="p-4 border-t border-[#1E293B] bg-[#0B0E14]/50">
            <h4 className="text-sm font-bold text-[#94A3B8] mb-4 uppercase">Group Matches</h4>
            <div className="space-y-3">
              {groupMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  userPrediction={predictions[match.id]}
                  onPredictionSaved={fetchData}
                />
              ))}
              {groupMatches.length === 0 && (
                <p className="text-center text-[#64748B] py-4">No matches in this group</p>
              )}
            </div>
          </div>
        )}

        {/* Qualification Legend */}
        <div className="px-4 py-3 border-t border-[#1E293B] flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#22C55E]" />
            <span className="text-[#94A3B8]">Round of 16</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#3B82F6]" />
            <span className="text-[#94A3B8]">Possible qualification</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 
          className="text-3xl md:text-4xl font-bold text-white mb-2"
          style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          data-testid="group-stage-title"
        >
          <Flag className="w-8 h-8 inline mr-3 text-[#00FF88]" />
          GROUP STAGE
        </h1>
        <p className="text-[#94A3B8]">
          8 groups • Top 2 from each group qualify for the Round of 16
        </p>
      </div>

      {/* Group Tabs */}
      <Tabs value={selectedGroup} onValueChange={setSelectedGroup} className="mb-8">
        <TabsList className="bg-[#151922] border border-[#1E293B] p-1 rounded-xl flex-wrap">
          {groups.map((group) => (
            <TabsTrigger
              key={group}
              value={group}
              className="data-[state=active]:bg-[#00FF88] data-[state=active]:text-black rounded-lg min-w-[48px]"
              data-testid={`group-tab-${group}`}
            >
              {group}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Content */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stadium-card h-64 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {groups.map((group) => (
            <div 
              key={group}
              className={selectedGroup === group ? "md:col-span-2" : ""}
            >
              <GroupTable groupLetter={group} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupStage;
