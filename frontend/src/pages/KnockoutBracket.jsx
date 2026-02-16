import { useState, useEffect } from "react";
import axios from "axios";
import MatchCard from "../components/MatchCard";
import { GitBranch, List, Grid } from "lucide-react";
import { Button } from "../components/ui/button";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const KnockoutBracket = () => {
  const [matches, setMatches] = useState([]);
  const [viewMode, setViewMode] = useState("bracket"); // 'bracket' or 'list'

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await axios.get(`${API}/matches`);
        const knockoutMatches = res.data.filter(
          (m) =>
            ["ROUND_OF_16", "QUARTER_FINALS", "SEMI_FINALS", "FINAL"].includes(
              m.stage
            )
        );
        setMatches(knockoutMatches);
      } catch (error) {
        console.error("Error fetching matches", error);
      }
    };
    fetchMatches();
  }, []);

  const getStageMatches = (stage) => matches.filter((m) => m.stage === stage);

  const BracketColumn = ({ title, stageMatches }) => (
    <div className="flex flex-col gap-8 min-w-[320px]">
      <div className="bg-surface-raised/80 backdrop-blur-md rounded-xl p-3 border border-white/5 text-center sticky top-20 z-10 shadow-lg">
        <h3 className="font-heading font-bold text-white uppercase tracking-wider">{title}</h3>
      </div>
      <div className="flex flex-col justify-around h-full gap-8 py-4">
        {stageMatches.map((match, idx) => (
          <div key={match.id} className="relative group">
            {/* Connector Lines (Pure CSS) */}
            <div className="absolute top-1/2 -right-8 w-8 h-px bg-white/10 group-even:hidden hidden lg:block" /> 
            <MatchCard match={match} onPredictionSaved={() => {}} />
          </div>
        ))}
        {stageMatches.length === 0 && (
          <div className="h-32 rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-muted-foreground text-sm uppercase tracking-wide">
            TBD
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="container-page min-h-screen">
      <div className="page-header">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading text-white mb-2">Knockout Stage</h1>
          <p className="text-muted-foreground">The road to the trophy.</p>
        </div>
        
        <div className="flex bg-surface-raised p-1 rounded-lg border border-white/5">
          <Button
            variant={viewMode === "bracket" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("bracket")}
            className="gap-2 h-8"
          >
            <GitBranch className="w-4 h-4" /> Bracket
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="gap-2 h-8"
          >
            <List className="w-4 h-4" /> List
          </Button>
        </div>
      </div>

      {viewMode === "bracket" ? (
        <div className="overflow-x-auto pb-12 -mx-4 px-4 scrollbar-hide">
          <div className="infline-flex gap-12 min-w-max px-4">
            <div className="flex gap-16">
              <BracketColumn title="Round of 16" stageMatches={getStageMatches("ROUND_OF_16")} />
              <div className="pt-16"><BracketColumn title="Quarter Finals" stageMatches={getStageMatches("QUARTER_FINALS")} /></div>
              <div className="pt-32"><BracketColumn title="Semi Finals" stageMatches={getStageMatches("SEMI_FINALS")} /></div>
              <div className="pt-64"><BracketColumn title="Final" stageMatches={getStageMatches("FINAL")} /></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {["ROUND_OF_16", "QUARTER_FINALS", "SEMI_FINALS", "FINAL"].map(stage => {
            const stageMatches = getStageMatches(stage);
            if (stageMatches.length === 0) return null;
            return (
              <div key={stage} className="space-y-4">
                <h3 className="text-lg font-heading font-bold text-white uppercase tracking-wider pl-1 border-l-4 border-primary">{stage.replace(/_/g, " ")}</h3>
                <div className="space-y-4">
                  {stageMatches.map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KnockoutBracket;
