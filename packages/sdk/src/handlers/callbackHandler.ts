/**
 * Callback handler implementations for event processing
 */

export type CallbackHandler = (...args: any[]) => void;

/**
 * Printing callback handler that outputs events to console
 */
export class PrintingCallbackHandler {
  private buffer: string = '';

  handle(...args: any[]): void {
    if (args.length === 0) return;

    const event = args[0];

    // Handle different event types
    if (typeof event === 'object') {
      if (event.delta) {
        // Streaming text delta
        this.buffer += event.delta;
        process.stdout.write(event.delta);
      } else if (event.messageStop) {
        // End of message
        if (this.buffer) {
          process.stdout.write('\n');
          this.buffer = '';
        }
      } else if (event.toolExecutionStart) {
        console.log(`\n🔧 Executing tool: ${event.toolUse.name}`);
      } else if (event.toolExecutionComplete) {
        console.log(`✅ Tool completed: ${event.toolUse.name}`);
      } else if (event.toolExecutionError) {
        console.error(`❌ Tool error: ${event.error}`);
      } else if (event.throttlingError) {
        console.log(`⏳ Rate limited. Retrying in ${event.retryIn}ms (attempt ${event.attempt}/${event.maxAttempts})`);
      }
    }
  }

  // Make it callable as a function
  get handler(): CallbackHandler {
    return this.handle.bind(this);
  }
}

/**
 * Null callback handler that ignores all events
 */
export const nullCallbackHandler: CallbackHandler = () => {};

/**
 * Composite callback handler that calls multiple handlers
 */
export class CompositeCallbackHandler {
  private handlers: CallbackHandler[];

  constructor(...handlers: CallbackHandler[]) {
    this.handlers = handlers;
  }

  handle(...args: any[]): void {
    for (const handler of this.handlers) {
      handler(...args);
    }
  }

  get handler(): CallbackHandler {
    return this.handle.bind(this);
  }
}