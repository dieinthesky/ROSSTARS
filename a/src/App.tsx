import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SkillsMetaProvider } from "@/context/SkillsMetaContext";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import GuildsPage from "./pages/GuildsPage";
import MatchesPage from "./pages/MatchesPage";
import MatchPage from "./pages/MatchPage";
import PlayerPage from "./pages/PlayerPage";
import RankingPage from "./pages/RankingPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SkillsMetaProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/guilds" element={<GuildsPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/match/:id" element={<MatchPage />} />
          <Route path="/player/:id" element={<PlayerPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </SkillsMetaProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
