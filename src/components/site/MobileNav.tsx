import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Plus, Heart, MessageCircle } from "lucide-react";
import { useUnreadMessages } from "@/lib/useUnread";

export function MobileNav() {
  const { location } = useRouterState();
  const path = location.pathname;
  const unread = useUnreadMessages();
  const items = [
    { icon: Home, label: "Home", to: "/" as const, match: (p: string) => p === "/", badge: 0 },
    { icon: Search, label: "Search", to: "/search" as const, match: (p: string) => p.startsWith("/search"), badge: 0 },
    { icon: Plus, label: "Sell", to: "/sell" as const, primary: true, match: (p: string) => p === "/sell", badge: 0 },
    { icon: Heart, label: "Saved", to: "/saved" as const, match: (p: string) => p.startsWith("/saved"), badge: 0 },
    { icon: MessageCircle, label: "Inbox", to: "/messages" as const, match: (p: string) => p.startsWith("/messages") || p.startsWith("/m/"), badge: unread },
  ];
  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50 glass rounded-full border border-border/60 px-2 py-1.5 flex items-center justify-between shadow-lg">
      {items.map(({ icon: Icon, label, to, primary, match, badge }) => {
        const active = match(path);
        return (
          <Link
            key={label}
            to={to}
            className={`relative flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-full text-[10px] transition ${
              primary ? "bg-foreground text-background mx-1" : active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
            {badge > 0 && (
              <span className="absolute top-0 right-1/4 h-4 min-w-4 px-1 rounded-full bg-accent text-accent-foreground text-[9px] font-semibold grid place-items-center">{badge > 9 ? "9+" : badge}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
