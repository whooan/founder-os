"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchSettings, updateSettings } from "@/lib/api/settings";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [maskedKey, setMaskedKey] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [isConfigured, setIsConfigured] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchSettings()
      .then((data) => {
        setMaskedKey(data.openai_api_key_masked);
        setModel(data.openai_model);
        setIsConfigured(data.is_configured);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const update: { openai_api_key?: string; openai_model?: string } = {
        openai_model: model,
      };
      if (apiKey) {
        update.openai_api_key = apiKey;
      }
      const data = await updateSettings(update);
      setMaskedKey(data.openai_api_key_masked);
      setIsConfigured(data.is_configured);
      setApiKey("");
      setMessage({ type: "success", text: "Settings saved successfully." });
    } catch {
      setMessage({ type: "error", text: "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>OpenAI Configuration</CardTitle>
              <CardDescription>
                Configure your OpenAI API key and model preferences.
              </CardDescription>
            </div>
            <Badge variant={isConfigured ? "default" : "destructive"}>
              {isConfigured ? "Configured" : "Not Configured"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">API Key</label>
            {isConfigured && !apiKey && (
              <p className="text-sm text-muted-foreground">
                Current key: <code className="text-xs">{maskedKey}</code>
              </p>
            )}
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                placeholder={isConfigured ? "Enter new key to update..." : "sk-..."}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Model</label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                <SelectItem value="gpt-4.1">gpt-4.1</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {message && (
            <p
              className={`text-sm ${
                message.type === "success"
                  ? "text-green-600"
                  : "text-destructive"
              }`}
            >
              {message.text}
            </p>
          )}

          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>

          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/50 p-3">
            <Shield className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Your API key is encrypted at rest using AES-256 (Fernet) before being stored in the database.
              It is never exposed in plaintext through the API.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
