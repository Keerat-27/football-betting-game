import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Home, Calendar, Trophy, Users, User, 
  LogOut, Menu, X, Flag, GitBranch
} from "lucide-react";
import { useState } from "react";
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

  return (
    <div className="min-h-screen bg-[#0B0E14]">
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex fixed top-0 left-0 right-0 z-50 bg-[#0B0E14]/95 backdrop-blur-md border-b border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00FF88] flex items-center justify-center">
                <Trophy className="w-6 h-6 text-black" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                KICKPREDICT
              </span>
            </div>

            {/* Nav Links */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "text-[#00FF88] bg-[#00FF88]/10"
                        : "text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/50"
                    }`
                  }
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#94A3B8]">{user?.username}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-[#94A3B8] hover:text-white"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0B0E14]/95 backdrop-blur-md border-b border-[#1E293B]">
        <div className="px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00FF88] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-black" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
                KICKPREDICT
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-14 left-0 right-0 bg-[#0B0E14] border-b border-[#1E293B] py-4 px-4">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "text-[#00FF88] bg-[#00FF88]/10"
                        : "text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/50"
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
              <div className="border-t border-[#1E293B] mt-2 pt-2">
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#EF4444] hover:bg-[#EF4444]/10 w-full"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B0E14]/95 backdrop-blur-md border-t border-[#1E293B]">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                  isActive ? "text-[#00FF88]" : "text-[#64748B]"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16 lg:pt-20 pb-20 lg:pb-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
