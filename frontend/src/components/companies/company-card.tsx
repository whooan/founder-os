"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PipelineStatusBadge } from "@/components/companies/pipeline-status";
import type { Company } from "@/types";

interface CompanyCardProps {
  company: Company;
}

export function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Link href={`/companies/${company.id}`}>
      <Card className="transition-colors hover:bg-accent/50 cursor-pointer h-full">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold">
              {company.name}
            </CardTitle>
          </div>
          <PipelineStatusBadge status={company.status} />
        </CardHeader>
        <CardContent>
          {company.one_liner && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {company.one_liner}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {company.stage && (
              <Badge variant="outline" className="text-xs">
                {company.stage}
              </Badge>
            )}
            {company.hq_location && (
              <span className="text-xs text-muted-foreground">
                {company.hq_location}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
