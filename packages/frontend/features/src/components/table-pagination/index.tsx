"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@repo/frontend/ui";
import { useQueryState } from "../../hooks/use-query-state";

export function TablePagination({
  page,
  limit,
  total,
}: {
  page: number;
  limit: number;
  total: number;
}) {
  const t = useTranslations("table");
  const { setQuery, pending } = useQueryState();

  const pageCount = Math.max(1, Math.ceil(total / limit));
  const first = total === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <p className="text-muted-foreground text-sm" aria-live="polite">
        {total === 0 ? t("noResults") : t("showing", { first, last, total })}
      </p>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">
          {t("pageOf", { page, pageCount })}
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("previous")}
          disabled={pending || page <= 1}
          onClick={() => setQuery({ page: page - 1 })}
        >
          <ChevronLeft className="rtl:rotate-180" aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("next")}
          disabled={pending || page >= pageCount}
          onClick={() => setQuery({ page: page + 1 })}
        >
          <ChevronRight className="rtl:rotate-180" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
