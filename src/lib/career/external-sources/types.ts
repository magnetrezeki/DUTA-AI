import "server-only";

export type ExternalJobRecord = {
  externalId: string;
  title: string;
  description: string;
  location: string;
  employmentType: "full_time" | "part_time" | "contract" | "temporary" | "internship";
  originalUrl: string;
  lastCheckedAt: string;
  deadline: string | null;
};

export interface ExternalJobSourceAdapter {
  readonly key: string;
  readonly sourceName: string;
  readonly authorized: boolean;
  fetchJobs(): Promise<ExternalJobRecord[]>;
}
