import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "./components/ui/sonner";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Fixtures from "./pages/Fixtures";
import GroupStage from "./pages/GroupStage";
import KnockoutBracket from "./pages/KnockoutBracket";
import Leaderboards from "./pages/Leaderboards";
import Profile from "./pages/Profile";
import Groups from "./pages/Groups";
import LeagueDetails from "./pages/LeagueDetails";
import Auth from "./pages/Auth";
import "./App.css";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <div className="animate-pulse text-[#00FF88] text-xl font-bold">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Home />} />
            <Route path="fixtures" element={<Fixtures />} />
            <Route path="groups-stage" element={<GroupStage />} />
            <Route path="knockout" element={<KnockoutBracket />} />
            <Route path="leaderboards" element={<Leaderboards />} />
            <Route path="profile" element={<Profile />} />
            <Route path="my-groups" element={<Groups />} />
            <Route path="groups/:id" element={<LeagueDetails />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
