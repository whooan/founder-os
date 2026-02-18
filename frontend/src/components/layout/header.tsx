"use client";

import { usePathname } from "next/navigation";
import { Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const pageTitles: Record<string, string> = {
  "/": "Home",
  "/companies": "Compset",
  "/timeline": "Events",
  "/market": "Market Map",
  "/compare": "Compare",
  "/ask": "Ask",
  "/suggestions": "Insights",
  "/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/companies/")) return "Company Detail";
  return pageTitles[pathname] || "founderOS";
}

interface HeaderProps {
  onOpenCommandMenu?: () => void;
}

export function Header({ onOpenCommandMenu }: HeaderProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      // Hard redirect — clears all cached React state and page data
      window.location.href = "/login";
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold">{title}</h1>
        <Badge variant="secondary" className="text-xs">
          Beta
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-muted-foreground"
          onClick={onOpenCommandMenu}
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="pointer-events-none hidden h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
            <span className="text-xs">&#8984;</span>K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          disabled={loggingOut}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
