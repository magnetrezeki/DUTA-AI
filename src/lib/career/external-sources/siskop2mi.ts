import "server-only";

import type { ExternalJobSourceAdapter } from "./types";

export const siskop2miAdapter: ExternalJobSourceAdapter = {
  key: "siskop2mi",
  sourceName: "SISKOP2MI",
  authorized: false,
  async fetchJobs() {
    throw new Error(
      "Integrasi SISKOP2MI belum diaktifkan. Diperlukan feed atau API resmi yang diizinkan; scraping tidak digunakan.",
    );
  },
};
