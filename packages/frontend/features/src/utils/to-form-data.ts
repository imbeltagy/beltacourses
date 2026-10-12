type FormValue = string | boolean | File | null | undefined;

/**
 * Builds the multipart body the user endpoints take. `undefined` is omitted
 * (field untouched); `null` is sent blank, which is how the API clears a
 * nullable field — a form cannot carry JSON `null`.
 */
export function toFormData(fields: Record<string, FormValue>): FormData {
  const body = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    body.set(
      key,
      value === null ? "" : value instanceof File ? value : String(value),
    );
  }

  return body;
}
