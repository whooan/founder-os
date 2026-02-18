"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchShareClasses,
  createShareClass,
  deleteShareClass,
} from "@/lib/api/captable";
import type { ShareClass } from "@/types";

interface ShareClassManagerProps {
  companyId: string;
}

export function ShareClassManager({ companyId }: ShareClassManagerProps) {
  const [classes, setClasses] = useState<ShareClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [votesPerShare, setVotesPerShare] = useState("1");
  const [liquidationPref, setLiquidationPref] = useState("");
  const [seniority, setSeniority] = useState("0");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchShareClasses(companyId);
    setClasses(data);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    await createShareClass(companyId, {
      name,
      votes_per_share: parseInt(votesPerShare) || 1,
      liquidation_preference: liquidationPref || undefined,
      seniority: parseInt(seniority) || 0,
    });
    setName("");
    setVotesPerShare("1");
    setLiquidationPref("");
    setSeniority("0");
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await deleteShareClass(id);
    load();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4" />
              Share Classes
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Class
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : classes.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">
                No share classes defined yet. Create at least one (e.g. &quot;Common&quot;) before adding equity events.
              </p>
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Create First Share Class
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {classes.map((sc) => (
                <div
                  key={sc.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">{sc.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {sc.votes_per_share} vote{sc.votes_per_share !== 1 ? "s" : ""}/share
                    </Badge>
                    {sc.liquidation_preference && (
                      <Badge variant="outline" className="text-xs">
                        {sc.liquidation_preference} liq. pref.
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Seniority: {sc.seniority}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(sc.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Share Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Common, Preferred A, SAFE"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">Votes/Share</label>
                <Input
                  type="number"
                  value={votesPerShare}
                  onChange={(e) => setVotesPerShare(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Liq. Preference</label>
                <Input
                  value={liquidationPref}
                  onChange={(e) => setLiquidationPref(e.target.value)}
                  placeholder="e.g. 1x"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Seniority</label>
                <Input
                  type="number"
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!name.trim()}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
