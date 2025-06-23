/**
 * Exception types for the SDK.
 */

export class StrandsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ContextWindowOverflowException extends StrandsError {
  constructor(message: string) {
    super(message);
  }
}

export class ModelThrottledException extends StrandsError {
  constructor(message: string) {
    super(message);
  }
}

export class EventLoopException extends StrandsError {
  public requestState: any;

  constructor(error: Error | string, requestState: any = {}) {
    super(typeof error === 'string' ? error : error.message);
    this.requestState = requestState;
  }
}

export class MCPClientInitializationError extends StrandsError {
  constructor(message: string) {
    super(message);
  }
}