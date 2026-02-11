"use client";

import { useState, useEffect } from "react";
import { Plus, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { fetchCompanies } from "@/lib/api/companies";
import type { Company } from "@/types";

interface CompanySelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function CompanySelector({
  selectedIds,
  onSelectionChange,
}: CompanySelectorProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchCompanies().then(setCompanies).catch(() => {});
  }, []);

  const selectedCompanies = companies.filter((c) =>
    selectedIds.includes(c.id)
  );
  const availableCompanies = companies.filter(
    (c) =>
      !selectedIds.includes(c.id) &&
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (id: string) => {
    onSelectionChange([...selectedIds, id]);
    setOpen(false);
    setSearch("");
  };

  const handleRemove = (id: string) => {
    onSelectionChange(selectedIds.filter((sid) => sid !== id));
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {selectedCompanies.map((company) => (
        <div
          key={company.id}
          className="inline-flex items-center gap-1.5 rounded-full border bg-card pl-3 pr-1 py-1 text-sm"
        >
          {company.is_primary && (
            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
          )}
          <span className="font-medium">{company.name}</span>
          <button
            onClick={() => handleRemove(company.id)}
            className="rounded-full p-0.5 hover:bg-accent transition-colors"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Company
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Company to Compare</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="max-h-60 overflow-y-auto space-y-1">
            {availableCompanies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No companies found.
              </p>
            ) : (
              availableCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleAdd(company.id)}
                  className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                >
                  {company.is_primary && (
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                  )}
                  <span className="font-medium">{company.name}</span>
                  {company.stage && (
                    <Badge variant="outline" className="text-[10px] ml-auto">
                      {company.stage}
                    </Badge>
                  )}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
