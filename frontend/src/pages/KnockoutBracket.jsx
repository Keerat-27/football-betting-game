import { useState, useEffect } from "react";
import axios from "axios";
import { GitBranch, Trophy, List, LayoutGrid } from "lucide-react";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import MatchCard from "../components/MatchCard";
import { format, parseISO } from "date-fns";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const KnockoutBracket = () => {
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("bracket");
  const [activeStage, setActiveStage] = useState("LAST_16");

  const stages = [
    { id: "LAST_16", label: "Round of 16", matches: 8 },
    { id: "QUARTER_FINALS", label: "Quarter Finals", matches: 4 },
    { id: "SEMI_FINALS", label: "Semi Finals", matches: 2 },
    { id: "THIRD_PLACE", label: "3rd Place", matches: 1 },
    { id: "FINAL", label: "Final", matches: 1 },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const knockoutStages = ["LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"];
      const matchPromises = knockoutStages.map(stage => 
        axios.get(`${API}/matches?stage=${stage}`)
      );
      const predictionsRes = await axios.get(`${API}/predictions`);
      
      const matchResponses = await Promise.all(matchPromises);
      const allMatches = matchResponses.flatMap(res => res.data);
      
      setMatches(allMatches);
      
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

  const getStageMatches = (stageId) => {
    return matches.filter(m => m.stage === stageId);
  };

  const BracketMatch = ({ match, size = "normal" }) => {
    const isFinished = match.status === "FINISHED";
    const prediction = predictions[match.id];
    
    return (
      <div 
        className={`stadium-card p-3 ${size === "small" ? "min-w-[180px]" : "min-w-[220px]"}`}
        data-testid={`bracket-match-${match.id}`}
      >
        {/* Status */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] font-bold uppercase ${
            match.status === "IN_PLAY" ? "text-[#EF4444]" :
            match.status === "FINISHED" ? "text-[#64748B]" : "text-[#3B82F6]"
          }`}>
            {match.status === "IN_PLAY" ? "LIVE" : 
             match.status === "FINISHED" ? "FT" : 
             format(parseISO(match.utc_date), "MMM d, HH:mm")}
          </span>
          {prediction && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              prediction.points_earned === 4 ? "bg-[#22C55E]/20 text-[#22C55E]" :
              prediction.points_earned === 3 ? "bg-[#3B82F6]/20 text-[#3B82F6]" :
              prediction.points_earned === 2 ? "bg-[#F59E0B]/20 text-[#F59E0B]" :
              prediction.points_earned === 0 && isFinished ? "bg-[#EF4444]/20 text-[#EF4444]" :
              "bg-[#1E293B] text-[#94A3B8]"
            }`}>
              {isFinished ? `+${prediction.points_earned}` : `${prediction.home_score}-${prediction.away_score}`}
            </span>
          )}
        </div>

        {/* Teams */}
        <div className="space-y-2">
          <div className={`flex items-center justify-between p-2 rounded-lg ${
            isFinished && match.score?.home > match.score?.away ? "bg-[#22C55E]/10" : "bg-[#0B0E14]"
          }`}>
            <div className="flex items-center gap-2">
              {match.home_team.crest && (
                <img src={match.home_team.crest} alt="" className="w-5 h-5 object-contain" />
              )}
              <span className="text-sm font-medium text-white truncate max-w-[100px]">
                {match.home_team.name.includes("TBD") ? match.home_team.name : match.home_team.short_name || match.home_team.name}
              </span>
            </div>
            <span className={`text-lg font-bold font-score ${
              isFinished && match.score?.home > match.score?.away ? "text-[#22C55E]" : "text-white"
            }`}>
              {match.score?.home ?? "-"}
            </span>
          </div>

          <div className={`flex items-center justify-between p-2 rounded-lg ${
            isFinished && match.score?.away > match.score?.home ? "bg-[#22C55E]/10" : "bg-[#0B0E14]"
          }`}>
            <div className="flex items-center gap-2">
              {match.away_team.crest && (
                <img src={match.away_team.crest} alt="" className="w-5 h-5 object-contain" />
              )}
              <span className="text-sm font-medium text-white truncate max-w-[100px]">
                {match.away_team.name.includes("TBD") ? match.away_team.name : match.away_team.short_name || match.away_team.name}
              </span>
            </div>
            <span className={`text-lg font-bold font-score ${
              isFinished && match.score?.away > match.score?.home ? "text-[#22C55E]" : "text-white"
            }`}>
              {match.score?.away ?? "-"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const BracketView = () => (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-8 min-w-[1200px]">
        {/* Round of 16 */}
        <div className="flex flex-col justify-around gap-4 min-h-[800px]">
          <h4 className="text-sm font-bold text-[#94A3B8] uppercase text-center mb-2">Round of 16</h4>
          {getStageMatches("LAST_16").map((match) => (
            <BracketMatch key={match.id} match={match} size="small" />
          ))}
          {getStageMatches("LAST_16").length === 0 && (
            <div className="space-y-4">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="stadium-card p-3 min-w-[180px] h-[100px] flex items-center justify-center text-[#64748B] text-sm">
                  TBD
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quarter Finals */}
        <div className="flex flex-col justify-around gap-8 min-h-[800px]">
          <h4 className="text-sm font-bold text-[#94A3B8] uppercase text-center mb-2">Quarter Finals</h4>
          {getStageMatches("QUARTER_FINALS").map((match) => (
            <BracketMatch key={match.id} match={match} size="small" />
          ))}
          {getStageMatches("QUARTER_FINALS").length === 0 && (
            <div className="space-y-8">
              {[1,2,3,4].map(i => (
                <div key={i} className="stadium-card p-3 min-w-[180px] h-[100px] flex items-center justify-center text-[#64748B] text-sm">
                  TBD
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Semi Finals */}
        <div className="flex flex-col justify-around gap-16 min-h-[800px]">
          <h4 className="text-sm font-bold text-[#94A3B8] uppercase text-center mb-2">Semi Finals</h4>
          {getStageMatches("SEMI_FINALS").map((match) => (
            <BracketMatch key={match.id} match={match} />
          ))}
          {getStageMatches("SEMI_FINALS").length === 0 && (
            <div className="space-y-16">
              {[1,2].map(i => (
                <div key={i} className="stadium-card p-3 min-w-[220px] h-[100px] flex items-center justify-center text-[#64748B] text-sm">
                  TBD
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Final & 3rd Place */}
        <div className="flex flex-col justify-center gap-8 min-h-[800px]">
          <div>
            <h4 className="text-sm font-bold text-[#F59E0B] uppercase text-center mb-2">Final</h4>
            {getStageMatches("FINAL").map((match) => (
              <BracketMatch key={match.id} match={match} />
            ))}
            {getStageMatches("FINAL").length === 0 && (
              <div className="stadium-card p-3 min-w-[220px] h-[100px] flex items-center justify-center border-[#F59E0B]/50">
                <Trophy className="w-6 h-6 text-[#F59E0B] mr-2" />
                <span className="text-[#F59E0B]">Final</span>
              </div>
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#CD7F32] uppercase text-center mb-2">3rd Place</h4>
            {getStageMatches("THIRD_PLACE").map((match) => (
              <BracketMatch key={match.id} match={match} />
            ))}
            {getStageMatches("THIRD_PLACE").length === 0 && (
              <div className="stadium-card p-3 min-w-[220px] h-[100px] flex items-center justify-center text-[#64748B] text-sm">
                TBD
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const ListView = () => (
    <div className="space-y-8">
      {stages.map((stage) => {
        const stageMatches = getStageMatches(stage.id);
        
        return (
          <div key={stage.id}>
            <h3 
              className={`text-xl font-bold mb-4 ${
                stage.id === "FINAL" ? "text-[#F59E0B]" : "text-white"
              }`}
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              {stage.id === "FINAL" && <Trophy className="w-5 h-5 inline mr-2" />}
              {stage.label}
            </h3>
            
            {stageMatches.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stageMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    userPrediction={predictions[match.id]}
                    onPredictionSaved={fetchData}
                  />
                ))}
              </div>
            ) : (
              <div className="stadium-card p-8 text-center">
                <p className="text-[#64748B]">Matches will appear after the group stage</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 
            className="text-3xl md:text-4xl font-bold text-white mb-2"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            data-testid="knockout-title"
          >
            <GitBranch className="w-8 h-8 inline mr-3 text-[#D946EF]" />
            KNOCKOUT BRACKET
          </h1>
          <p className="text-[#94A3B8]">
            From Round of 16 to the Final - make your predictions count
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-[#151922] border border-[#1E293B] rounded-xl p-1">
          <Button
            variant={viewMode === "bracket" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("bracket")}
            className={viewMode === "bracket" ? "bg-[#00FF88] text-black" : ""}
            data-testid="view-bracket"
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Bracket
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "bg-[#00FF88] text-black" : ""}
            data-testid="view-list"
          >
            <List className="w-4 h-4 mr-2" />
            List
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="stadium-card h-32 animate-pulse" />
          ))}
        </div>
      ) : viewMode === "bracket" ? (
        <BracketView />
      ) : (
        <ListView />
      )}
    </div>
  );
};

export default KnockoutBracket;
