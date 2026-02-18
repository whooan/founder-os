"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, Pencil, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchCategoryRules,
  fetchCategoryOptions,
  upsertCategoryRule,
  triggerAutoClassify,
} from "@/lib/api/finance";
import type { CategoryRule } from "@/types";

export function CategoryManager({ onUpdate }: { onUpdate: () => void }) {
  const [rules, setRules] = useState<CategoryRule[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [classifying, setClassifying] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [r, o] = await Promise.all([
        fetchCategoryRules(),
        fetchCategoryOptions(),
      ]);
      setRules(r);
      setOptions(o);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAutoClassify = async () => {
    setClassifying(true);
    try {
      await triggerAutoClassify();
      await load();
      onUpdate();
    } finally {
      setClassifying(false);
    }
  };

  const handleSave = async (contactName: string) => {
    await upsertCategoryRule(contactName, editCategory);
    setEditingId(null);
    await load();
    onUpdate();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Expense Categories</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoClassify}
            disabled={classifying}
          >
            {classifying ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            )}
            Auto-Classify
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : rules.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No category rules yet. Click Auto-Classify to get started.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="truncate mr-2 flex-1">{rule.contact_name}</span>
                {editingId === rule.id ? (
                  <div className="flex items-center gap-1.5">
                    <select
                      className="h-7 rounded-md border border-input bg-background px-2 text-xs"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                    >
                      {options.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleSave(rule.contact_name)}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-xs">
                      {rule.category}
                    </Badge>
                    {rule.is_auto && (
                      <Sparkles className="h-3 w-3 text-muted-foreground" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        setEditingId(rule.id);
                        setEditCategory(rule.category);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
