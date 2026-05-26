import { Link } from "@tanstack/react-router";
import { Home, Search, Plus, Heart, User } from "lucide-react";

export function MobileNav() {
  const items = [
    { icon: Home, label: "Home", to: "/" as const },
    { icon: Search, label: "Search", to: "/" as const },
    { icon: Plus, label: "Sell", to: "/sell" as const, primary: true },
    { icon: Heart, label: "Saved", to: "/login" as const },
    { icon: User, label: "Me", to: "/login" as const },
  ];
  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50 glass rounded-full border border-border/60 px-2 py-1.5 flex items-center justify-between shadow-lg">
      {items.map(({ icon: Icon, label, to, primary }) => (
        <Link
          key={label}
          to={to}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-full text-[10px] transition ${
            primary ? "bg-foreground text-background mx-1" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
