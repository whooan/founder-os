"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
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
  fetchStakeholders,
  createStakeholder,
  updateStakeholder,
  deleteStakeholder,
} from "@/lib/api/captable";
import type { Stakeholder } from "@/types";

const STAKEHOLDER_TYPES = ["founder", "employee", "angel", "vc", "other"] as const;

const typeBadgeColor: Record<string, string> = {
  founder: "bg-violet-100 text-violet-700",
  employee: "bg-blue-100 text-blue-700",
  angel: "bg-amber-100 text-amber-700",
  vc: "bg-green-100 text-green-700",
  other: "bg-gray-100 text-gray-700",
};

interface StakeholderTableProps {
  companyId: string;
}

interface FormState {
  name: string;
  type: string;
  email: string;
  phone: string;
  entity_name: string;
  contact_person: string;
  partner_emails: string;
  linkedin_url: string;
  notes: string;
}

const emptyForm: FormState = {
  name: "",
  type: "founder",
  email: "",
  phone: "",
  entity_name: "",
  contact_person: "",
  partner_emails: "",
  linkedin_url: "",
  notes: "",
};

export function StakeholderTable({ companyId }: StakeholderTableProps) {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchStakeholders(companyId);
    setStakeholders(data);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (sh: Stakeholder) => {
    setEditingId(sh.id);
    setForm({
      name: sh.name,
      type: sh.type,
      email: sh.email ?? "",
      phone: sh.phone ?? "",
      entity_name: sh.entity_name ?? "",
      contact_person: sh.contact_person ?? "",
      partner_emails: sh.partner_emails ?? "",
      linkedin_url: sh.linkedin_url ?? "",
      notes: sh.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const data = {
      name: form.name,
      type: form.type,
      email: form.email || undefined,
      phone: form.phone || undefined,
      entity_name: form.entity_name || undefined,
      contact_person: form.contact_person || undefined,
      partner_emails: form.partner_emails || undefined,
      linkedin_url: form.linkedin_url || undefined,
      notes: form.notes || undefined,
    };

    if (editingId) {
      await updateStakeholder(editingId, data);
    } else {
      await createStakeholder(companyId, data);
    }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await deleteStakeholder(id);
    load();
  };

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading stakeholders...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Stakeholders
            </CardTitle>
            <Button size="sm" onClick={openAdd}>
              <Plus className="mr-1 h-4 w-4" />
              Add Stakeholder
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stakeholders.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No stakeholders yet. Add founders, investors, and employees.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Type</th>
                    <th className="pb-2 pr-4 font-medium">Entity</th>
                    <th className="pb-2 pr-4 font-medium">Contact Person</th>
                    <th className="pb-2 pr-4 font-medium">Email</th>
                    <th className="pb-2 pr-4 font-medium">Phone</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stakeholders.map((sh) => (
                    <tr key={sh.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{sh.name}</td>
                      <td className="py-2 pr-4">
                        <Badge
                          variant="secondary"
                          className={typeBadgeColor[sh.type] ?? typeBadgeColor.other}
                        >
                          {sh.type}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4">{sh.entity_name ?? "—"}</td>
                      <td className="py-2 pr-4">{sh.contact_person ?? "—"}</td>
                      <td className="py-2 pr-4">{sh.email ?? "—"}</td>
                      <td className="py-2 pr-4">{sh.phone ?? "—"}</td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(sh)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(sh.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Stakeholder" : "Add Stakeholder"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Type *</label>
                <Select
                  value={form.type}
                  onValueChange={(v) => updateField("type", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAKEHOLDER_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+34 600 000 000"
                />
              </div>
            </div>
            {(form.type === "vc" || form.type === "angel") && (
              <>
                <div>
                  <label className="text-sm font-medium">Entity / Fund Name</label>
                  <Input
                    value={form.entity_name}
                    onChange={(e) => updateField("entity_name", e.target.value)}
                    placeholder="Sequoia Capital"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Contact Person</label>
                    <Input
                      value={form.contact_person}
                      onChange={(e) => updateField("contact_person", e.target.value)}
                      placeholder="Partner name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Partner Emails</label>
                    <Input
                      value={form.partner_emails}
                      onChange={(e) => updateField("partner_emails", e.target.value)}
                      placeholder="partner@vc.com, other@vc.com"
                    />
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="text-sm font-medium">LinkedIn URL</label>
              <Input
                value={form.linkedin_url}
                onChange={(e) => updateField("linkedin_url", e.target.value)}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Additional notes..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!form.name}>
                {editingId ? "Save Changes" : "Add Stakeholder"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
