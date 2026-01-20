import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription, DialogFooter 
} from "../components/ui/dialog";
import { 
  Users, Plus, Copy, Check, UserPlus, 
  Crown, LogOut, Loader2
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Groups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  // Form states
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${API}/groups`);
      setGroups(res.data);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!createName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/groups`, {
        name: createName,
        description: createDescription,
      });
      toast.success("Group created successfully!");
      setGroups([...groups, res.data]);
      setShowCreateModal(false);
      setCreateName("");
      setCreateDescription("");
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to create group";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const joinGroup = async () => {
    if (!joinCode.trim()) {
      toast.error("Please enter a group code");
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/groups/join`, { code: joinCode });
      toast.success(`Joined ${res.data.name}!`);
      await fetchGroups();
      setShowJoinModal(false);
      setJoinCode("");
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to join group";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const fetchGroupDetails = async (groupId) => {
    try {
      const res = await axios.get(`${API}/groups/${groupId}`);
      setSelectedGroup(res.data);
    } catch (error) {
      toast.error("Failed to load group details");
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 
            className="text-3xl md:text-4xl font-bold text-white mb-2"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            data-testid="groups-title"
          >
            <Users className="w-8 h-8 inline mr-3 text-[#3B82F6]" />
            MY LEAGUES
          </h1>
          <p className="text-[#94A3B8]">
            Create private leagues to compete with friends
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => setShowJoinModal(true)}
            className="btn-secondary gap-2"
            data-testid="join-group-btn"
          >
            <UserPlus className="w-4 h-4" />
            Join League
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary gap-2"
            data-testid="create-group-btn"
          >
            <Plus className="w-4 h-4" />
            Create League
          </Button>
        </div>
      </div>

      {/* Groups List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="stadium-card h-24 animate-pulse" />
          ))}
        </div>
      ) : groups.length > 0 ? (
        <div className="space-y-4">
          {groups.map((group) => (
            <div 
              key={group.id}
              className="stadium-card p-5 cursor-pointer hover:border-[#3B82F6] transition-colors"
              onClick={() => fetchGroupDetails(group.id)}
              data-testid={`group-card-${group.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-[#3B82F6]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {group.name}
                      {group.owner_id === user?.id && (
                        <Crown className="w-4 h-4 text-[#F59E0B]" />
                      )}
                    </h3>
                    <p className="text-sm text-[#94A3B8]">
                      {group.member_count} member{group.member_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyCode(group.code);
                    }}
                    className="text-[#94A3B8] hover:text-white"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="ml-2 font-mono text-xs">{group.code}</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="stadium-card p-12 text-center">
          <Users className="w-16 h-16 text-[#64748B] mx-auto mb-4" />
          <h3 
            className="text-xl font-bold text-white mb-2"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            NO LEAGUES YET
          </h3>
          <p className="text-[#94A3B8] mb-6">
            Create a league to compete with friends or join an existing one
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => setShowJoinModal(true)}
              className="btn-secondary gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Join League
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary gap-2"
            >
              <Plus className="w-4 h-4" />
              Create League
            </Button>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-[#151922] border-[#1E293B] text-white">
          <DialogHeader>
            <DialogTitle 
              className="text-xl font-bold"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              CREATE NEW LEAGUE
            </DialogTitle>
            <DialogDescription className="text-[#94A3B8]">
              Create a private league and invite your friends
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#94A3B8]">League Name</Label>
              <Input
                id="name"
                placeholder="e.g., Office Champions"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="bg-[#0B0E14] border-[#334155] text-white"
                data-testid="create-group-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-[#94A3B8]">Description (optional)</Label>
              <Input
                id="description"
                placeholder="e.g., Predictions for the 2026 World Cup"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                className="bg-[#0B0E14] border-[#334155] text-white"
                data-testid="create-group-description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={createGroup}
              disabled={submitting || !createName.trim()}
              className="btn-primary"
              data-testid="create-group-submit"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create League"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join Group Modal */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className="bg-[#151922] border-[#1E293B] text-white">
          <DialogHeader>
            <DialogTitle 
              className="text-xl font-bold"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              JOIN A LEAGUE
            </DialogTitle>
            <DialogDescription className="text-[#94A3B8]">
              Enter the invite code to join a private league
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-[#94A3B8]">Invite Code</Label>
              <Input
                id="code"
                placeholder="e.g., ABC12345"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="bg-[#0B0E14] border-[#334155] text-white font-mono tracking-wider text-center text-lg"
                maxLength={8}
                data-testid="join-group-code"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowJoinModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={joinGroup}
              disabled={submitting || !joinCode.trim()}
              className="btn-primary"
              data-testid="join-group-submit"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join League"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Details Modal */}
      <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
        <DialogContent className="bg-[#151922] border-[#1E293B] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle 
              className="text-xl font-bold flex items-center gap-2"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              {selectedGroup?.name}
              {selectedGroup?.owner_id === user?.id && (
                <Crown className="w-5 h-5 text-[#F59E0B]" />
              )}
            </DialogTitle>
            <DialogDescription className="text-[#94A3B8]">
              {selectedGroup?.description || "No description"}
            </DialogDescription>
          </DialogHeader>

          {selectedGroup && (
            <div className="space-y-6 py-4">
              {/* Invite Code */}
              <div className="bg-[#0B0E14] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#94A3B8] mb-1">Invite Code</div>
                  <div className="text-2xl font-mono font-bold text-[#00FF88]">
                    {selectedGroup.code}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => copyCode(selectedGroup.code)}
                  className="text-[#94A3B8] hover:text-white"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>

              {/* Members */}
              <div>
                <h4 className="text-sm font-bold text-[#94A3B8] uppercase mb-3">
                  Members ({selectedGroup.members_details?.length || 0})
                </h4>
                <div className="space-y-2">
                  {selectedGroup.members_details?.map((member) => (
                    <div 
                      key={member.id}
                      className="flex items-center gap-3 p-3 bg-[#0B0E14] rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#1E293B] flex items-center justify-center">
                        <span className="text-sm font-bold text-[#64748B]">
                          {member.username?.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-white flex-1">
                        {member.username}
                        {member.id === user?.id && (
                          <span className="ml-2 text-xs text-[#00FF88]">(You)</span>
                        )}
                      </span>
                      {member.id === selectedGroup.owner_id && (
                        <Crown className="w-4 h-4 text-[#F59E0B]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Groups;
