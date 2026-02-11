"use client";

import { use, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Linkedin,
  Twitter,
  MapPin,
  CalendarDays,
  Users,
  DollarSign,
  AlertTriangle,
  Loader2,
  Trash2,
  Star,
  RefreshCw,
  Globe,
  MessageSquare,
  FileText,
  Database,
  Sparkles,
  Target,
  Building2,
  Zap,
  BrainCircuit,
  ShieldCheck,
  CircleAlert,
  CircleHelp,
  CheckCircle2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PipelineStatusBadge } from "@/components/companies/pipeline-status";
import { EditableField } from "@/components/companies/editable-field";
import { SourceCard } from "@/components/companies/source-card";
import { SocialPanel } from "@/components/companies/social-panel";
import { DigestView } from "@/components/companies/digest-view";
import { AddSourceDialog } from "@/components/companies/add-source-dialog";
import { SocialHandlesEditor } from "@/components/companies/social-handles-editor";
import { useCompany } from "@/hooks/use-company";
import { usePipelineStatus } from "@/hooks/use-pipeline-status";
import {
  deleteCompany,
  updateCompany,
  updateFounder,
  setPrimaryCompany,
  rerunEnrichment,
  incrementalUpdate,
  reanalyzeCompany,
  findPotentialClients,
} from "@/lib/api/companies";
import {
  EVENT_COLORS,
  EVENT_TYPE_LABELS,
  formatEventDate,
} from "@/lib/timeline-utils";
import type { EventType } from "@/types";

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { company, loading, error, refetch } = useCompany(id);
  const pipelineStatus = usePipelineStatus(id, company?.status);
  const [deleting, setDeleting] = useState(false);
  const [settingPrimary, setSettingPrimary] = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const [findingClients, setFindingClients] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      await reanalyzeCompany(id);
      setTimeout(() => {
        refetch();
        setReanalyzing(false);
      }, 3000);
    } catch {
      setReanalyzing(false);
    }
  };

  const handleIncrementalUpdate = async () => {
    setUpdating(true);
    try {
      await incrementalUpdate(id);
      setTimeout(() => {
        refetch();
        setUpdating(false);
      }, 3000);
    } catch {
      setUpdating(false);
    }
  };

  const handleFindPotentialClients = async () => {
    setFindingClients(true);
    try {
      await findPotentialClients(id);
      setTimeout(() => {
        refetch();
        setFindingClients(false);
      }, 5000);
    } catch {
      setFindingClients(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCompany(id);
      router.push("/companies");
    } catch {
      setDeleting(false);
    }
  };

  const handleSetPrimary = async () => {
    setSettingPrimary(true);
    try {
      await setPrimaryCompany(id);
      refetch();
    } catch {
      // ignore
    } finally {
      setSettingPrimary(false);
    }
  };

  const handleRerun = async () => {
    setRerunning(true);
    try {
      await rerunEnrichment(id);
      setTimeout(() => {
        refetch();
        setRerunning(false);
      }, 3000);
    } catch {
      setRerunning(false);
    }
  };

  const handleUpdateField = async (field: string, value: string) => {
    await updateCompany(id, { [field]: value });
    refetch();
  };

  const handleUpdateFounder = async (
    founderId: string,
    field: string,
    value: string
  ) => {
    await updateFounder(founderId, { [field]: value });
    refetch();
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">{error || "Company not found"}</p>
        <Button asChild variant="outline">
          <Link href="/companies">Back to Companies</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button asChild variant="ghost" size="icon" className="mt-1">
            <Link href="/companies">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{company.name}</h2>
              {company.is_primary && (
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">
                  <Star className="mr-1 h-3 w-3 fill-current" />
                  My Company
                </Badge>
              )}
              <PipelineStatusBadge status={pipelineStatus} />
            </div>
            {company.one_liner && (
              <p className="text-muted-foreground mt-1">{company.one_liner}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {company.hq_location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {company.hq_location}
                </span>
              )}
              {company.founded_year && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Founded {company.founded_year}
                </span>
              )}
              {company.employee_range && (
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {company.employee_range} employees
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!company.is_primary && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSetPrimary}
              disabled={settingPrimary}
            >
              {settingPrimary ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Star className="mr-2 h-3.5 w-3.5" />
              )}
              Set as My Company
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleIncrementalUpdate}
            disabled={updating}
          >
            {updating ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="mr-2 h-3.5 w-3.5" />
            )}
            Update Intel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReanalyze}
            disabled={reanalyzing}
          >
            {reanalyzing ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <BrainCircuit className="mr-2 h-3.5 w-3.5" />
            )}
            Re-Analyze
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRerun}
            disabled={rerunning}
          >
            {rerunning ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
            )}
            Rerun Analysis
          </Button>
          {company.domain && (
            <Button asChild variant="outline" size="sm">
              <a
                href={
                  company.domain.startsWith("http")
                    ? company.domain
                    : `https://${company.domain}`
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                Website
              </a>
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {company.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this company and all its data
                  including founders, funding rounds, events, and research
                  sources. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="founders">
            <Users className="mr-1.5 h-3.5 w-3.5" />
            Founders ({company.founders.length})
          </TabsTrigger>
          <TabsTrigger value="funding">
            <DollarSign className="mr-1.5 h-3.5 w-3.5" />
            Funding ({company.funding_rounds.length})
          </TabsTrigger>
          <TabsTrigger value="events">
            Events ({company.events.length})
          </TabsTrigger>
          <TabsTrigger value="products">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Products ({company.products?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="sources">
            <Database className="mr-1.5 h-3.5 w-3.5" />
            Sources ({company.data_sources?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="social">
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
            Social ({company.social_posts?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="digest">
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Digest ({company.digests?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
          <TabsTrigger value="clients">
            <Target className="mr-1.5 h-3.5 w-3.5" />
            Clients & ICP ({company.competitor_clients?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="data-quality">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            Data Quality
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <EditableField
                value={company.description}
                onSave={(v) => handleUpdateField("description", v)}
                placeholder="No description available. Click to add..."
                multiline
              />
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium mb-1">One-liner</p>
                  <EditableField
                    value={company.one_liner}
                    onSave={(v) => handleUpdateField("one_liner", v)}
                    placeholder="Add one-liner..."
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Stage</p>
                  <EditableField
                    value={company.stage}
                    onSave={(v) => handleUpdateField("stage", v)}
                    placeholder="Unknown"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Domain</p>
                  <EditableField
                    value={company.domain}
                    onSave={(v) => handleUpdateField("domain", v)}
                    placeholder="example.com"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">HQ Location</p>
                  <EditableField
                    value={company.hq_location}
                    onSave={(v) => handleUpdateField("hq_location", v)}
                    placeholder="City, Country"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Employee Range</p>
                  <EditableField
                    value={company.employee_range}
                    onSave={(v) => handleUpdateField("employee_range", v)}
                    placeholder="e.g. 11-50"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Categories</p>
                  <div className="flex flex-wrap gap-1">
                    {company.categories.length > 0 ? (
                      company.categories.map((cat) => (
                        <Badge
                          key={cat.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {cat.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        None assigned
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Founders Tab */}
        <TabsContent value="founders" className="space-y-4 mt-4">
          {company.founders.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No founder data available yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {company.founders.map((founder) => (
                <Card key={founder.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <EditableField
                          value={founder.name}
                          onSave={(v) =>
                            handleUpdateFounder(founder.id, "name", v)
                          }
                          className="font-semibold"
                        />
                        <EditableField
                          value={founder.title}
                          onSave={(v) =>
                            handleUpdateFounder(founder.id, "title", v)
                          }
                          placeholder="Add title..."
                          className="text-muted-foreground text-sm"
                        />
                      </div>
                      <div className="flex gap-1">
                        {founder.linkedin_url && (
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <a
                              href={founder.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Linkedin className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {founder.twitter_handle && (
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <a
                              href={`https://twitter.com/${founder.twitter_handle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Twitter className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <EditableField
                      value={founder.bio}
                      onSave={(v) =>
                        handleUpdateFounder(founder.id, "bio", v)
                      }
                      placeholder="Add bio..."
                      multiline
                    />
                    {founder.previous_companies &&
                      founder.previous_companies.length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-1">
                            Previous Companies
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {founder.previous_companies.map((co, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs"
                              >
                                {co}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    {founder.education && founder.education.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-1">Education</p>
                        <div className="flex flex-wrap gap-1">
                          {founder.education.map((edu, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs"
                            >
                              {edu}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Funding Tab */}
        <TabsContent value="funding" className="space-y-4 mt-4">
          {company.funding_rounds.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No funding data available yet.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium">Round</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Investors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {company.funding_rounds.map((round) => (
                        <tr key={round.id} className="border-b last:border-0">
                          <td className="py-3 font-medium">
                            {round.round_name}
                          </td>
                          <td className="py-3">
                            {round.amount_usd ? (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3.5 w-3.5" />
                                {(round.amount_usd / 1_000_000).toFixed(1)}M
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                Undisclosed
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {round.date
                              ? new Date(round.date).toLocaleDateString(
                                  "en-US",
                                  { year: "numeric", month: "short" }
                                )
                              : "Unknown"}
                          </td>
                          <td className="py-3">
                            <div className="flex flex-wrap gap-1">
                              {round.investors.map((inv) => (
                                <Badge
                                  key={inv.id}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {inv.name}
                                </Badge>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4 mt-4">
          {company.events.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No events recorded yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {company.events
                .sort(
                  (a, b) =>
                    new Date(b.event_date || 0).getTime() -
                    new Date(a.event_date || 0).getTime()
                )
                .map((event) => (
                  <Card key={event.id}>
                    <CardContent className="flex items-start gap-4 pt-4">
                      <div
                        className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            EVENT_COLORS[event.event_type as EventType] ||
                            "#94a3b8",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{event.title}</p>
                          <Badge variant="outline" className="text-xs">
                            {EVENT_TYPE_LABELS[
                              event.event_type as EventType
                            ] || event.event_type}
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground">
                            {event.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatEventDate(event.event_date)}
                          {event.source_url && (
                            <>
                              {" "}
                              &middot;{" "}
                              <a
                                href={event.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-foreground"
                              >
                                Source
                              </a>
                            </>
                          )}
                        </p>
                      </div>
                      {event.significance && (
                        <Badge
                          variant="secondary"
                          className="text-xs shrink-0"
                        >
                          {event.significance}/10
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4 mt-4">
          {!company.products || company.products.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No product data available yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {company.products.map((product) => (
                <Card key={product.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{product.name}</CardTitle>
                    {product.description && (
                      <CardDescription>{product.description}</CardDescription>
                    )}
                  </CardHeader>
                  {product.features && product.features.length > 0 && (
                    <CardContent>
                      <p className="text-xs font-medium mb-2">Features</p>
                      <div className="space-y-1">
                        {product.features.map((feat, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-sm"
                          >
                            <Sparkles className="h-3 w-3 mt-1 text-primary shrink-0" />
                            <span className="text-muted-foreground">
                              {feat}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {company.data_sources?.length || 0} research sources collected
            </p>
            <AddSourceDialog companyId={id} onSourceAdded={refetch} />
          </div>
          {!company.data_sources || company.data_sources.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Globe className="mx-auto h-8 w-8 mb-3" />
                <p>No sources yet. Add a custom source or run analysis.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {company.data_sources.map((source) => (
                <SourceCard key={source.id} source={source} onDeleted={refetch} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-4">
              <SocialHandlesEditor
                companyId={id}
                handles={company.social_handles}
                onUpdated={refetch}
              />
            </CardContent>
          </Card>
          <SocialPanel
            posts={company.social_posts || []}
            socialHandles={company.social_handles}
            onDeleted={refetch}
          />
        </TabsContent>

        {/* Digest Tab */}
        <TabsContent value="digest" className="space-y-4 mt-4">
          <DigestView
            companyId={id}
            digests={company.digests || []}
            onRegenerated={refetch}
          />
        </TabsContent>

        {/* Intelligence Tab */}
        <TabsContent value="intelligence" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Positioning Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {company.positioning_summary ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {company.positioning_summary}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Not available yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">GTM Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                {company.gtm_strategy ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {company.gtm_strategy}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Not available yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Media Tone</CardTitle>
              </CardHeader>
              <CardContent>
                {company.media_tone &&
                Object.keys(company.media_tone).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(company.media_tone).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="capitalize text-muted-foreground">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No media tone data available.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Topics</CardTitle>
              </CardHeader>
              <CardContent>
                {company.top_topics && company.top_topics.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {company.top_topics.map((topic, i) => (
                      <Badge key={i} variant="secondary">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No topic data available.
                  </p>
                )}
              </CardContent>
            </Card>

            {company.key_differentiators &&
              company.key_differentiators.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Key Differentiators
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {company.key_differentiators.map((diff, i) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground flex items-start gap-2"
                        >
                          <span className="text-primary mt-0.5">&#x2022;</span>
                          {diff}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

            {company.risk_signals && company.risk_signals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Risk Signals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {company.risk_signals.map((risk, i) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-amber-500 mt-0.5">&#x26A0;</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Clients & ICP Tab */}
        <TabsContent value="clients" className="space-y-4 mt-4">
          {/* Known Clients */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Known Clients
              </CardTitle>
              <CardDescription>
                Clients identified from case studies, testimonials, and web sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!company.competitor_clients || company.competitor_clients.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  No client data available yet. Run analysis to discover clients.
                </p>
              ) : (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium">Client</th>
                        <th className="pb-3 font-medium">Industry</th>
                        <th className="pb-3 font-medium">Region</th>
                        <th className="pb-3 font-medium">Size</th>
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {company.competitor_clients.map((client) => (
                        <tr key={client.id} className="border-b last:border-0">
                          <td className="py-3 font-medium">
                            {client.client_domain ? (
                              <a
                                href={`https://${client.client_domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                {client.client_name}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              client.client_name
                            )}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {client.industry || "—"}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {client.region || "—"}
                          </td>
                          <td className="py-3">
                            {client.company_size ? (
                              <Badge variant="outline" className="text-xs capitalize">
                                {client.company_size}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-3">
                            <Badge
                              variant="secondary"
                              className="text-xs capitalize"
                            >
                              {client.relationship_type}
                            </Badge>
                          </td>
                          <td className="py-3">
                            {client.confidence && (
                              <Badge
                                variant="outline"
                                className={`text-xs capitalize ${
                                  client.confidence === "high"
                                    ? "border-green-300 text-green-700"
                                    : client.confidence === "medium"
                                    ? "border-amber-300 text-amber-700"
                                    : "border-gray-300 text-gray-600"
                                }`}
                              >
                                {client.confidence}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ICP Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ICP Analysis</CardTitle>
              <CardDescription>
                Ideal Customer Profile derived from client intelligence
              </CardDescription>
            </CardHeader>
            <CardContent>
              {company.icp_analysis ? (
                <div className="space-y-4">
                  {company.icp_analysis.buyer_persona && (
                    <div>
                      <p className="text-sm font-medium mb-1">Buyer Persona</p>
                      <p className="text-sm text-muted-foreground">
                        {company.icp_analysis.buyer_persona}
                      </p>
                    </div>
                  )}
                  {company.icp_analysis.target_segments?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Target Segments</p>
                      <div className="flex flex-wrap gap-1">
                        {company.icp_analysis.target_segments.map((seg: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {seg}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {company.icp_analysis.ideal_company_size && (
                    <div>
                      <p className="text-sm font-medium mb-1">Ideal Company Size</p>
                      <p className="text-sm text-muted-foreground">
                        {company.icp_analysis.ideal_company_size}
                      </p>
                    </div>
                  )}
                  {company.icp_analysis.ideal_industries?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Ideal Industries</p>
                      <div className="flex flex-wrap gap-1">
                        {company.icp_analysis.ideal_industries.map((ind: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {ind}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {company.icp_analysis.pain_points?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Pain Points Addressed</p>
                      <ul className="space-y-1">
                        {company.icp_analysis.pain_points.map((pp: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-0.5">&#x2022;</span>
                            {pp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {company.icp_analysis.buying_criteria?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Buying Criteria</p>
                      <ul className="space-y-1">
                        {company.icp_analysis.buying_criteria.map((bc: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-0.5">&#x2022;</span>
                            {bc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  No ICP analysis available yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Geography & Industry */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Geography
                </CardTitle>
              </CardHeader>
              <CardContent>
                {company.geography_analysis ? (
                  <div className="space-y-3">
                    {company.geography_analysis.hq_region && (
                      <div>
                        <p className="text-sm font-medium mb-1">HQ Region</p>
                        <p className="text-sm text-muted-foreground">
                          {company.geography_analysis.hq_region}
                        </p>
                      </div>
                    )}
                    {company.geography_analysis.primary_markets?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Primary Markets</p>
                        <div className="flex flex-wrap gap-1">
                          {company.geography_analysis.primary_markets.map((m: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {m}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {company.geography_analysis.expansion_markets?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Expansion Markets</p>
                        <div className="flex flex-wrap gap-1">
                          {company.geography_analysis.expansion_markets.map((m: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {m}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {company.geography_analysis.market_presence_notes && (
                      <div>
                        <p className="text-sm font-medium mb-1">Notes</p>
                        <p className="text-sm text-muted-foreground">
                          {company.geography_analysis.market_presence_notes}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-4">
                    No geography data available.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Industry Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                {company.industry_focus ? (
                  <div className="space-y-3">
                    {company.industry_focus.primary_industries?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Primary Industries</p>
                        <div className="flex flex-wrap gap-1">
                          {company.industry_focus.primary_industries.map((ind: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {ind}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {company.industry_focus.secondary_industries?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Secondary Industries</p>
                        <div className="flex flex-wrap gap-1">
                          {company.industry_focus.secondary_industries.map((ind: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {ind}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {company.industry_focus.vertical_strength && (
                      <div>
                        <p className="text-sm font-medium mb-1">Vertical Strength</p>
                        <p className="text-sm text-muted-foreground">
                          {company.industry_focus.vertical_strength}
                        </p>
                      </div>
                    )}
                    {company.industry_focus.industry_notes && (
                      <div>
                        <p className="text-sm font-medium mb-1">Notes</p>
                        <p className="text-sm text-muted-foreground">
                          {company.industry_focus.industry_notes}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-4">
                    No industry focus data available.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Potential Clients (primary company only) */}
          {company.is_primary && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Potential Clients
                    </CardTitle>
                    <CardDescription>
                      Research potential clients for {company.name} based on competitor intelligence
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFindPotentialClients}
                    disabled={findingClients}
                  >
                    {findingClients ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Target className="mr-2 h-3.5 w-3.5" />
                    )}
                    Find Potential Clients
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const potentialDigest = company.digests?.find(
                    (d) => d.digest_type === "potential_clients"
                  );
                  if (potentialDigest) {
                    return (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {potentialDigest.digest_markdown}
                        </ReactMarkdown>
                      </div>
                    );
                  }
                  return (
                    <p className="text-sm text-muted-foreground italic text-center py-4">
                      No potential clients research yet. Click &quot;Find Potential Clients&quot; to start.
                    </p>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Data Quality Tab */}
        <TabsContent value="data-quality" className="space-y-4 mt-4">
          {company.crosscheck_result ? (
            <>
              {/* Confidence Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Data Confidence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold">
                      {Math.round(company.crosscheck_result.confidence_score * 100)}%
                    </div>
                    <div className="flex-1">
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            company.crosscheck_result.confidence_score >= 0.7
                              ? "bg-green-500"
                              : company.crosscheck_result.confidence_score >= 0.4
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${company.crosscheck_result.confidence_score * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Based on {company.crosscheck_result.validated_facts.length} validated facts across multiple sources
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              {company.crosscheck_result.consolidated_summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">360° Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {company.crosscheck_result.consolidated_summary}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {/* Contradictions */}
                {company.crosscheck_result.contradictions.length > 0 && (
                  <Card className="border-amber-200 dark:border-amber-800">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <CircleAlert className="h-4 w-4 text-amber-500" />
                        Contradictions ({company.crosscheck_result.contradictions.length})
                      </CardTitle>
                      <CardDescription>
                        Conflicting data found across sources
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {company.crosscheck_result.contradictions.map((c, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-amber-500 mt-0.5 shrink-0">&#x26A0;</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Data Gaps */}
                {company.crosscheck_result.data_gaps.length > 0 && (
                  <Card className="border-blue-200 dark:border-blue-800">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <CircleHelp className="h-4 w-4 text-blue-500" />
                        Data Gaps ({company.crosscheck_result.data_gaps.length})
                      </CardTitle>
                      <CardDescription>
                        Important information we couldn&apos;t confirm
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {company.crosscheck_result.data_gaps.map((g, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5 shrink-0">?</span>
                            {g}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Validated Facts */}
                {company.crosscheck_result.validated_facts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Validated Facts ({company.crosscheck_result.validated_facts.length})
                      </CardTitle>
                      <CardDescription>
                        Confirmed by multiple independent sources
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {company.crosscheck_result.validated_facts.map((f, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-green-500 mt-0.5 shrink-0">&#x2713;</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                {company.crosscheck_result.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4 text-purple-500" />
                        Recommendations ({company.crosscheck_result.recommendations.length})
                      </CardTitle>
                      <CardDescription>
                        Actions to improve data quality
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {company.crosscheck_result.recommendations.map((r, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-purple-500 mt-0.5 shrink-0">&#x2192;</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No data quality analysis yet. Run enrichment or re-analyze to generate a 360° crosscheck.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
