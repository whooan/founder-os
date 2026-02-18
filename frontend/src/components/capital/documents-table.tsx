"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, FileText, ExternalLink } from "lucide-react";
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
  fetchLegalDocuments,
  createLegalDocument,
  updateLegalDocument,
  deleteLegalDocument,
} from "@/lib/api/legal";
import type { LegalDocument } from "@/types";

const DOC_TYPES = [
  { value: "escritura", label: "Escritura" },
  { value: "pact", label: "Pacto de Socios" },
  { value: "sha", label: "SHA" },
  { value: "bylaws", label: "Bylaws" },
  { value: "board_resolution", label: "Board Resolution" },
  { value: "other", label: "Other" },
];

const docTypeBadge: Record<string, string> = {
  escritura: "bg-blue-100 text-blue-700",
  pact: "bg-violet-100 text-violet-700",
  sha: "bg-green-100 text-green-700",
  bylaws: "bg-amber-100 text-amber-700",
  board_resolution: "bg-orange-100 text-orange-700",
  other: "bg-gray-100 text-gray-700",
};

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface DocumentsTableProps {
  companyId: string;
}

interface FormState {
  title: string;
  doc_type: string;
  date: string;
  summary: string;
  file_url: string;
  file_name: string;
  notes: string;
}

const emptyForm: FormState = {
  title: "",
  doc_type: "escritura",
  date: "",
  summary: "",
  file_url: "",
  file_name: "",
  notes: "",
};

export function DocumentsTable({ companyId }: DocumentsTableProps) {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchLegalDocuments(companyId);
    setDocuments(data);
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

  const openEdit = (doc: LegalDocument) => {
    setEditingId(doc.id);
    setForm({
      title: doc.title,
      doc_type: doc.doc_type,
      date: doc.date ? doc.date.slice(0, 10) : "",
      summary: doc.summary ?? "",
      file_url: doc.file_url ?? "",
      file_name: doc.file_name ?? "",
      notes: doc.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const data = {
      title: form.title,
      doc_type: form.doc_type,
      date: form.date || undefined,
      summary: form.summary || undefined,
      file_url: form.file_url || undefined,
      file_name: form.file_name || undefined,
      notes: form.notes || undefined,
    };

    if (editingId) {
      await updateLegalDocument(editingId, data);
    } else {
      await createLegalDocument(companyId, data);
    }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await deleteLegalDocument(id);
    load();
  };

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading documents...
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
              <FileText className="h-5 w-5" />
              Legal Documents
            </CardTitle>
            <Button size="sm" onClick={openAdd}>
              <Plus className="mr-1 h-4 w-4" />
              Add Document
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No legal documents yet. Add escrituras, pactos, SHA, and other documents.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Date</th>
                    <th className="pb-2 pr-4 font-medium">Title</th>
                    <th className="pb-2 pr-4 font-medium">Type</th>
                    <th className="pb-2 pr-4 font-medium">Summary</th>
                    <th className="pb-2 pr-4 font-medium">Link</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {formatDate(doc.date)}
                      </td>
                      <td className="py-2 pr-4 font-medium">{doc.title}</td>
                      <td className="py-2 pr-4">
                        <Badge
                          variant="secondary"
                          className={docTypeBadge[doc.doc_type] ?? docTypeBadge.other}
                        >
                          {DOC_TYPES.find((t) => t.value === doc.doc_type)?.label ??
                            doc.doc_type}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 max-w-xs truncate text-muted-foreground">
                        {doc.summary ?? "—"}
                      </td>
                      <td className="py-2 pr-4">
                        {doc.file_url ? (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {doc.file_name ?? "View"}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(doc)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(doc.id)}
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
              {editingId ? "Edit Document" : "Add Document"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. Escritura de Constitución"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type *</label>
                <Select
                  value={form.doc_type}
                  onValueChange={(v) => updateField("doc_type", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField("date", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Summary</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.summary}
                onChange={(e) => updateField("summary", e.target.value)}
                placeholder="Brief summary of the document..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">File URL</label>
                <Input
                  value={form.file_url}
                  onChange={(e) => updateField("file_url", e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">File Name</label>
                <Input
                  value={form.file_name}
                  onChange={(e) => updateField("file_name", e.target.value)}
                  placeholder="document.pdf"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!form.title}>
                {editingId ? "Save Changes" : "Add Document"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
