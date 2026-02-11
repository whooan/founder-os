"use client";

import { Linkedin, Twitter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CompanyDetail } from "@/types";
import { safeArray } from "@/types";

interface TeamComparisonProps {
  companies: CompanyDetail[];
  primaryCompanyId: string | null;
}

export function TeamComparison({
  companies,
  primaryCompanyId,
}: TeamComparisonProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Team Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <div key={company.id}>
              <h4
                className={`text-sm font-semibold mb-3 ${
                  company.id === primaryCompanyId ? "text-primary" : ""
                }`}
              >
                {company.name}
              </h4>
              {company.founders.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No founder data
                </p>
              ) : (
                <div className="space-y-2.5">
                  {company.founders.map((founder) => (
                    <div
                      key={founder.id}
                      className="rounded-lg border p-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{founder.name}</p>
                          {founder.title && (
                            <p className="text-xs text-muted-foreground">
                              {founder.title}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-0.5">
                          {founder.linkedin_url && (
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                            >
                              <a
                                href={founder.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Linkedin className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                          {founder.twitter_handle && (
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                            >
                              <a
                                href={`https://twitter.com/${founder.twitter_handle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Twitter className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                      {founder.previous_companies &&
                        safeArray(founder.previous_companies).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {safeArray(founder.previous_companies).map((co, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-[10px] px-1.5 py-0"
                              >
                                {co}
                              </Badge>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
