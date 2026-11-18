"use client";

import { useState, useCallback, useEffect, useRef } from "react";

import type { Brief, PipelineStatus } from "../types/brief";
import {
  getAIJob,
  getBriefs,
  getBriefDetail,
  updatePipelineStatus,
  retryAiProcessing,
} from "../api/internal-briefs.api";
import type { BriefFilters } from "../schemas/internal-briefs";
import { getApiErrorMessage } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MoreHorizontal, Loader2, AlertCircle, RefreshCw, ChevronLeft, ChevronRight,
} from "lucide-react";

const CATEGORY_OPTIONS = [
  "Branding",
  "Website",
  "Mobile App",
  "AI Automation",
  "Social Media",
  "Lainnya",
] as const;

const PRIORITY_OPTIONS = ["High", "Medium", "Low"] as const;

const AI_STATUS_OPTIONS = ["PENDING", "COMPLETED", "FAILED"] as const;

const PIPELINE_STATUS_OPTIONS: PipelineStatus[] = [
  "NEW",
  "CONTACTED",
  "PROPOSAL",
  "WON",
  "LOST",
];

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

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
  const [filters, setFilters] = useState<BriefFilters>({ page: 1, limit: 10 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [jobStatus, setJobStatus] = useState<{
    status: string;
    attempts: number;
    errorMessage: string | null;
  } | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBriefs = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getBriefs(filters);
      setBriefs(data.data);
      setPage(data.page);
      setPageSize(data.limit);
      setTotal(data.total);
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
      if (
        brief.aiResult &&
        brief.aiResult.aiStatus === "PENDING"
      ) {
        startPolling(id);
      }
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
      startPolling(id);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    }
  };

  const startPolling = (id: string) => {
    stopPolling();
    pollIntervalRef.current = setInterval(async () => {
      try {
        const job = await getAIJob(id);
        setJobStatus({
          status: job.status,
          attempts: job.attempts,
          errorMessage: job.errorMessage,
        });
        if (job.status === "COMPLETED" || job.status === "FAILED") {
          stopPolling();
          await openDetail(id);
        }
      } catch {
        stopPolling();
      }
    }, 2000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setJobStatus(null);
  };

  const applyFilters = (next: Partial<BriefFilters>) => {
    setFilters({ ...filters, ...next });
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 10 });
    setPage(1);
    setPageSize(10);
    setTotal(0);
  };

  useEffect(() => {
    fetchBriefs();
  }, [fetchBriefs]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

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
              <select
                value={filters.category ?? ""}
                onChange={(e) =>
                  applyFilters({
                    category: (e.target.value ||
                      undefined) as BriefFilters["category"],
                  })
                }
                className="h-10 w-full min-w-0 border border-transparent border-b-input bg-transparent px-0 py-1 text-base transition-[color,border-color] outline-none focus-visible:border-b-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              >
                <option value="">All categories</option>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filters.priority ?? ""}
                onChange={(e) =>
                  applyFilters({
                    priority: (e.target.value ||
                      undefined) as BriefFilters["priority"],
                  })
                }
                className="h-10 w-full min-w-0 border border-transparent border-b-input bg-transparent px-0 py-1 text-base transition-[color,border-color] outline-none focus-visible:border-b-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              >
                <option value="">All priorities</option>
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filters.aiStatus ?? ""}
                onChange={(e) =>
                  applyFilters({
                    aiStatus: (e.target.value ||
                      undefined) as BriefFilters["aiStatus"],
                  })
                }
                className="h-10 w-full min-w-0 border border-transparent border-b-input bg-transparent px-0 py-1 text-base transition-[color,border-color] outline-none focus-visible:border-b-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              >
                <option value="">All AI statuses</option>
                {AI_STATUS_OPTIONS.map((aiStatus) => (
                  <option key={aiStatus} value={aiStatus}>
                    {aiStatus}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filters.pipelineStatus ?? ""}
                onChange={(e) =>
                  applyFilters({
                    pipelineStatus: (e.target.value ||
                      undefined) as BriefFilters["pipelineStatus"],
                  })
                }
                className="h-10 w-full min-w-0 border border-transparent border-b-input bg-transparent px-0 py-1 text-base transition-[color,border-color] outline-none focus-visible:border-b-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              >
                <option value="">All pipeline statuses</option>
                {PIPELINE_STATUS_OPTIONS.map((pipelineStatus) => (
                  <option key={pipelineStatus} value={pipelineStatus}>
                    {pipelineStatus}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Page size</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const size = Number(e.target.value);
                  setPageSize(size);
                  setPage(1);
                  setFilters({ ...filters, page: 1, limit: size });
                }}
                className="h-7 w-16 text-xs border border-input bg-transparent px-1 py-0 outline-none focus-visible:border-ring"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
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

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-medium">
                {briefs.length > 0 ? (page - 1) * pageSize + 1 : 0}
              </span>{" "}
              to{" "}
              <span className="font-medium">{Math.min(page * pageSize, total)}</span>{" "}
              of {total} briefs
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const next = page - 1;
                  setPage(next);
                  setFilters({ ...filters, page: next });
                }}
                disabled={page <= 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {page} / {Math.max(1, Math.ceil(total / pageSize))}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const next = page + 1;
                  setPage(next);
                  setFilters({ ...filters, page: next });
                }}
                disabled={
                  page >= Math.max(1, Math.ceil(total / pageSize)) || isLoading
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {briefs.length} brief(s)
          </span>
        </CardFooter>
      </Card>

      {selectedBrief && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              stopPolling();
              setSelectedBrief(null);
            }}
          />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 bg-card border border-border rounded-xl shadow-xl p-6 flex flex-col gap-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="brief-detail-title"
          >
            <div className="flex flex-row items-center justify-between">
              <h2 id="brief-detail-title" className="text-lg font-bold">
                Brief detail
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  stopPolling();
                  setSelectedBrief(null);
                }}
              >
                ✕
              </Button>
            </div>

            {jobStatus && (
              <div className="flex items-center gap-2 mb-2 p-3 rounded-lg bg-muted/50 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  AI processing: {jobStatus.status.toLowerCase()} (
                  attempt {jobStatus.attempts})
                  {jobStatus.errorMessage && (
                    <>
                      — {jobStatus.errorMessage}
                    </>
                  )}
                </span>
              </div>
            )}

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
                {selectedBrief.aiResult.priorityReason && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Priority reason
                    </p>
                    <p className="text-sm">
                      {selectedBrief.aiResult.priorityReason}
                    </p>
                  </div>
                )}
                {selectedBrief.aiResult.aiErrorMessage && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      AI error message
                    </p>
                    <p className="text-sm text-destructive">
                      {selectedBrief.aiResult.aiErrorMessage}
                    </p>
                  </div>
                )}
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
          </div>
        </>
      )}
    </div>
  );
}
