/**
 * Privacy-preserving structured logger.
 *
 * The relay deliberately avoids persisting user data, and it must also avoid
 * *logging* it. Only an explicit allowlist of non-sensitive fields is permitted;
 * everything else is dropped. In particular we NEVER log:
 *   - email addresses          (use the derived `accountKey` instead)
 *   - Gmail historyId          (a mailbox cursor)
 *   - channel tokens / JWTs / access or refresh tokens
 *
 * `accountKey` is already a one-way hash of the email, so it is safe to log for
 * correlation.
 */
const ALLOWED_FIELDS = new Set([
  "event",
  "route",
  "method",
  "status",
  "accountKey",
  "provider",
  "resource",
  "resourceState",
  "messageNumber",
  "delivered",
  "reason",
  "code",
  "cacheHit",
  "durationMs",
  "version",
]);

export type LogFields = Record<string, string | number | boolean | undefined>;

function scrub(fields: LogFields): LogFields {
  const out: LogFields = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined) continue;
    out[k] = ALLOWED_FIELDS.has(k) ? v : "[redacted]";
  }
  return out;
}

function emit(level: "info" | "warn" | "error", msg: string, fields: LogFields) {
  const line = JSON.stringify({ level, msg, ...scrub(fields) });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  info: (msg: string, fields: LogFields = {}) => emit("info", msg, fields),
  warn: (msg: string, fields: LogFields = {}) => emit("warn", msg, fields),
  error: (msg: string, fields: LogFields = {}) => emit("error", msg, fields),
};
