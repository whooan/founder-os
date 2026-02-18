"use client";

import { useCallback, useEffect, useState } from "react";
import { Building, Pencil, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchCompanyLegal, upsertCompanyLegal } from "@/lib/api/legal";
import type { CompanyLegal } from "@/types";

interface CompanyInfoFormProps {
  companyId: string;
}

interface FormState {
  legal_name: string;
  cif: string;
  registered_address: string;
  city: string;
  postal_code: string;
  country: string;
  registration_number: string;
  registration_date: string;
  notary: string;
  protocol_number: string;
  notes: string;
}

const emptyForm: FormState = {
  legal_name: "",
  cif: "",
  registered_address: "",
  city: "",
  postal_code: "",
  country: "",
  registration_number: "",
  registration_date: "",
  notary: "",
  protocol_number: "",
  notes: "",
};

export function CompanyInfoForm({ companyId }: CompanyInfoFormProps) {
  const [data, setData] = useState<CompanyLegal | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const info = await fetchCompanyLegal(companyId);
    setData(info);
    if (info) {
      setForm({
        legal_name: info.legal_name ?? "",
        cif: info.cif ?? "",
        registered_address: info.registered_address ?? "",
        city: info.city ?? "",
        postal_code: info.postal_code ?? "",
        country: info.country ?? "",
        registration_number: info.registration_number ?? "",
        registration_date: info.registration_date
          ? info.registration_date.slice(0, 10)
          : "",
        notary: info.notary ?? "",
        protocol_number: info.protocol_number ?? "",
        notes: info.notes ?? "",
      });
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await upsertCompanyLegal(companyId, {
        legal_name: form.legal_name || undefined,
        cif: form.cif || undefined,
        registered_address: form.registered_address || undefined,
        city: form.city || undefined,
        postal_code: form.postal_code || undefined,
        country: form.country || undefined,
        registration_number: form.registration_number || undefined,
        registration_date: form.registration_date || undefined,
        notary: form.notary || undefined,
        protocol_number: form.protocol_number || undefined,
        notes: form.notes || undefined,
      });
      setData(result);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading company info...
        </CardContent>
      </Card>
    );
  }

  const fields: { key: keyof FormState; label: string; type?: string }[] = [
    { key: "legal_name", label: "Legal Name" },
    { key: "cif", label: "CIF / NIF" },
    { key: "registered_address", label: "Registered Address" },
    { key: "city", label: "City" },
    { key: "postal_code", label: "Postal Code" },
    { key: "country", label: "Country" },
    { key: "registration_number", label: "Registration Number" },
    { key: "registration_date", label: "Registration Date", type: "date" },
    { key: "notary", label: "Notary" },
    { key: "protocol_number", label: "Protocol Number" },
    { key: "notes", label: "Notes" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Company Legal Info
          </CardTitle>
          {editing ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(false);
                  if (data) {
                    setForm({
                      legal_name: data.legal_name ?? "",
                      cif: data.cif ?? "",
                      registered_address: data.registered_address ?? "",
                      city: data.city ?? "",
                      postal_code: data.postal_code ?? "",
                      country: data.country ?? "",
                      registration_number: data.registration_number ?? "",
                      registration_date: data.registration_date
                        ? data.registration_date.slice(0, 10)
                        : "",
                      notary: data.notary ?? "",
                      protocol_number: data.protocol_number ?? "",
                      notes: data.notes ?? "",
                    });
                  }
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="mr-1 h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!data && !editing ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              No company legal info yet.
            </p>
            <Button onClick={() => setEditing(true)}>
              <Pencil className="mr-1 h-4 w-4" />
              Add Info
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="text-sm font-medium text-muted-foreground">
                  {f.label}
                </label>
                {editing ? (
                  <Input
                    type={f.type ?? "text"}
                    value={form[f.key]}
                    onChange={(e) => updateField(f.key, e.target.value)}
                  />
                ) : (
                  <p className="mt-1 text-sm">
                    {form[f.key] || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
