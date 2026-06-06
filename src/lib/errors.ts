/** An error that carries an HTTP status code, used to short-circuit request handling. */
export class HttpError extends Error {
  readonly status: number;
  /** Optional machine-readable code for the JSON body. */
  readonly code: string;

  constructor(status: number, code: string, message?: string) {
    super(message ?? code);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (code: string, msg?: string) => new HttpError(400, code, msg);
export const unauthorized = (code: string, msg?: string) => new HttpError(401, code, msg);
export const forbidden = (code: string, msg?: string) => new HttpError(403, code, msg);
export const notFound = (code: string, msg?: string) => new HttpError(404, code, msg);

/** Build a JSON error payload (never includes PII). */
export function errorBody(err: unknown): { error: string; message: string } {
  if (err instanceof HttpError) {
    return { error: err.code, message: err.message };
  }
  return { error: "internal_error", message: "internal error" };
}

/**
 * A native Response for an HttpError. Used instead of Hono's `c.json(obj, status)`
 * when the status is dynamic (Hono types the status arg as a literal union).
 */
export function httpErrorResponse(err: HttpError): Response {
  return Response.json(errorBody(err), { status: err.status });
}
