import "server-only";

import { siskop2miAdapter } from "./siskop2mi";

export const externalJobSourceAdapters = {
  siskop2mi: siskop2miAdapter,
} as const;
