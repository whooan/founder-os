"use client";

import { Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CompanyDetail } from "@/types";

interface FeatureMatrixProps {
  featureMatrix: Record<string, Record<string, boolean>>;
  companies: CompanyDetail[];
  primaryCompanyId: string | null;
}

export function FeatureMatrix({
  featureMatrix,
  companies,
  primaryCompanyId,
}: FeatureMatrixProps) {
  const features = Object.keys(featureMatrix);

  if (features.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No feature data available for comparison.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Feature Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-3 text-left font-medium text-muted-foreground min-w-[200px]">
                  Feature
                </th>
                {companies.map((c) => (
                  <th
                    key={c.id}
                    className={`pb-3 text-center font-medium min-w-[100px] ${
                      c.id === primaryCompanyId
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature) => (
                <tr key={feature} className="border-b last:border-0">
                  <td className="py-2.5 text-sm pr-4">{feature}</td>
                  {companies.map((c) => (
                    <td key={c.id} className="py-2.5 text-center">
                      {featureMatrix[feature]?.[c.id] ? (
                        <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
