import { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, Filter, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import MatchCard from "../components/MatchCard";
import { format, parseISO, isToday, isTomorrow, addDays, isSameDay } from "date-fns";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Fixtures = () => {
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matchesRes, predictionsRes] = await Promise.all([
        axios.get(`${API}/matches`),
        axios.get(`${API}/predictions`),
      ]);
      
      setMatches(matchesRes.data);
      
      // Convert predictions to lookup map
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

  const syncMatches = async () => {
    setSyncing(true);
    try {
      await axios.post(`${API}/matches/sync`);
      await fetchData();
    } catch (error) {
      console.error("Failed to sync:", error);
    } finally {
      setSyncing(false);
    }
  };

  const filterMatches = (status) => {
    if (status === "all") return matches;
    if (status === "today") return matches.filter(m => isToday(parseISO(m.utc_date)));
    if (status === "upcoming") return matches.filter(m => m.status === "SCHEDULED");
    if (status === "live") return matches.filter(m => m.status === "IN_PLAY" || m.status === "PAUSED");
    if (status === "finished") return matches.filter(m => m.status === "FINISHED");
    return matches;
  };

  const groupMatchesByDate = (matchList) => {
    const groups = {};
    matchList.forEach((match) => {
      const date = format(parseISO(match.utc_date), "yyyy-MM-dd");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(match);
    });
    return groups;
  };

  const formatDateHeader = (dateStr) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE, MMMM d, yyyy");
  };

  const filteredMatches = filterMatches(activeTab);
  const groupedMatches = groupMatchesByDate(filteredMatches);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 
            className="text-3xl md:text-4xl font-bold text-white"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            data-testid="fixtures-title"
          >
            <Calendar className="w-8 h-8 inline mr-3 text-[#00FF88]" />
            FIXTURES & PREDICTIONS
          </h1>
          <p className="text-[#94A3B8] mt-2">
            Make your predictions before each match kicks off
          </p>
        </div>
        
        <Button
          onClick={syncMatches}
          disabled={syncing}
          className="btn-secondary gap-2"
          data-testid="sync-matches-btn"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync Matches"}
        </Button>
      </div>

      {/* Filters */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="bg-[#151922] border border-[#1E293B] p-1 rounded-xl">
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-[#00FF88] data-[state=active]:text-black rounded-lg"
            data-testid="filter-all"
          >
            All
          </TabsTrigger>
          <TabsTrigger 
            value="today"
            className="data-[state=active]:bg-[#00FF88] data-[state=active]:text-black rounded-lg"
            data-testid="filter-today"
          >
            Today
          </TabsTrigger>
          <TabsTrigger 
            value="upcoming"
            className="data-[state=active]:bg-[#00FF88] data-[state=active]:text-black rounded-lg"
            data-testid="filter-upcoming"
          >
            Upcoming
          </TabsTrigger>
          <TabsTrigger 
            value="live"
            className="data-[state=active]:bg-[#EF4444] data-[state=active]:text-white rounded-lg"
            data-testid="filter-live"
          >
            Live
          </TabsTrigger>
          <TabsTrigger 
            value="finished"
            className="data-[state=active]:bg-[#00FF88] data-[state=active]:text-black rounded-lg"
            data-testid="filter-finished"
          >
            Finished
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Matches List */}
      {loading ? (
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-6 w-48 bg-[#1E293B] rounded mb-4 animate-pulse" />
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2].map((j) => (
                  <div key={j} className="stadium-card h-48 animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : Object.keys(groupedMatches).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedMatches)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, matchList]) => (
              <div key={date}>
                <div className="sticky top-[70px] lg:top-[80px] z-10 bg-[#0B0E14]/95 backdrop-blur py-3 border-b border-[#1E293B] mb-4">
                  <h3 
                    className="text-lg font-bold text-white"
                    style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                  >
                    {formatDateHeader(date)}
                  </h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {matchList.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      userPrediction={predictions[match.id]}
                      onPredictionSaved={fetchData}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="stadium-card p-12 text-center">
          <Calendar className="w-16 h-16 text-[#64748B] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
            NO MATCHES FOUND
          </h3>
          <p className="text-[#94A3B8]">
            {activeTab === "all" 
              ? "Click 'Sync Matches' to load World Cup fixtures"
              : `No ${activeTab} matches at the moment`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default Fixtures;
