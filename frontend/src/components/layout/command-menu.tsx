"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Clock,
  Network,
  MessageSquare,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import type { Company } from "@/types";
import { fetchCompanies } from "@/lib/api/companies";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);

  const loadCompanies = useCallback(async () => {
    try {
      const data = await fetchCompanies();
      setCompanies(data);
    } catch {
      // Silently fail - companies will just not appear in command palette
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadCompanies();
    }
  }, [open, loadCompanies]);

  const navigate = (path: string) => {
    onOpenChange(false);
    router.push(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search companies, navigate..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {companies.length > 0 && (
          <CommandGroup heading="Companies">
            {companies.map((company) => (
              <CommandItem
                key={company.id}
                onSelect={() => navigate(`/companies/${company.id}`)}
              >
                <Building2 className="mr-2 h-4 w-4" />
                <span>{company.name}</span>
                {company.stage && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {company.stage}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => navigate("/")}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/companies")}>
            <Building2 className="mr-2 h-4 w-4" />
            <span>Companies</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/timeline")}>
            <Clock className="mr-2 h-4 w-4" />
            <span>Timeline</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/market")}>
            <Network className="mr-2 h-4 w-4" />
            <span>Market Map</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/ask")}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Ask Intelligence</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
