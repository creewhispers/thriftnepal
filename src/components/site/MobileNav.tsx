import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Plus, Heart, MessageCircle } from "lucide-react";

export function MobileNav() {
  const { location } = useRouterState();
  const path = location.pathname;
  const items = [
    { icon: Home, label: "Home", to: "/" as const, match: (p: string) => p === "/" },
    { icon: Search, label: "Search", to: "/search" as const, match: (p: string) => p.startsWith("/search") },
    { icon: Plus, label: "Sell", to: "/sell" as const, primary: true, match: (p: string) => p === "/sell" },
    { icon: Heart, label: "Saved", to: "/saved" as const, match: (p: string) => p.startsWith("/saved") },
    { icon: MessageCircle, label: "Inbox", to: "/messages" as const, match: (p: string) => p.startsWith("/messages") || p.startsWith("/m/") },
  ];
  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50 glass rounded-full border border-border/60 px-2 py-1.5 flex items-center justify-between shadow-lg">
      {items.map(({ icon: Icon, label, to, primary, match }) => {
        const active = match(path);
        return (
          <Link
            key={label}
            to={to}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-full text-[10px] transition ${
              primary ? "bg-foreground text-background mx-1" : active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
