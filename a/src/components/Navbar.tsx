import { Link, useLocation } from "react-router-dom";
import { Trophy, Swords, Shield, Home, LogIn } from "lucide-react";

const navItems = [
  { to: "/", label: "Início", icon: Home },
  { to: "/ranking", label: "Ranking", icon: Trophy },
  { to: "/matches", label: "Partidas", icon: Swords },
  { to: "/guilds", label: "Guildas", icon: Shield },
  { to: "/login", label: "Entrar", icon: LogIn },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-heading text-xl font-bold text-gold">RO</span>
          <span className="font-heading text-sm font-semibold text-foreground tracking-widest">STARS 7×7</span>
        </Link>
        <div className="flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-secondary text-gold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
