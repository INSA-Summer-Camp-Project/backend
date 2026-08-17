/**
 * Standard API Response Structures for Backend
 */

export interface ApiSuccessResponse<T, M = undefined> {
  success: true;
  data: T;
  meta?: M;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

export type ApiResponse<T, M = undefined> =
  ApiSuccessResponse<T, M> | ApiErrorResponse;
