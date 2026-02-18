"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  fetchPlannedExpenses,
  createPlannedExpense,
  deletePlannedExpense,
  fetchCategoryOptions,
} from "@/lib/api/finance";
import type { PlannedExpense } from "@/types";

function currentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${q}`;
}

function nextQuarters(count: number): string[] {
  const quarters: string[] = [];
  const now = new Date();
  let y = now.getFullYear();
  let q = Math.ceil((now.getMonth() + 1) / 3);
  for (let i = 0; i < count; i++) {
    quarters.push(`${y}-Q${q}`);
    q++;
    if (q > 4) {
      q = 1;
      y++;
    }
  }
  return quarters;
}

export function PlannedExpensesPanel() {
  const [items, setItems] = useState<PlannedExpense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [quarter, setQuarter] = useState(currentQuarter());
  const [isRecurring, setIsRecurring] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [pe, cats] = await Promise.all([
        fetchPlannedExpenses(),
        fetchCategoryOptions(),
      ]);
      setItems(pe);
      setCategories(cats);
      if (!category && cats.length > 0) setCategory(cats[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!name || !amount) return;
    setSaving(true);
    try {
      await createPlannedExpense({
        name,
        category,
        amount: parseFloat(amount) || 0,
        quarter: isRecurring ? null : quarter,
        is_recurring: isRecurring,
        notes: null,
      });
      setName("");
      setAmount("");
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deletePlannedExpense(id);
    await load();
  };

  const quarters = nextQuarters(8);

  // Group by quarter
  const grouped: Record<string, PlannedExpense[]> = {};
  const recurring: PlannedExpense[] = [];
  for (const item of items) {
    if (item.is_recurring) {
      recurring.push(item);
    } else if (item.quarter) {
      if (!grouped[item.quarter]) grouped[item.quarter] = [];
      grouped[item.quarter].push(item);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Expected Expenses</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="mb-4 space-y-3 rounded-lg border border-border p-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. New hire"
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Amount ({"\u20ac"}/quarter)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="15000"
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Category</Label>
                <select
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Quarter</Label>
                <div className="flex items-center gap-2">
                  <select
                    className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                    value={quarter}
                    onChange={(e) => setQuarter(e.target.value)}
                    disabled={isRecurring}
                  >
                    {quarters.map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                    />
                    Recurring
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={saving || !name || !amount}>
                {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Add Expense
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 && !showForm ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No planned expenses yet. Add expected costs to improve forecasting.
          </p>
        ) : (
          <div className="space-y-3">
            {recurring.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Recurring</p>
                {recurring.map((item) => (
                  <ExpenseRow key={item.id} item={item} onDelete={handleDelete} />
                ))}
              </div>
            )}
            {Object.entries(grouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([q, items_in_q]) => (
                <div key={q}>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">{q}</p>
                  {items_in_q.map((item) => (
                    <ExpenseRow key={item.id} item={item} onDelete={handleDelete} />
                  ))}
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ExpenseRow({
  item,
  onDelete,
}: {
  item: PlannedExpense;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 mb-1 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium">{item.name}</span>
        <Badge variant="outline" className="text-xs">{item.category}</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="tabular-nums font-medium">
          {"\u20ac"}{item.amount.toLocaleString("de-DE")}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
