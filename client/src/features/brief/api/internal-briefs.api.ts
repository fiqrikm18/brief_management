import { api } from "@/lib/api";

import type { Brief } from "../types/brief";
import type {
  BriefFilters,
  PipelineStatusUpdate,
  RetryAiRequest,
} from "../schemas/internal-briefs";

export interface BriefsListResponse {
  data: Brief[];
  page: number;
  limit: number;
  total: number;
}

export async function getBriefs(
  filters?: BriefFilters,
): Promise<BriefsListResponse> {
  const response = await api.get<BriefsListResponse>("/internal/briefs", {
    params: filters,
  });

  return response.data;
}

export async function getBriefDetail(id: string): Promise<Brief> {
  const response = await api.get<Brief>(`/internal/briefs/${id}`);

  return response.data;
}

export async function updatePipelineStatus(
  id: string,
  values: PipelineStatusUpdate,
): Promise<Brief> {
  const response = await api.patch<Brief>(
    `/internal/briefs/${id}/pipeline-status`,
    values,
  );

  return response.data;
}

export async function retryAiProcessing(
  briefId: string,
  values: RetryAiRequest,
): Promise<Brief> {
  const response = await api.post<Brief>(
    `/internal/briefs/${briefId}/retry-ai`,
    values,
  );

  return response.data;
}
