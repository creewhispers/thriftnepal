import { Link } from "@tanstack/react-router";
import { Search, Heart, MessageCircle, User, Plus, Moon, Sun, Package, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [dark, setDark] = useState(false);
  const { user } = useAuth();
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-foreground text-background text-xs font-bold">T</div>
          <span className="font-display text-xl tracking-tight">
            thriftdepo<span className="text-accent">.</span>np
          </span>
        </Link>

        <div className="hidden md:flex flex-1 max-w-xl">
          <div className="group flex w-full items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 focus-within:border-accent transition">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search for vintage tees, sneakers, brands…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden md:inline text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">⌘K</kbd>
          </div>
        </div>

        <nav className="ml-auto flex items-center gap-1">
          <Link to="/" className="hidden md:block px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition">Browse</Link>
          <button
            onClick={() => setDark((d) => !d)}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary transition"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button className="hidden md:grid h-9 w-9 place-items-center rounded-full hover:bg-secondary transition"><Heart className="h-4 w-4" /></button>
          <button className="hidden md:grid h-9 w-9 place-items-center rounded-full hover:bg-secondary transition"><MessageCircle className="h-4 w-4" /></button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background text-xs font-bold hover:opacity-90 transition">
                {(user.email ?? "U").slice(0, 1).toUpperCase()}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user.email}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/orders" className="flex items-center gap-2"><Package className="h-4 w-4" /> My orders</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 text-destructive">
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login" className="hidden md:grid h-9 w-9 place-items-center rounded-full hover:bg-secondary transition"><User className="h-4 w-4" /></Link>
          )}

          <button className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-foreground text-background pl-3 pr-4 py-2 text-sm font-medium hover:opacity-90 transition">
            <Plus className="h-4 w-4" /> Sell
          </button>
        </nav>
      </div>
    </header>
  );
}
