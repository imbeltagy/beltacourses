import type { DateTimeFormatOptions } from "next-intl";

/**
 * The table date style, e.g. "07 Mar 2026" / "٠٧ مارس ٢٠٢٦". The zone is not
 * set here — it is pinned to UTC once in the request config, so server and
 * browser agree.
 */
export const DATE_FORMAT: DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
};
