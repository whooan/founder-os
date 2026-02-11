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
} from "lucide-react";
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
import { useCompany } from "@/hooks/use-company";
import { usePipelineStatus } from "@/hooks/use-pipeline-status";
import { deleteCompany } from "@/lib/api/companies";
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
  const { company, loading, error } = useCompany(id);
  const pipelineStatus = usePipelineStatus(id, company?.status);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCompany(id);
      router.push("/companies");
    } catch {
      setDeleting(false);
    }
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
          {company.domain && (
            <Button asChild variant="outline" size="sm">
              <a
                href={`https://${company.domain}`}
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
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
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
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="founders">
            Founders ({company.founders.length})
          </TabsTrigger>
          <TabsTrigger value="funding">
            Funding ({company.funding_rounds.length})
          </TabsTrigger>
          <TabsTrigger value="events">
            Events ({company.events.length})
          </TabsTrigger>
          <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {company.description ? (
                <p className="text-sm leading-relaxed">{company.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No description available yet.
                </p>
              )}
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Stage</p>
                  <p className="text-sm text-muted-foreground">
                    {company.stage || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Domain</p>
                  <p className="text-sm text-muted-foreground">
                    {company.domain || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Categories</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {company.categories.length > 0 ? (
                      company.categories.map((cat) => (
                        <Badge key={cat.id} variant="secondary" className="text-xs">
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
                      <div>
                        <CardTitle className="text-base">
                          {founder.name}
                        </CardTitle>
                        {founder.title && (
                          <CardDescription>{founder.title}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {founder.linkedin_url && (
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
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
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
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
                    {founder.bio && (
                      <p className="text-sm text-muted-foreground">
                        {founder.bio}
                      </p>
                    )}
                    {founder.previous_companies && founder.previous_companies.length > 0 && (
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
                                  {
                                    year: "numeric",
                                    month: "short",
                                  }
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
                            {EVENT_TYPE_LABELS[event.event_type as EventType] ||
                              event.event_type}
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
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {event.significance}/10
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        {/* Intelligence Tab */}
        <TabsContent value="intelligence" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
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
                          {key}
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
