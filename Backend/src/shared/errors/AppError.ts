export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code = 'APP_ERROR',
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFound = (entity: string) => new AppError(404, `${entity} not found`, 'NOT_FOUND');
export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, message, 'BAD_REQUEST', details);
export const unauthorized = (message = 'Authentication required') =>
  new AppError(401, message, 'UNAUTHORIZED');
export const forbidden = (message = 'Insufficient permissions') =>
  new AppError(403, message, 'FORBIDDEN');
export const conflict = (message: string) => new AppError(409, message, 'CONFLICT');
