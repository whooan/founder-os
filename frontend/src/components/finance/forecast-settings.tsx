"use client";

import { useState } from "react";
import { Loader2, Save, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ForecastSettings } from "@/types";
import { updateForecast } from "@/lib/api/finance";

export function ForecastSettingsPanel({
  initial,
  onUpdate,
}: {
  initial: ForecastSettings;
  onUpdate: (fs: ForecastSettings) => void;
}) {
  const [burn, setBurn] = useState(String(initial.monthly_burn || ""));
  const [income, setIncome] = useState(String(initial.monthly_income || ""));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateForecast({
        monthly_burn: parseFloat(burn) || 0,
        monthly_income: parseFloat(income) || 0,
      });
      onUpdate(updated);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Forecast Settings</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="forecast-burn" className="text-xs text-muted-foreground">
              Monthly Burn ({"\u20ac"})
            </Label>
            <Input
              id="forecast-burn"
              type="number"
              value={burn}
              onChange={(e) => setBurn(e.target.value)}
              className="w-36"
              placeholder="50000"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="forecast-income" className="text-xs text-muted-foreground">
              Monthly Income ({"\u20ac"})
            </Label>
            <Input
              id="forecast-income"
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-36"
              placeholder="10000"
            />
          </div>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            Save & Project
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Set expected monthly values to project future runway on the chart above.
        </p>
      </CardContent>
    </Card>
  );
}
