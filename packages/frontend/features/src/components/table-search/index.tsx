"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@repo/frontend/ui";
import { useQueryState } from "../../hooks/use-query-state";

const DEBOUNCE_MS = 350;

export function TableSearch({
  placeholder,
  label,
}: {
  placeholder?: string;
  label?: string;
}) {
  const t = useTranslations("table");
  const { searchParams, setQuery } = useQueryState();
  const urlValue = searchParams.get("search") ?? "";
  const [value, setValue] = useState(urlValue);

  // Keeps the box in step when the URL changes from elsewhere (back button,
  // a cleared filter) without fighting the user mid-type.
  const typing = useRef(false);
  useEffect(() => {
    if (!typing.current) setValue(urlValue);
  }, [urlValue]);

  useEffect(() => {
    if (value === urlValue) return;

    const timer = setTimeout(() => {
      typing.current = false;
      setQuery({ search: value || undefined });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value, urlValue, setQuery]);

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search
        className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <Input
        type="search"
        aria-label={label ?? t("search")}
        placeholder={placeholder ?? t("search")}
        className="ps-9"
        value={value}
        onChange={(event) => {
          typing.current = true;
          setValue(event.target.value);
        }}
      />
    </div>
  );
}
