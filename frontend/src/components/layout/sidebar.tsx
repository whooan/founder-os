"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Space_Grotesk } from "next/font/google";
import {
  LayoutDashboard,
  PieChart,
  Award,
  Users,
  Scale,
  Landmark,
  Building2,
  Network,
  Clock,
  GitCompareArrows,
  MessageSquare,
  Lightbulb,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["700"],
});

const homeItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
];

const capitalItems = [
  { href: "/capital", label: "Cap Table", icon: PieChart },
  { href: "/capital/vsop", label: "VSOP", icon: Award },
  { href: "/capital/stakeholders", label: "Stakeholders", icon: Users },
  { href: "/capital/legal", label: "Legal", icon: Scale },
];

const financeItems = [
  { href: "/finance", label: "Overview", icon: Landmark },
];

const marketItems = [
  { href: "/companies", label: "Compset", icon: Building2 },
  { href: "/market", label: "Market Map", icon: Network },
  { href: "/timeline", label: "Events", icon: Clock },
  { href: "/compare", label: "Compare", icon: GitCompareArrows },
];

const aiItems = [
  { href: "/ask", label: "Ask", icon: MessageSquare },
  { href: "/suggestions", label: "Insights", icon: Lightbulb },
];

// Routes where only exact match should highlight (not startsWith)
const exactMatchRoutes = new Set(["/", "/capital", "/finance"]);

export function Sidebar() {
  const pathname = usePathname();

  const renderLink = (item: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) => {
    const isActive = exactMatchRoutes.has(item.href)
      ? pathname === item.href
      : pathname.startsWith(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <item.icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  };

  const settingsActive = pathname === "/settings";

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 border-b border-border px-6">
        <span
          className={cn(
            spaceGrotesk.className,
            "text-lg font-bold bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-400 bg-clip-text text-transparent"
          )}
        >
          founderOS
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {homeItems.map(renderLink)}
        </div>

        <div className="mt-6">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            Capital
          </p>
          <div className="space-y-1">
            {capitalItems.map(renderLink)}
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            Finance
          </p>
          <div className="space-y-1">
            {financeItems.map(renderLink)}
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            Market
          </p>
          <div className="space-y-1">
            {marketItems.map(renderLink)}
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            AI
          </p>
          <div className="space-y-1">
            {aiItems.map(renderLink)}
          </div>
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            settingsActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <p className="mt-2 px-3 text-xs text-muted-foreground/60">
          founderOS v1.0
        </p>
      </div>
    </aside>
  );
}
