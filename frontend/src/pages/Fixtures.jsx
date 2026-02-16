import { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, Filter, RefreshCw, Trophy } from "lucide-react";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import MatchCard from "../components/MatchCard";
import { format, parseISO, isToday, isTomorrow, addDays, isSameDay } from "date-fns";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Fixtures = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); 

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/matches`);
      const sorted = res.data.sort((a, b) => new Date(a.utc_date) - new Date(b.utc_date));
      setMatches(sorted);
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const getFilteredMatches = () => {
    return matches.filter(match => {
      if (filter === "all") return true;
      if (filter === "upcoming") return match.status === "SCHEDULED" || match.status === "TIMED";
      if (filter === "finished") return match.status === "FINISHED";
      if (filter === "live") return match.status === "IN_PLAY" || match.status === "PAUSED";
      return true;
    });
  };

  const groupedMatches = getFilteredMatches().reduce((groups, match) => {
    const dateKey = format(parseISO(match.utc_date), "yyyy-MM-dd");
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(match);
    return groups;
  }, {});

  const dates = Object.keys(groupedMatches);

  return (
    <div className="container-page min-h-screen">
      <div className="page-header">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading text-white mb-2">Fixtures</h1>
          <p className="text-muted-foreground">Match schedule and predictions.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchMatches}
            className="h-9 border-white/10 bg-surface-raised hover:bg-surface-raised/80"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Sync
          </Button>
          <div className="h-9 px-3 rounded-lg bg-surface-raised border border-white/10 flex items-center justify-center text-sm font-bold text-muted-foreground font-mono">
            {getFilteredMatches().length} Matches
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-8" onValueChange={setFilter}>
        <TabsList className="w-full max-w-lg h-12 bg-surface-raised border border-white/5 p-1.5 rounded-xl mx-auto md:mx-0">
          <TabsTrigger value="all" className="flex-1 rounded-lg">All</TabsTrigger>
          <TabsTrigger value="upcoming" className="flex-1 rounded-lg">Upcoming</TabsTrigger>
          <TabsTrigger value="live" className="flex-1 rounded-lg">Live</TabsTrigger>
          <TabsTrigger value="finished" className="flex-1 rounded-lg">Results</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-8 mt-6">
          {dates.length > 0 ? (
            dates.map(date => {
              const dateObj = parseISO(date);
              let dateLabel = format(dateObj, "EEEE, MMMM do");
              if (isToday(dateObj)) dateLabel = "Today";
              if (isTomorrow(dateObj)) dateLabel = "Tomorrow";

              return (
                <section key={date} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="sticky top-20 lg:top-24 z-30 bg-background/90 backdrop-blur-md py-3 border-b border-white/5 flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold text-white font-heading tracking-wide uppercase">{dateLabel}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {groupedMatches[date].map(match => (
                      <MatchCard 
                        key={match.id} 
                        match={match} 
                        showPredictionInput={match.status !== "FINISHED" && match.status !== "IN_PLAY"}
                      />
                    ))}
                  </div>
                </section>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed border-white/10 rounded-2xl bg-surface-raised/20">
              <div className="w-16 h-16 rounded-full bg-surface-raised flex items-center justify-center">
                <Filter className="w-8 h-8 text-muted-foreground opacity-50" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">No matches found</h3>
                <p className="text-muted-foreground">There are no matches for this filter.</p>
              </div>
              <Button variant="secondary" onClick={() => setFilter("all")}>Clear Filters</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Fixtures;
