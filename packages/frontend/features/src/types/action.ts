/**
 * What every server action in `src/actions` resolves to. Actions never throw
 * and never leak a status code to the UI — a caller branches on `success` and
 * shows `message`.
 */
export type ActionResult =
  | { success: true; message: string }
  | { success: false; message: string };

/** An action that returns something on success. */
export type DataResult<T> =
  | { success: true; message: string; data: T }
  | { success: false; message: string };
