/**
 * What every server action in `src/actions` resolves to. Actions never throw
 * and never produce user-facing text: on failure they return the `error` code
 * (an API enum value or a client code), and whoever called the action turns it
 * into a localized string with `localizeError`. Success copy is the caller's
 * too — it knows what the user just did.
 */
export type ActionResult =
  | { success: true }
  | { success: false; error: string };

/** An action that returns something on success. */
export type DataResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
