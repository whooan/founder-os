"use client";

import { Users } from "lucide-react";
import { StakeholderTable } from "@/components/capital/stakeholder-table";
import { usePrimaryCompany } from "@/hooks/use-primary-company";

export default function StakeholdersPage() {
  const { company, loading } = usePrimaryCompany();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <Users className="h-10 w-10" />
        <p>No primary company set. Add a company first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stakeholders</h1>
        <p className="text-sm text-muted-foreground">
          Equity holders for{" "}
          <span className="font-medium text-foreground">{company.name}</span>
        </p>
      </div>

      <StakeholderTable companyId={company.id} />
    </div>
  );
}
