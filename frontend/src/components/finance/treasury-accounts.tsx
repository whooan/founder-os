"use client";

import { Landmark } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TreasuryAccount } from "@/types";

function maskIban(iban: string | null): string {
  if (!iban) return "----";
  return `****${iban.slice(-4)}`;
}

export function TreasuryAccounts({ accounts }: { accounts: TreasuryAccount[] }) {
  if (accounts.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Treasury Accounts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="flex items-center justify-between rounded-lg border border-border p-4"
          >
            <div className="flex items-center gap-3">
              <Landmark className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{acc.name}</p>
                <p className="text-xs text-muted-foreground">
                  IBAN: {maskIban(acc.iban)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">{acc.account_type || "bank"}</Badge>
              <p className="text-base font-semibold tabular-nums">
                {acc.currency === "EUR" ? "\u20ac" : acc.currency}
                {acc.balance.toLocaleString("de-DE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
