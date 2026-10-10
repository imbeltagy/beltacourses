export type ErrorEvent = {
  source: "api-client";
  method: string;
  url: string;
  /** HTTP status; 0 when no response arrived. */
  status: number;
  /** The `error` enum value, or a client-side code. */
  error: string;
  /** The server's optional English detail. For logs only, never for users. */
  message?: string;
  /** Request body with secrets redacted. */
  requestBody?: unknown;
  /** The raw response when it did not match the error contract. */
  responsePayload?: unknown;
};

export type ErrorSink = (event: ErrorEvent) => void;

const SENSITIVE_KEY = /pass(word)?|token|secret|authorization/i;

/** Copies `value`, replacing anything that looks like a credential. */
export function redact(value: unknown): unknown {
  if (value instanceof FormData) {
    const fields: Record<string, unknown> = {};
    value.forEach((entry, key) => {
      fields[key] = typeof entry === "string" ? entry : "[file]";
    });
    return redact(fields);
  }

  if (Array.isArray(value)) return value.map(redact);

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        SENSITIVE_KEY.test(key) ? "[redacted]" : redact(entry),
      ]),
    );
  }

  return value;
}

/**
 * Where every failure the api-client sees is reported. The default sink is the
 * console; call `ErrorNotifier.configure({ sink })` once at startup to forward
 * to a real notifier (Slack, Sentry) instead. A sink that throws must not take
 * the request down with it, so `notify` swallows its errors.
 */
export class ErrorNotifier {
  private static sink: ErrorSink = (event) => {
    console.error(
      `[${event.source}] ${event.method} ${event.url} -> ${event.status} ${event.error}`,
      event,
    );
  };

  private constructor() {}

  static configure({ sink }: { sink: ErrorSink }) {
    ErrorNotifier.sink = sink;
  }

  static notify(event: ErrorEvent) {
    try {
      ErrorNotifier.sink({
        ...event,
        requestBody: redact(event.requestBody),
      });
    } catch {
      // Reporting is best-effort.
    }
  }
}
