"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Settings2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchVsopSummary,
  upsertVsopPool,
  createVsopGrant,
  updateVsopGrant,
  deleteVsopGrant,
} from "@/lib/api/vsop";
import { fetchStakeholders } from "@/lib/api/captable";
import type { VsopSummary, VsopGrant, Stakeholder } from "@/types";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  active: { label: "Active", color: "bg-green-100 text-green-700", icon: Clock },
  fully_vested: { label: "Fully Vested", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
  terminated: { label: "Terminated", color: "bg-red-100 text-red-700", icon: XCircle },
};

interface VsopPanelProps {
  companyId: string;
}

export function VsopPanel({ companyId }: VsopPanelProps) {
  const [summary, setSummary] = useState<VsopSummary | null>(null);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [poolDialogOpen, setPoolDialogOpen] = useState(false);
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [editingGrant, setEditingGrant] = useState<VsopGrant | null>(null);

  // Pool form
  const [poolName, setPoolName] = useState("Employee VSOP Pool");
  const [poolShares, setPoolShares] = useState("");

  // Grant form
  const [gStakeholderId, setGStakeholderId] = useState("");
  const [gShares, setGShares] = useState("");
  const [gStrikePrice, setGStrikePrice] = useState("");
  const [gGrantDate, setGGrantDate] = useState("");
  const [gCliffMonths, setGCliffMonths] = useState("12");
  const [gVestingMonths, setGVestingMonths] = useState("48");
  const [gStatus, setGStatus] = useState("active");
  const [gNotes, setGNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [s, sh] = await Promise.all([
      fetchVsopSummary(companyId),
      fetchStakeholders(companyId),
    ]);
    setSummary(s);
    setStakeholders(sh);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const openPoolDialog = () => {
    if (summary?.pool) {
      setPoolName(summary.pool.name);
      setPoolShares(summary.pool.total_shares.toString());
    } else {
      setPoolName("Employee VSOP Pool");
      setPoolShares("");
    }
    setPoolDialogOpen(true);
  };

  const handleSavePool = async () => {
    await upsertVsopPool(companyId, {
      name: poolName,
      total_shares: parseInt(poolShares) || 0,
    });
    setPoolDialogOpen(false);
    load();
  };

  const openAddGrant = () => {
    setEditingGrant(null);
    setGStakeholderId("");
    setGShares("");
    setGStrikePrice("");
    setGGrantDate("");
    setGCliffMonths("12");
    setGVestingMonths("48");
    setGStatus("active");
    setGNotes("");
    setGrantDialogOpen(true);
  };

  const openEditGrant = (g: VsopGrant) => {
    setEditingGrant(g);
    setGStakeholderId(g.stakeholder_id);
    setGShares(g.shares_granted.toString());
    setGStrikePrice(g.strike_price?.toString() ?? "");
    setGGrantDate(g.grant_date ? g.grant_date.slice(0, 10) : "");
    setGCliffMonths(g.cliff_months.toString());
    setGVestingMonths(g.vesting_months.toString());
    setGStatus(g.status);
    setGNotes(g.notes ?? "");
    setGrantDialogOpen(true);
  };

  const handleSaveGrant = async () => {
    const data = {
      stakeholder_id: gStakeholderId,
      shares_granted: parseInt(gShares) || 0,
      strike_price: gStrikePrice ? parseFloat(gStrikePrice) : undefined,
      grant_date: gGrantDate || undefined,
      cliff_months: parseInt(gCliffMonths) || 12,
      vesting_months: parseInt(gVestingMonths) || 48,
      notes: gNotes || undefined,
    };

    if (editingGrant) {
      await updateVsopGrant(editingGrant.id, {
        ...data,
        status: gStatus,
      });
    } else {
      await createVsopGrant(companyId, data);
    }
    setGrantDialogOpen(false);
    load();
  };

  const handleDeleteGrant = async (id: string) => {
    await deleteVsopGrant(id);
    load();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading VSOP...
        </CardContent>
      </Card>
    );
  }

  const pool = summary?.pool;
  const grants = summary?.grants ?? [];
  const employees = stakeholders.filter((s) => s.type === "employee");

  return (
    <>
      {/* Pool Setup / Summary */}
      {!pool ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              VSOP Pool
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No VSOP pool configured yet. Create one to start granting phantom shares to employees.
            </p>
            <Button onClick={openPoolDialog}>
              <Plus className="mr-1 h-4 w-4" />
              Create VSOP Pool
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pool Size</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{formatNumber(pool.total_shares)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{pool.name}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Granted / Available</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {formatNumber(summary!.total_granted)}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    / {formatNumber(summary!.total_available)}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {summary!.pool_utilization_pct}% utilized
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vested</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-green-600">
                  {formatNumber(summary!.total_vested)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {summary!.overall_vesting_pct}% of granted
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Unvested</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-amber-600">
                  {formatNumber(summary!.total_unvested)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {grants.filter((g) => g.status === "active").length} active grants
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pool utilization bar */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Award className="h-4 w-4" />
                  Pool Utilization
                </CardTitle>
                <Button size="sm" variant="outline" onClick={openPoolDialog}>
                  <Settings2 className="mr-1 h-3.5 w-3.5" />
                  Edit Pool
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {formatNumber(summary!.total_granted)} granted of {formatNumber(pool.total_shares)}
                  </span>
                  <span className="font-medium">{summary!.pool_utilization_pct}%</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all"
                    style={{ width: `${Math.min(summary!.pool_utilization_pct, 100)}%` }}
                  />
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Vested: {formatNumber(summary!.total_vested)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Unvested: {formatNumber(summary!.total_unvested)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                    Available: {formatNumber(summary!.total_available)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grants Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Grants</CardTitle>
                <Button size="sm" onClick={openAddGrant} disabled={summary!.total_available <= 0}>
                  <Plus className="mr-1 h-4 w-4" />
                  New Grant
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {grants.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No grants yet. Add employees as stakeholders, then create grants.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">Employee</th>
                        <th className="pb-2 pr-4 font-medium">Status</th>
                        <th className="pb-2 pr-4 font-medium text-right">Granted</th>
                        <th className="pb-2 pr-4 font-medium text-right">Vested</th>
                        <th className="pb-2 pr-4 font-medium">Vesting Progress</th>
                        <th className="pb-2 pr-4 font-medium">Grant Date</th>
                        <th className="pb-2 pr-4 font-medium">Schedule</th>
                        <th className="pb-2 pr-4 font-medium text-right">Strike</th>
                        <th className="pb-2 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grants.map((g) => {
                        const cfg = statusConfig[g.status] ?? statusConfig.active;
                        return (
                          <tr key={g.id} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium">
                              {g.stakeholder_name ?? "Unknown"}
                            </td>
                            <td className="py-2 pr-4">
                              <Badge variant="secondary" className={cfg.color}>
                                {cfg.label}
                              </Badge>
                            </td>
                            <td className="py-2 pr-4 text-right tabular-nums">
                              {formatNumber(g.shares_granted)}
                            </td>
                            <td className="py-2 pr-4 text-right tabular-nums">
                              {formatNumber(g.vested_shares)}
                            </td>
                            <td className="py-2 pr-4 w-40">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      g.status === "terminated"
                                        ? "bg-red-400"
                                        : g.vesting_pct >= 100
                                          ? "bg-blue-500"
                                          : g.cliff_met
                                            ? "bg-green-500"
                                            : "bg-amber-400"
                                    }`}
                                    style={{ width: `${Math.min(g.vesting_pct, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs tabular-nums w-10 text-right">
                                  {g.vesting_pct}%
                                </span>
                              </div>
                              {!g.cliff_met && g.status === "active" && (
                                <p className="text-[10px] text-amber-600 mt-0.5">
                                  Cliff not met
                                </p>
                              )}
                            </td>
                            <td className="py-2 pr-4 text-xs whitespace-nowrap">
                              {formatDate(g.grant_date)}
                            </td>
                            <td className="py-2 pr-4 text-xs whitespace-nowrap text-muted-foreground">
                              {g.cliff_months}mo cliff / {g.vesting_months}mo total
                            </td>
                            <td className="py-2 pr-4 text-right tabular-nums">
                              {g.strike_price ? `€${g.strike_price}` : "—"}
                            </td>
                            <td className="py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditGrant(g)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteGrant(g.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pool Dialog */}
      <Dialog open={poolDialogOpen} onOpenChange={setPoolDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{pool ? "Edit VSOP Pool" : "Create VSOP Pool"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Pool Name</label>
              <Input
                value={poolName}
                onChange={(e) => setPoolName(e.target.value)}
                placeholder="Employee VSOP Pool"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Total Phantom Shares *</label>
              <Input
                type="number"
                value={poolShares}
                onChange={(e) => setPoolShares(e.target.value)}
                placeholder="e.g. 100000"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Typically 10-15% of total shares. This is the maximum that can be granted.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPoolDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePool} disabled={!poolShares}>
                {pool ? "Save" : "Create Pool"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grant Dialog */}
      <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingGrant ? "Edit Grant" : "New Grant"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Employee *</label>
              <Select value={gStakeholderId} onValueChange={setGStakeholderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.length > 0 ? (
                    employees.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))
                  ) : (
                    stakeholders.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.type})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {employees.length === 0 && stakeholders.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Showing all stakeholders. Add stakeholders with type &quot;employee&quot; for better filtering.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Phantom Shares *</label>
                <Input
                  type="number"
                  value={gShares}
                  onChange={(e) => setGShares(e.target.value)}
                  placeholder="10000"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Strike Price (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={gStrikePrice}
                  onChange={(e) => setGStrikePrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Grant Date</label>
                <Input
                  type="date"
                  value={gGrantDate}
                  onChange={(e) => setGGrantDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Cliff (months)</label>
                <Input
                  type="number"
                  value={gCliffMonths}
                  onChange={(e) => setGCliffMonths(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Vesting (months)</label>
                <Input
                  type="number"
                  value={gVestingMonths}
                  onChange={(e) => setGVestingMonths(e.target.value)}
                />
              </div>
            </div>
            {editingGrant && (
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={gStatus} onValueChange={setGStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="fully_vested">Fully Vested</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input
                value={gNotes}
                onChange={(e) => setGNotes(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setGrantDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveGrant}
                disabled={!gStakeholderId || !gShares}
              >
                {editingGrant ? "Save Changes" : "Create Grant"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
