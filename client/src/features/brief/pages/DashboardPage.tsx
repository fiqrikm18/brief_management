"use client";

import { useState, useCallback } from "react";

import type { Brief, PipelineStatus } from "../types/brief";
import {
  getBriefs,
  getBriefDetail,
  updatePipelineStatus,
  retryAiProcessing,
} from "../api/internal-briefs.api";
import type { BriefFilters } from "../schemas/internal-briefs";
import { getApiErrorMessage } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MoreHorizontal, Loader2, AlertCircle, RefreshCw, ArrowLeft,
} from "lucide-react";

const PIPELINE_STATUS_OPTIONS: PipelineStatus[] = [
  "NEW",
  "CONTACTED",
  "PROPOSAL",
  "WON",
  "LOST",
];

function formatDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status: string): React.ReactNode {
  const variants: Record<string, string> = {
    NEW: "bg-muted text-muted-foreground",
    CONTACTED: "bg-blue-100 text-blue-700",
    PROPOSAL: "bg-purple-100 text-purple-700",
    WON: "bg-emerald-100 text-emerald-700",
    LOST: "bg-rose-100 text-rose-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${variants[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}

export function DashboardPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filters, setFilters] = useState<BriefFilters>({});

  const fetchBriefs = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getBriefs(filters);
      setBriefs(data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const brief = await getBriefDetail(id);
      setSelectedBrief(brief);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: PipelineStatus,
  ) => {
    try {
      const updated = await updatePipelineStatus(id, {
        pipelineStatus: status,
      });
      setBriefs((prev) =>
        prev.map((b) => (b.id === id ? updated : b)),
      );
      if (selectedBrief?.id === id) {
        setSelectedBrief(updated);
      }
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    }
  };

  const handleRetryAi = async (id: string) => {
    try {
      const updated = await retryAiProcessing(id, { aiProvider: "google" });
      setBriefs((prev) =>
        prev.map((b) => (b.id === id ? updated : b)),
      );
      if (selectedBrief?.id === id) {
        setSelectedBrief(updated);
      }
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    }
  };

  const applyFilters = (next: Partial<BriefFilters>) => {
    setFilters({ ...filters, ...next });
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Dashboard</CardTitle>
          <CardDescription>
            Manage your project briefs and track pipeline progress.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage ? (
            <div
              role="alert"
              className="flex items-start gap-2 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Filter by category"
                value={filters.category ?? ""}
                onChange={(e) =>
                  applyFilters({
                    category: (e.target.value ||
                      undefined) as BriefFilters["category"],
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Filter by priority"
                value={filters.priority ?? ""}
                onChange={(e) =>
                  applyFilters({
                    priority: (e.target.value ||
                      undefined) as BriefFilters["priority"],
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Filter by AI status"
                value={filters.aiStatus ?? ""}
                onChange={(e) =>
                  applyFilters({
                    aiStatus: (e.target.value ||
                      undefined) as BriefFilters["aiStatus"],
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Filter by pipeline status"
                value={filters.pipelineStatus ?? ""}
                onChange={(e) =>
                  applyFilters({
                    pipelineStatus: (e.target.value ||
                      undefined) as BriefFilters["pipelineStatus"],
                  })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button
              onClick={fetchBriefs}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
            {Object.keys(filters).length > 0 && (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-3 font-medium">Brief</th>
                  <th className="pb-3 font-medium">Client</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Priority</th>
                  <th className="pb-3 font-medium">Pipeline</th>
                  <th className="pb-3 font-medium">AI status</th>
                  <th className="pb-3 font-medium text-right">Created</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {briefs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="h-24 text-center text-muted-foreground">
                      No briefs found.
                    </td>
                  </tr>
                )}
                {briefs.map((brief) => (
                  <tr
                    key={brief.id}
                    className="border-b hover:bg-muted/50 cursor-pointer group"
                    onClick={() => openDetail(brief.id)}
                  >
                    <td className="py-3">
                      {brief.companyName} — {brief.requirements.slice(0, 60)}{
                        brief.requirements.length > 60 ? "…" : ""
                      }
                    </td>
                    <td className="py-3">{brief.clientName}</td>
                    <td className="py-3 text-muted-foreground">
                      {brief.aiResult?.serviceCategory ?? "—"}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {brief.aiResult?.priority ?? "—"}
                    </td>
                    <td className="py-3">{statusBadge(brief.pipelineStatus)}</td>
                    <td className="py-3 text-muted-foreground">
                      {brief.aiResult?.aiStatus ?? "—"}
                    </td>
                    <td className="py-3 text-right text-muted-foreground">
                      {formatDate(brief.createdAt)}
                    </td>
                    <td className="py-3 text-right">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {briefs.length} brief(s)
          </span>
        </CardFooter>
      </Card>

      {selectedBrief && (
        <Card className="max-w-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-bold">Brief detail</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedBrief(null)}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage ? (
              <div
                role="alert"
                className="flex items-start gap-2 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Company
                </p>
                <p className="text-sm">{selectedBrief.companyName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Client
                </p>
                <p className="text-sm">{selectedBrief.clientName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Email
                </p>
                <p className="text-sm">{selectedBrief.clientEmail}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Budget
                </p>
                <p className="text-sm">{selectedBrief.budgetRange}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Requirements
              </p>
              <p className="text-sm">{selectedBrief.requirements}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Pipeline status
              </p>
              <div className="flex items-center gap-2">
                {PIPELINE_STATUS_OPTIONS.map((status) => (
                  <Button
                    key={status}
                    variant={
                      selectedBrief.pipelineStatus === status
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      handleUpdateStatus(selectedBrief.id, status)
                    }
                    disabled={detailLoading}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>

            {selectedBrief.aiResult && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    AI status
                  </p>
                  <span className="text-xs text-muted-foreground capitalize">
                    {selectedBrief.aiResult.aiStatus}
                  </span>
                </div>
                {selectedBrief.aiResult.aiSummary && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      AI summary
                    </p>
                    <p className="text-sm">
                      {selectedBrief.aiResult.aiSummary}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    Service category
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {selectedBrief.aiResult.serviceCategory ?? "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    Priority
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {selectedBrief.aiResult.priority ?? "—"}
                  </span>
                </div>
                <Button
                  onClick={() => handleRetryAi(selectedBrief.id)}
                  disabled={
                    detailLoading ||
                    selectedBrief.aiResult.aiStatus === "PENDING"
                  }
                  className="flex items-center gap-2 w-auto"
                >
                  {detailLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Retry AI
                </Button>
              </div>
            )}

            <div className="space-y-1 pt-2">
              <p className="text-xs font-medium text-muted-foreground">
                Created
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDate(selectedBrief.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
