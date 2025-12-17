export class HttpError extends Error {
  public status: number;
  public details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const NotFound = (message = "Not Found", details?: unknown) => new HttpError(404, message, details);
export const Conflict = (message = "Conflict", details?: unknown) => new HttpError(409, message, details);
export const Unprocessable = (message = "Unprocessable Entity", details?: unknown) =>
  new HttpError(422, message, details);
export const BadRequest = (message = "Bad Request", details?: unknown) => new HttpError(400, message, details);
export const Unauthorized = (message = "Unauthorized", details?: unknown) => new HttpError(401, message, details);
export const Forbidden = (message = "Forbidden", details?: unknown) => new HttpError(403, message, details);

