import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Home, Calendar, Trophy, Users, User, 
  LogOut, Menu, X, Flag, GitBranch, ChevronRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/fixtures", label: "Fixtures", icon: Calendar },
  { path: "/groups-stage", label: "Groups", icon: Flag },
  { path: "/knockout", label: "Bracket", icon: GitBranch },
  { path: "/leaderboards", label: "Rankings", icon: Trophy },
  { path: "/my-groups", label: "My Leagues", icon: Users },
  { path: "/profile", label: "Profile", icon: User },
];

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
      {/* Desktop Navigation */}
      <nav 
        className={`hidden lg:flex fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
          scrolled 
            ? "bg-background/80 backdrop-blur-md border-b border-white/5 py-3" 
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300 shadow-[0_0_15px_rgba(0,255,128,0.3)]">
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-white font-heading leading-none">
                  KICKPREDICT
                </span>
                <span className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">
                  World Cup 2026
                </span>
              </div>
            </div>

            {/* Nav Links */}
            <div className="flex items-center bg-surface-raised/50 backdrop-blur-sm rounded-full p-1 border border-white/5">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? "text-primary-foreground bg-white"
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={`w-4 h-4 ${isActive ? "text-primary-foreground" : "text-current"}`} />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden xl:block">
                <div className="text-sm font-bold text-white">{user?.username}</div>
                <div className="text-xs text-muted-foreground">Level 5 Predictor</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-surface-raised border border-white/10 flex items-center justify-center text-sm font-bold text-muted-foreground">
                {user?.username?.substring(0, 2).toUpperCase()}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full w-10 h-10"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Top Navigation */}
      <nav 
        className={`lg:hidden fixed top-0 left-0 right-0 z-[100] transition-all duration-300 border-b border-white/5 ${
          scrolled || mobileMenuOpen ? "bg-background/95 backdrop-blur-md" : "bg-background/50 backdrop-blur-sm"
        }`}
      >
        <div className="px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_10px_rgba(0,255,128,0.2)]">
                <Trophy className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white font-heading">
                KICKPREDICT
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center text-xs font-bold text-muted-foreground border border-white/5">
                {user?.username?.substring(0, 2).toUpperCase()}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:bg-white/10"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-background border-b border-white/5 py-4 px-4 animate-in slide-in-from-top-2 duration-200 shadow-2xl">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "text-primary bg-primary/10 border border-primary/20"
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </NavLink>
              ))}
              <div className="border-t border-white/5 mt-2 pt-2">
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navigation (Horizontal Scroll) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-background/80 backdrop-blur-xl border-t border-white/5 pb-safe">
        <div className="grid grid-cols-5 gap-1 px-2 py-1 md:grid-cols-7 md:gap-4 md:px-6">
          {navItems.map((item) => {
            const isHiddenOnMobile = ["/groups-stage", "/knockout"].includes(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all duration-300 w-full ${
                    isHiddenOnMobile ? "hidden md:flex" : "flex"
                  } ${
                    isActive ? "text-primary scale-105" : "text-muted-foreground/60 scale-100"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`relative p-1.5 rounded-xl transition-all ${isActive ? "bg-primary/10" : ""}`}>
                      <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-current"}`} />
                      {isActive && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-[0_0_5px_rgba(0,255,128,0.5)]" />
                      )}
                    </div>
                    <span className={`text-[10px] font-medium truncate max-w-full px-1 ${isActive ? "text-white" : "text-current"}`}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 pb-24 lg:pt-24 lg:pb-12 min-h-screen relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10 opacity-50" />
        <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none -z-10 opacity-30" />
        
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
