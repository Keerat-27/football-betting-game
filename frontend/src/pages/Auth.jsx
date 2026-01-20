import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Trophy, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
  });
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success("Welcome back!");
      } else {
        await register(formData.email, formData.password, formData.username);
        toast.success("Account created successfully!");
      }
      navigate("/");
    } catch (error) {
      const message = error.response?.data?.detail || "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(11, 14, 20, 0.9), rgba(11, 14, 20, 0.95)), url('https://images.pexels.com/photos/31160144/pexels-photo-31160144.jpeg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#00FF88] flex items-center justify-center mb-4 glow-green">
            <Trophy className="w-10 h-10 text-black" />
          </div>
          <h1 
            className="text-4xl font-bold text-white tracking-tight"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            KICKPREDICT
          </h1>
          <p className="text-[#94A3B8] mt-2">World Cup Prediction Game</p>
        </div>

        {/* Auth Card */}
        <div className="stadium-card p-8">
          <h2 
            className="text-2xl font-bold text-white mb-6 text-center"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            {isLogin ? "SIGN IN" : "CREATE ACCOUNT"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[#94A3B8]">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="pl-11 bg-[#0B0E14] border-[#334155] text-white placeholder:text-[#64748B] focus:border-[#00FF88] focus:ring-[#00FF88]"
                    required={!isLogin}
                    data-testid="username-input"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#94A3B8]">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-11 bg-[#0B0E14] border-[#334155] text-white placeholder:text-[#64748B] focus:border-[#00FF88] focus:ring-[#00FF88]"
                  required
                  data-testid="email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#94A3B8]">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-11 bg-[#0B0E14] border-[#334155] text-white placeholder:text-[#64748B] focus:border-[#00FF88] focus:ring-[#00FF88]"
                  required
                  minLength={6}
                  data-testid="password-input"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full btn-primary h-12 text-base rounded-xl"
              disabled={loading}
              data-testid="auth-submit-btn"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#94A3B8] hover:text-white transition-colors text-sm"
              data-testid="auth-toggle-btn"
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span className="text-[#00FF88] font-medium">
                {isLogin ? "Sign Up" : "Sign In"}
              </span>
            </button>
          </div>
        </div>

        {/* Points Info */}
        <div className="mt-8 stadium-card-glass p-6">
          <h3 
            className="text-lg font-bold text-white mb-4 text-center"
            style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
          >
            SCORING SYSTEM
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[#22C55E] font-score">4</div>
              <div className="text-xs text-[#94A3B8] mt-1">Exact Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#3B82F6] font-score">3</div>
              <div className="text-xs text-[#94A3B8] mt-1">Goal Diff</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#F59E0B] font-score">2</div>
              <div className="text-xs text-[#94A3B8] mt-1">Tendency</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
