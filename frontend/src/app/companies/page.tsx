"use client";

import { useState, useMemo } from "react";
import { Search, Building2, RefreshCw, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddCompanyDialog } from "@/components/companies/add-company-dialog";
import { CompanyCard } from "@/components/companies/company-card";
import { useCompanies } from "@/hooks/use-companies";
import { bulkUpdate } from "@/lib/api/companies";

export default function CompaniesPage() {
  const { companies, loading, error, refetch } = useCompanies();
  const [search, setSearch] = useState("");
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const handleBulkUpdate = async () => {
    setBulkUpdating(true);
    try {
      await bulkUpdate();
      // Poll for completion
      setTimeout(() => {
        refetch();
        setBulkUpdating(false);
      }, 5000);
    } catch {
      setBulkUpdating(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return companies;
    const q = search.toLowerCase();
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.one_liner?.toLowerCase().includes(q) ||
        c.stage?.toLowerCase().includes(q)
    );
  }, [companies, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Companies</h2>
          <p className="text-sm text-muted-foreground">
            {companies.length} {companies.length === 1 ? "company" : "companies"} tracked
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkUpdate}
            disabled={bulkUpdating || companies.length === 0}
          >
            {bulkUpdating ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
            )}
            {bulkUpdating ? "Updating..." : "Bulk Update All"}
          </Button>
          <AddCompanyDialog onCompanyAdded={refetch} />
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-lg border bg-muted"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">
            {search ? "No matches found" : "No companies yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {search
              ? "Try adjusting your search query."
              : "Add your first company to start tracking."}
          </p>
          {!search && <AddCompanyDialog onCompanyAdded={refetch} />}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}
