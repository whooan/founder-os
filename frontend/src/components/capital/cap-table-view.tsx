"use client";

import { useCallback, useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EquityEventDialog } from "@/components/capital/equity-event-dialog";
import {
  fetchCapTableSnapshot,
  fetchShareClasses,
  fetchStakeholders,
} from "@/lib/api/captable";
import type { CapTableSnapshot, ShareClass, Stakeholder } from "@/types";

const COLORS = [
  "#8b5cf6", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#6366f1", "#14b8a6", "#f97316",
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${(n / 1_000).toFixed(0)}K`;
  return `€${n.toLocaleString()}`;
}

interface CapTableViewProps {
  companyId: string;
}

export function CapTableView({ companyId }: CapTableViewProps) {
  const [snapshot, setSnapshot] = useState<CapTableSnapshot | null>(null);
  const [shareClasses, setShareClasses] = useState<ShareClass[]>([]);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [snap, classes, holders] = await Promise.all([
      fetchCapTableSnapshot(companyId),
      fetchShareClasses(companyId),
      fetchStakeholders(companyId),
    ]);
    setSnapshot(snap);
    setShareClasses(classes);
    setStakeholders(holders);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading cap table...
        </CardContent>
      </Card>
    );
  }

  if (!snapshot || snapshot.rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Ownership</CardTitle>
            <Button size="sm" onClick={() => setEventDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add Equity Event
            </Button>
          </div>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>No equity events yet. Add stakeholders first, then create an equity event.</p>
        </CardContent>
        <EquityEventDialog
          companyId={companyId}
          shareClasses={shareClasses}
          stakeholders={stakeholders}
          open={eventDialogOpen}
          onOpenChange={setEventDialogOpen}
          onCreated={load}
        />
      </Card>
    );
  }

  const pieData = snapshot.rows.map((row) => ({
    name: row.stakeholder.name,
    value: row.ownership_pct,
  }));

  const typeBadgeColor: Record<string, string> = {
    founder: "bg-violet-100 text-violet-700",
    employee: "bg-blue-100 text-blue-700",
    angel: "bg-amber-100 text-amber-700",
    vc: "bg-green-100 text-green-700",
    other: "bg-gray-100 text-gray-700",
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Ownership</CardTitle>
            <Button size="sm" onClick={() => setEventDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add Equity Event
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Pie Chart */}
            <div className="lg:col-span-1">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div className="lg:col-span-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Stakeholder</th>
                    <th className="pb-2 pr-4 font-medium">Type</th>
                    {snapshot.share_classes.map((sc) => (
                      <th key={sc.id} className="pb-2 pr-4 font-medium text-right">
                        {sc.name}
                      </th>
                    ))}
                    <th className="pb-2 pr-4 font-medium text-right">Total Shares</th>
                    <th className="pb-2 pr-4 font-medium text-right">%</th>
                    <th className="pb-2 font-medium text-right">Invested</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.rows.map((row, i) => (
                    <tr key={row.stakeholder.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          {row.stakeholder.name}
                        </div>
                      </td>
                      <td className="py-2 pr-4">
                        <Badge
                          variant="secondary"
                          className={typeBadgeColor[row.stakeholder.type] ?? typeBadgeColor.other}
                        >
                          {row.stakeholder.type}
                        </Badge>
                      </td>
                      {snapshot.share_classes.map((sc) => (
                        <td key={sc.id} className="py-2 pr-4 text-right tabular-nums">
                          {formatNumber(row.shares_by_class[sc.id] ?? 0)}
                        </td>
                      ))}
                      <td className="py-2 pr-4 text-right tabular-nums font-medium">
                        {formatNumber(row.total_shares)}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums font-medium">
                        {row.ownership_pct}%
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {row.total_invested > 0 ? formatCurrency(row.total_invested) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-medium">
                    <td className="pt-2 pr-4">Total</td>
                    <td className="pt-2 pr-4" />
                    {snapshot.share_classes.map((sc) => {
                      const total = snapshot.rows.reduce(
                        (sum, r) => sum + (r.shares_by_class[sc.id] ?? 0),
                        0
                      );
                      return (
                        <td key={sc.id} className="pt-2 pr-4 text-right tabular-nums">
                          {formatNumber(total)}
                        </td>
                      );
                    })}
                    <td className="pt-2 pr-4 text-right tabular-nums">
                      {formatNumber(snapshot.total_shares)}
                    </td>
                    <td className="pt-2 pr-4 text-right tabular-nums">100%</td>
                    <td className="pt-2 text-right tabular-nums">
                      {formatCurrency(
                        snapshot.rows.reduce((sum, r) => sum + r.total_invested, 0)
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <EquityEventDialog
        companyId={companyId}
        shareClasses={shareClasses}
        stakeholders={stakeholders}
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        onCreated={load}
      />
    </>
  );
}
