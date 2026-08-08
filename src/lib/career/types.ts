export type EmployerStatus = "pending" | "verified" | "rejected" | "suspended";
export type JobStatus = "draft" | "pending" | "published" | "rejected" | "closed";
export type ApplicationStatus = "submitted" | "reviewing" | "shortlisted" | "interview" | "offered" | "rejected" | "withdrawn";

export type JobSummary = {
  id: string;
  employer_id: string | null;
  title: string;
  location_text: string;
  employment_type: string;
  salary_text: string | null;
  deadline: string | null;
  source_type: "internal" | "external";
  original_url: string | null;
  created_at: string;
};
