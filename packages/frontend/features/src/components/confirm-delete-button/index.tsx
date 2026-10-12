"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@repo/frontend/ui";

/**
 * Two-step delete: the first click arms it, the second confirms. There is no
 * modal primitive in the design system, and an inline confirm keeps the page
 * free of browser `confirm()` dialogs.
 */
export function ConfirmDeleteButton({
  label,
  onConfirm,
}: {
  label: string;
  /** Resolves once the delete finished, successfully or not. */
  onConfirm: () => Promise<void>;
}) {
  const t = useTranslations("common");
  const [armed, setArmed] = useState(false);
  const [pending, setPending] = useState(false);

  if (!armed) {
    return (
      <Button variant="outline" onClick={() => setArmed(true)}>
        <Trash2 aria-hidden="true" />
        {label}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="destructive"
        loading={pending}
        onClick={async () => {
          setPending(true);
          await onConfirm();
          setPending(false);
          setArmed(false);
        }}
      >
        {t("confirmDelete")}
      </Button>
      <Button
        variant="ghost"
        disabled={pending}
        onClick={() => setArmed(false)}
      >
        {t("cancel")}
      </Button>
    </div>
  );
}
