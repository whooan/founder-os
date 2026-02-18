"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { createEquityEvent } from "@/lib/api/captable";
import type { ShareClass, Stakeholder } from "@/types";

const EVENT_TYPES = [
  { value: "incorporation", label: "Incorporation" },
  { value: "funding_round", label: "Funding Round" },
  { value: "grant", label: "Grant / ESOP" },
  { value: "secondary", label: "Secondary Sale" },
  { value: "conversion", label: "Conversion" },
];

interface AllocationRow {
  stakeholder_id: string;
  share_class_id: string;
  shares: string;
  amount_invested: string;
}

const emptyAllocation: AllocationRow = {
  stakeholder_id: "",
  share_class_id: "",
  shares: "",
  amount_invested: "",
};

interface EquityEventDialogProps {
  companyId: string;
  shareClasses: ShareClass[];
  stakeholders: Stakeholder[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function EquityEventDialog({
  companyId,
  shareClasses,
  stakeholders,
  open,
  onOpenChange,
  onCreated,
}: EquityEventDialogProps) {
  const [name, setName] = useState("");
  const [eventType, setEventType] = useState("incorporation");
  const [date, setDate] = useState("");
  const [preMoneyValuation, setPreMoneyValuation] = useState("");
  const [amountRaised, setAmountRaised] = useState("");
  const [pricePerShare, setPricePerShare] = useState("");
  const [allocations, setAllocations] = useState<AllocationRow[]>([
    { ...emptyAllocation },
  ]);
  const [saving, setSaving] = useState(false);

  const addAllocation = () => {
    setAllocations([...allocations, { ...emptyAllocation }]);
  };

  const removeAllocation = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const updateAllocation = (
    index: number,
    field: keyof AllocationRow,
    value: string
  ) => {
    setAllocations(
      allocations.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  };

  const totalShares = allocations.reduce(
    (sum, a) => sum + (parseInt(a.shares) || 0),
    0
  );

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const validAllocations = allocations
        .filter((a) => a.stakeholder_id && a.share_class_id && parseInt(a.shares) > 0)
        .map((a) => {
          const shares = parseInt(a.shares);
          return {
            stakeholder_id: a.stakeholder_id,
            share_class_id: a.share_class_id,
            shares,
            amount_invested: a.amount_invested
              ? parseFloat(a.amount_invested)
              : undefined,
            ownership_pct: totalShares > 0
              ? Math.round((shares / totalShares) * 10000) / 100
              : 0,
          };
        });

      await createEquityEvent(companyId, {
        name,
        event_type: eventType,
        date: date || undefined,
        pre_money_valuation: preMoneyValuation
          ? parseFloat(preMoneyValuation)
          : undefined,
        amount_raised: amountRaised
          ? parseFloat(amountRaised)
          : undefined,
        price_per_share: pricePerShare
          ? parseFloat(pricePerShare)
          : undefined,
        total_shares_after: totalShares || undefined,
        allocations: validAllocations,
      });

      // Reset form
      setName("");
      setEventType("incorporation");
      setDate("");
      setPreMoneyValuation("");
      setAmountRaised("");
      setPricePerShare("");
      setAllocations([{ ...emptyAllocation }]);
      onOpenChange(false);
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Equity Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Event details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Event Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Incorporation, Seed Round"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Type *</label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Price per Share</label>
              <Input
                type="number"
                step="0.01"
                value={pricePerShare}
                onChange={(e) => setPricePerShare(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Pre-money Valuation</label>
              <Input
                type="number"
                value={preMoneyValuation}
                onChange={(e) => setPreMoneyValuation(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Amount Raised</label>
              <Input
                type="number"
                value={amountRaised}
                onChange={(e) => setAmountRaised(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Allocations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Share Allocations</label>
              {totalShares > 0 && (
                <span className="text-xs text-muted-foreground">
                  Total: {totalShares.toLocaleString()} shares
                </span>
              )}
            </div>

            {shareClasses.length === 0 && (
              <p className="text-sm text-muted-foreground mb-2">
                No share classes defined. Create a share class in the Cap Table tab first.
              </p>
            )}

            {stakeholders.length === 0 && (
              <p className="text-sm text-muted-foreground mb-2">
                No stakeholders defined. Add stakeholders in the Stakeholders tab first.
              </p>
            )}

            <div className="space-y-2">
              {allocations.map((alloc, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Select
                    value={alloc.stakeholder_id}
                    onValueChange={(v) =>
                      updateAllocation(i, "stakeholder_id", v)
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Stakeholder" />
                    </SelectTrigger>
                    <SelectContent>
                      {stakeholders.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={alloc.share_class_id}
                    onValueChange={(v) =>
                      updateAllocation(i, "share_class_id", v)
                    }
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {shareClasses.map((sc) => (
                        <SelectItem key={sc.id} value={sc.id}>
                          {sc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    className="w-28"
                    placeholder="Shares"
                    value={alloc.shares}
                    onChange={(e) =>
                      updateAllocation(i, "shares", e.target.value)
                    }
                  />

                  <Input
                    type="number"
                    className="w-28"
                    placeholder="Invested"
                    value={alloc.amount_invested}
                    onChange={(e) =>
                      updateAllocation(i, "amount_invested", e.target.value)
                    }
                  />

                  {allocations.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAllocation(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={addAllocation}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Allocation
            </Button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name || saving}
            >
              {saving ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
