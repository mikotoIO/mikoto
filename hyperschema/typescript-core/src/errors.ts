export class BaseError extends Error {
  constructor(
    public code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export class NotFoundError extends BaseError {
  constructor(message?: string) {
    super('NotFound', message);
  }
}

export class AlreadyExistsError extends BaseError {
  constructor(message?: string) {
    super('AlreadyExists', message);
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message?: string) {
    super('Unauthorized', message);
  }
}

export class PermissionDeniedError extends BaseError {
  constructor(message?: string) {
    super('PermissionDenied', message);
  }
}

export class ValidationError extends BaseError {
  constructor(message?: string) {
    super('ValidationError', message);
  }
}

export class BadRequestError extends BaseError {
  constructor(message?: string) {
    super('BadRequest', message);
  }
}

export class ServerError extends BaseError {
  constructor(message?: string) {
    super('ServerError', message);
  }
}

export class TimeoutError extends BaseError {
  constructor(message?: string) {
    super('Timeout', message);
  }
}

export class TooManyRequestsError extends BaseError {
  constructor(message?: string) {
    super('TooManyRequests', message);
  }
}

export class UnimplementedError extends BaseError {
  constructor(message?: string) {
    super('Unimplemented', message);
  }
}
