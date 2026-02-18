"use client";

import { Scale } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentsTable } from "@/components/capital/documents-table";
import { CompanyInfoForm } from "@/components/capital/company-info-form";
import { usePrimaryCompany } from "@/hooks/use-primary-company";

export default function LegalPage() {
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
        <Scale className="h-10 w-10" />
        <p>No primary company set. Add a company first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Legal</h1>
        <p className="text-sm text-muted-foreground">
          Legal documents & company info for{" "}
          <span className="font-medium text-foreground">{company.name}</span>
        </p>
      </div>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="company-info">Company Info</TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <DocumentsTable companyId={company.id} />
        </TabsContent>

        <TabsContent value="company-info">
          <CompanyInfoForm companyId={company.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
