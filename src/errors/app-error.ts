export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "SELF_ACTION_NOT_ALLOWED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  public statusCode: number;
  public code: ErrorCode;

  constructor(message: string, code: ErrorCode, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad Request", code: ErrorCode = "VALIDATION_ERROR") {
    super(message, code, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHENTICATED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", code: ErrorCode = "FORBIDDEN") {
    super(message, code, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not Found") {
    super(message, "NOT_FOUND", 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, "CONFLICT", 409);
  }
}
