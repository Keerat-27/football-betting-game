import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { 
  Users, Plus, ArrowRight, Copy, Check, 
  Trophy, Shield, Globe, Loader2
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "../components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Groups = () => {
  const { user } = useAuth();
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [createName, setCreateName] = useState("");
  const [creationLoading, setCreationLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${API}/groups`);
      setMyGroups(res.data);
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Failed to load your leagues.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setCreationLoading(true);
    try {
      await axios.post(`${API}/groups`, { name: createName });
      toast.success(`League "${createName}" created!`);
      setCreateName("");
      setCreateDialogOpen(false);
      fetchGroups(); // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create league.");
    } finally {
      setCreationLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoinLoading(true);
    try {
      await axios.post(`${API}/groups/join`, { code: joinCode });
      toast.success("Joined league successfully!");
      setJoinCode("");
      setJoinDialogOpen(false);
      fetchGroups(); // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to join league. Check the code.");
    } finally {
      setJoinLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Code copied to clipboard");
  };

  return (
    <div className="container-page min-h-screen">
      <div className="page-header">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading text-white mb-2">My Leagues</h1>
          <p className="text-muted-foreground">Manage your private groups and competitions.</p>
        </div>
        
        <div className="flex gap-3">
          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-white/10 bg-surface-raised hover:bg-surface-raised/80">
                Join League
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-surface-raised border-white/10">
              <DialogHeader>
                <DialogTitle>Join a League</DialogTitle>
                <DialogDescription>Enter the invite code shared by the group admin.</DialogDescription>
              </DialogHeader>
              <Input
                placeholder="Enter Invite Code (e.g. AB123)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="text-center font-mono tracking-widest text-lg uppercase h-14"
              />
              <DialogFooter>
                <Button onClick={handleJoin} disabled={!joinCode || joinLoading} className="w-full">
                  {joinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join League"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Create League
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-surface-raised border-white/10">
              <DialogHeader>
                <DialogTitle>Create New League</DialogTitle>
                <DialogDescription>Start a new competition with friends.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">League Name</label>
                  <Input
                    placeholder="e.g. Sunday Football Club"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={!createName || creationLoading} className="w-full">
                  {creationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create League"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Global Public League Card */}
        <div className="stadium-card p-6 border-l-4 border-l-primary group cursor-pointer hover:bg-surface-raised/80 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Globe className="w-6 h-6" />
            </div>
            <div className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
              Official
            </div>
          </div>
          <h3 className="text-xl font-bold text-white font-heading mb-1">Global Leaderboard</h3>
          <p className="text-sm text-muted-foreground mb-4">The main competition ranking all users.</p>
          <div className="flex items-center gap-4 text-sm font-medium text-white/80">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-muted-foreground" /> --
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-accent" /> Rank --
            </div>
          </div>
        </div>

        {/* Private User Leagues */}
        {loading ? (
           [1, 2].map(i => (
             <div key={i} className="stadium-card p-6 animate-pulse">
               <div className="w-12 h-12 bg-surface-raised rounded-xl mb-4" />
               <div className="h-6 w-32 bg-surface-raised rounded mb-2" />
               <div className="h-4 w-24 bg-surface-raised rounded" />
             </div>
           ))
        ) : (
          myGroups.map(group => (
            <div key={group.id} className="relative group">
              <Link to={`/groups/${group.id}`} className="block">
                <div className="stadium-card p-6 border-l-4 border-l-accent hover:bg-surface-raised/80 transition-colors h-full">
                   <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                      <Shield className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white font-heading mb-1">{group.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {group.owner_id === user?.id ? `Code: ${group.code}` : "Member"}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-4 text-sm font-medium text-white/80">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-muted-foreground" /> {group.member_count}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
              
              {/* Copy Button (absolute positioned to stay clickable separately) */}
              {group.owner_id === user?.id && (
                <div className="absolute top-6 right-6 z-10">
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-white"
                    onClick={(e) => {
                      e.preventDefault();
                      copyToClipboard(group.code);
                    }}
                    title="Copy Invite Code"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}

        {/* Create New Placeholder */}
        {!loading && (
          <div 
            onClick={() => setCreateDialogOpen(true)}
            className="border border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 hover:bg-white/5 transition-colors cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-full bg-surface-raised flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-heading">Create New League</h3>
              <p className="text-sm text-muted-foreground">Start a new competition</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;
