"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  Shield,
  User,
  RefreshCw,
  Clock,
} from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  fetchSettings,
  updateSettings,
  triggerUpdateNow,
} from "@/lib/api/settings";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function SettingsPage() {
  const [founderName, setFounderName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [maskedKey, setMaskedKey] = useState("");
  const [model, setModel] = useState("gpt-5.2");
  const [isConfigured, setIsConfigured] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Auto-update state
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false);
  const [autoUpdateHour, setAutoUpdateHour] = useState(7);
  const [lastDailyUpdate, setLastDailyUpdate] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    fetchSettings()
      .then((data) => {
        setFounderName(data.founder_name);
        setOrgName(data.org_name);
        setMaskedKey(data.openai_api_key_masked);
        setModel(data.openai_model);
        setIsConfigured(data.is_configured);
        setAutoUpdateEnabled(data.auto_update_enabled);
        setAutoUpdateHour(data.auto_update_hour);
        setLastDailyUpdate(data.last_daily_update);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const update: {
        founder_name?: string;
        org_name?: string;
        openai_api_key?: string;
        openai_model?: string;
        auto_update_enabled?: boolean;
        auto_update_hour?: number;
      } = {
        founder_name: founderName,
        org_name: orgName,
        openai_model: model,
        auto_update_enabled: autoUpdateEnabled,
        auto_update_hour: autoUpdateHour,
      };
      if (apiKey) {
        update.openai_api_key = apiKey;
      }
      const data = await updateSettings(update);
      setMaskedKey(data.openai_api_key_masked);
      setIsConfigured(data.is_configured);
      setAutoUpdateEnabled(data.auto_update_enabled);
      setAutoUpdateHour(data.auto_update_hour);
      setLastDailyUpdate(data.last_daily_update);
      setApiKey("");
      setMessage({ type: "success", text: "Settings saved successfully." });
    } catch {
      setMessage({ type: "error", text: "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNow = async () => {
    setTriggering(true);
    try {
      await triggerUpdateNow();
      setMessage({
        type: "success",
        text: "Update triggered. Companies will be refreshed in the background.",
      });
    } catch {
      setMessage({ type: "error", text: "Failed to trigger update." });
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const formatHour = (h: number) => {
    const period = h >= 12 ? "PM" : "AM";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${display}:00 ${period}`;
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Your name and organization. Used for the dashboard welcome and
                investor reports.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Name</label>
            <Input
              placeholder="e.g. Jane Doe"
              value={founderName}
              onChange={(e) => setFounderName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Organization</label>
            <Input
              placeholder="e.g. Acme Inc."
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>OpenAI Configuration</CardTitle>
                <CardDescription>
                  API key and model for intelligence pipelines.
                </CardDescription>
              </div>
            </div>
            <Badge variant={isConfigured ? "default" : "destructive"}>
              {isConfigured ? "Configured" : "Not Configured"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
                placeholder={
                  isConfigured ? "Enter new key to update..." : "sk-..."
                }
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
                <SelectItem value="gpt-5.2">gpt-5.2 — flagship (recommended)</SelectItem>
                <SelectItem value="gpt-5.2-pro">gpt-5.2-pro — max quality</SelectItem>
                <SelectItem value="gpt-5.1">gpt-5.1 — balanced</SelectItem>
                <SelectItem value="gpt-5-mini">gpt-5-mini — fast & cheap</SelectItem>
                <SelectItem value="gpt-5-nano">gpt-5-nano — fastest, cheapest</SelectItem>
                <SelectItem value="gpt-4.1">gpt-4.1 — legacy, 1M context</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/50 p-3">
            <Shield className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Your API key is encrypted at rest using AES-256 (Fernet) before
              being stored in the database. It is never exposed in plaintext
              through the API.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Update */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Auto-Update</CardTitle>
                <CardDescription>
                  Keep intelligence fresh with daily automatic updates.
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={autoUpdateEnabled}
              onCheckedChange={setAutoUpdateEnabled}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Update Time (UTC)</label>
            <Select
              value={String(autoUpdateHour)}
              onValueChange={(v) => setAutoUpdateHour(Number(v))}
              disabled={!autoUpdateEnabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOURS.map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {formatHour(h)} UTC
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              founderOS will run an incremental update for all tracked companies
              at this time every day.
            </p>
          </div>

          {lastDailyUpdate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>
                Last update:{" "}
                {new Date(lastDailyUpdate).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleUpdateNow}
            disabled={triggering || !isConfigured}
          >
            {triggering ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
            )}
            Update Now
          </Button>
        </CardContent>
      </Card>

      {message && (
        <p
          className={`text-sm ${
            message.type === "success" ? "text-green-600" : "text-destructive"
          }`}
        >
          {message.text}
        </p>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Settings
      </Button>
    </div>
  );
}
