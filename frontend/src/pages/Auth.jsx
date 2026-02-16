import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Trophy, Mail, Lock, User, ArrowRight, Loader2, Sparkles } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: ""
  });

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.username, formData.email, formData.password);
      }
      toast.success(isLogin ? "Welcome back!" : "Account created successfully!");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.detail || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 opacity-40 animate-pulse delay-700" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/15 blur-[120px] rounded-full -translate-x-1/3 translate-y-1/3 opacity-40 animate-pulse" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
      </div>

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 relative z-10 items-center">
        
        {/* Left Side - Hero/Info */}
        <div className="hidden lg:flex flex-col gap-8 pr-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(0,255,128,0.3)]">
              <Trophy className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold tracking-tight text-white font-heading leading-none">
                KICKPREDICT
              </span>
              <span className="text-xs text-muted-foreground font-medium tracking-[0.2em] uppercase">
                World Cup 2026
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-bold font-heading text-white leading-tight">
              PREDICT. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">COMPETE.</span> <br />
              WIN.
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Join the ultimate football prediction platform. Challenge friends, climb the global leaderboard, and prove your football knowledge.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-surface-raised/50 border border-white/5 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold text-white font-heading mb-1">4 PTS</div>
              <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-accent" /> Exact Score
              </div>
            </div>
            <div className="bg-surface-raised/50 border border-white/5 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold text-white font-heading mb-1">2 PTS</div>
              <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-2">
                <ArrowRight className="w-3 h-3 text-primary" /> Tendency
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full max-w-md mx-auto">
          <div className="stadium-card bg-card/80 backdrop-blur-xl border-white/10 p-8 shadow-2xl animate-scale-in">
            <div className="text-center mb-8 lg:hidden">
              <div className="inline-flex items-center gap-2 justify-center mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
              <h2 className="text-2xl font-bold font-heading text-white">Welcome Back</h2>
              <p className="text-muted-foreground text-sm">Enter your details to stick to the pitch.</p>
            </div>

            <div className="flex bg-surface-sunken p-1 rounded-xl mb-8 border border-white/5 relative">
              <div 
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-surface-raised border border-white/10 shadow-sm rounded-lg transition-all duration-300 ${isLogin ? "left-1" : "left-[calc(50%+4px)]"}`} 
              />
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-wide rounded-lg transition-colors relative z-10 ${
                  isLogin ? "text-white" : "text-muted-foreground hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-wide rounded-lg transition-colors relative z-10 ${
                  !isLogin ? "text-white" : "text-muted-foreground hover:text-white"
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Username"
                      className="pl-10 h-12 bg-surface-sunken/50 border-white/10 focus:border-primary/50"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    className="pl-10 h-12 bg-surface-sunken/50 border-white/10 focus:border-primary/50"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Password"
                    className="pl-10 h-12 bg-surface-sunken/50 border-white/10 focus:border-primary/50"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-sm mt-4 shadow-[0_0_20px_rgba(0,255,128,0.15)] hover:shadow-[0_0_30px_rgba(0,255,128,0.3)]" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Sign In" : "Create Account"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground">
                By continuing, you agree to our Terms of Service & Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
