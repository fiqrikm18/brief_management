import { api } from "@/lib/api";

import type { CreateBriefFormValues } from "../schemas/brief";
import type { Brief } from "../types/brief";

export interface CreateBriefPayload {
  clientName: string;
  clientEmail: string;
  companyName: string;
  requirements: string;
  budgetRange: string;
  targetTimeline: string;
}

function toIsoDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export async function createBrief(
  values: CreateBriefFormValues,
): Promise<Brief> {
  const payload: CreateBriefPayload = {
    clientName: values.clientName,
    clientEmail: values.clientEmail,
    companyName: values.companyName,
    requirements: values.requirements,
    budgetRange: values.budgetRange,
    targetTimeline: toIsoDate(values.targetTimeline),
  };

  const response = await api.post<Brief>("/briefs", payload);

  return response.data;
}
