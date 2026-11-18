export type PipelineStatus =
  | "NEW"
  | "CONTACTED"
  | "PROPOSAL"
  | "WON"
  | "LOST";

export type AiStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface MissingInfoItem {
  id: string;
  aiResultId: string;
  itemText: string;
}

export interface AiResult {
  id: string;
  briefId: string;
  aiStatus: AiStatus;
  aiSummary: string | null;
  serviceCategory: string | null;
  priority: string | null;
  priorityReason: string | null;
  aiErrorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  missingInfos: MissingInfoItem[];
}

export interface Brief {
  id: string;
  clientName: string;
  clientEmail: string;
  companyName: string;
  requirements: string;
  budgetRange: string;
  targetTimeline: string;
  pipelineStatus: PipelineStatus;
  createdAt: string;
  updatedAt: string;
  aiResult: AiResult | null;
}
