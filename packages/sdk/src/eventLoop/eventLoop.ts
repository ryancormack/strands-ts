/**
 * Core event loop implementation.
 * 
 * The event loop allows agents to:
 * 1. Process conversation messages
 * 2. Execute tools based on model requests
 * 3. Handle errors and recovery strategies
 * 4. Manage recursive execution cycles
 */

import { v4 as uuidv4 } from 'uuid';
import { Message, Messages } from '../types/content.js';
import { ParallelToolExecutorInterface } from '../types/eventLoop.js';
import { 
  ContextWindowOverflowException, 
  EventLoopException, 
  ModelThrottledException 
} from '../types/exceptions.js';
import { Model } from '../types/models.js';
import { StopReason, Metrics, Usage } from '../types/streaming.js';
import { ToolConfig, ToolHandler, ToolResult, ToolUse } from '../types/tools.js';
import { streamMessages } from './streaming.js';
import { cleanOrphanedEmptyToolUses } from './messageProcessor.js';
import { runTools, validateAndPrepareTools } from '../tools/executor.js';

const MAX_ATTEMPTS = 6;
const INITIAL_DELAY = 4000; // 4 seconds
const MAX_DELAY = 240000; // 4 minutes

export interface EventLoopMetrics {
  cycles: number;
  totalLatencyMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  toolExecutions: number;
}

export interface EventLoopCycleOptions {
  model: Model;
  systemPrompt?: string;
  messages: Messages;
  toolConfig?: ToolConfig;
  callbackHandler: (...args: any[]) => any;
  toolHandler?: ToolHandler;
  toolExecutionHandler?: ParallelToolExecutorInterface;
  eventLoopMetrics?: EventLoopMetrics;
  requestState?: any;
  eventLoopCycleId?: string;
  [key: string]: any;
}

export interface EventLoopCycleResult {
  stopReason: StopReason;
  message: Message;
  eventLoopMetrics: EventLoopMetrics;
  requestState: any;
}

/**
 * Execute a single cycle of the event loop.
 */
export async function eventLoopCycle(
  options: EventLoopCycleOptions
): Promise<EventLoopCycleResult> {
  // Initialize cycle state
  const cycleId = options.eventLoopCycleId || uuidv4();
  const eventLoopMetrics: EventLoopMetrics = options.eventLoopMetrics || {
    cycles: 0,
    totalLatencyMs: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    toolExecutions: 0,
  };
  
  const requestState = options.requestState || {};
  const cycleStartTime = Date.now();

  // Update metrics
  eventLoopMetrics.cycles++;

  // Notify callback handler
  options.callbackHandler({ start: true });
  options.callbackHandler({ startEventLoop: true });

  // Clean up orphaned empty tool uses
  cleanOrphanedEmptyToolUses(options.messages);

  let message: Message;
  let stopReason: StopReason;
  let usage: Usage;
  let metrics: Metrics;

  // Retry loop for handling throttling
  let currentDelay = INITIAL_DELAY;
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      // Stream messages from the model
      const streamResult = await streamMessages(
        options.model,
        options.systemPrompt,
        options.messages,
        options.toolConfig,
        options.callbackHandler
      );
      
      stopReason = streamResult.stopReason;
      message = streamResult.message;
      usage = streamResult.usage;
      metrics = streamResult.metrics;
      
      break; // Success! Break out of retry loop
    } catch (error) {
      if (error instanceof ContextWindowOverflowException) {
        throw error;
      }
      
      if (error instanceof ModelThrottledException) {
        lastError = error;
        
        // Handle throttling with exponential backoff
        if (attempt < MAX_ATTEMPTS - 1) {
          await handleThrottlingError(
            error,
            attempt,
            currentDelay,
            options.callbackHandler
          );
          currentDelay = Math.min(currentDelay * 2, MAX_DELAY);
          continue;
        }
      }
      
      throw error;
    }
  }

  if (!message!) {
    throw lastError || new Error('Failed to get response from model');
  }
  
  // TypeScript definite assignment assertion - we know these are assigned if we reach here
  usage = usage!;
  metrics = metrics!;
  stopReason = stopReason!;

  try {
    // Add the response message to the conversation
    options.messages.push(message);
    options.callbackHandler({ message });

    // Update metrics
    eventLoopMetrics.totalInputTokens += usage.inputTokens;
    eventLoopMetrics.totalOutputTokens += usage.outputTokens;
    eventLoopMetrics.totalTokens += usage.totalTokens;
    if (metrics.latencyMs) {
      eventLoopMetrics.totalLatencyMs += metrics.latencyMs;
    }

    // If the model is requesting to use tools
    if (stopReason === 'tool_use') {
      if (!options.toolHandler) {
        throw new EventLoopException(
          new Error('Model requested tool use but no tool handler provided'),
          requestState
        );
      }

      if (!options.toolConfig) {
        throw new EventLoopException(
          new Error('Model requested tool use but no tool config provided'),
          requestState
        );
      }

      // Handle tool execution
      return await handleToolExecution({
        ...options,
        stopReason,
        message,
        eventLoopMetrics,
        requestState,
        cycleStartTime,
      });
    }

    // End the cycle and return results
    const cycleEndTime = Date.now();
    eventLoopMetrics.totalLatencyMs += cycleEndTime - cycleStartTime;

    return {
      stopReason,
      message,
      eventLoopMetrics,
      requestState,
    };
  } catch (error) {
    if (error instanceof EventLoopException || error instanceof ContextWindowOverflowException) {
      throw error;
    }
    
    // Handle any other exceptions
    options.callbackHandler({ forceStop: true, forceStopReason: String(error) });
    throw new EventLoopException(error as Error, requestState);
  }
}

/**
 * Handle throttling error with exponential backoff
 */
async function handleThrottlingError(
  error: ModelThrottledException,
  attempt: number,
  currentDelay: number,
  callbackHandler: (...args: any[]) => any
): Promise<void> {
  console.log(`Throttled by model provider. Retrying in ${currentDelay}ms... (attempt ${attempt + 1}/${MAX_ATTEMPTS})`);
  callbackHandler({
    throttlingError: true,
    error: error.message,
    retryIn: currentDelay,
    attempt: attempt + 1,
    maxAttempts: MAX_ATTEMPTS,
  });
  
  await new Promise(resolve => setTimeout(resolve, currentDelay));
}

/**
 * Handle tool execution within the event loop
 */
async function handleToolExecution(
  options: EventLoopCycleOptions & {
    stopReason: StopReason;
    message: Message;
    eventLoopMetrics: EventLoopMetrics;
    requestState: any;
    cycleStartTime: number;
  }
): Promise<EventLoopCycleResult> {
  const toolUses: ToolUse[] = [];
  const toolResults: ToolResult[] = [];
  const invalidToolUseIds: string[] = [];

  validateAndPrepareTools(options.message, toolUses, toolResults, invalidToolUseIds);

  if (toolUses.length === 0) {
    return {
      stopReason: options.stopReason,
      message: options.message,
      eventLoopMetrics: options.eventLoopMetrics,
      requestState: options.requestState,
    };
  }

  // Execute tools
  await runTools({
    handler: options.toolHandler!,
    toolUses,
    eventLoopMetrics: options.eventLoopMetrics,
    requestState: options.requestState,
    invalidToolUseIds,
    toolResults,
    model: options.model,
    systemPrompt: options.systemPrompt,
    messages: options.messages,
    toolConfig: options.toolConfig!,
    callbackHandler: options.callbackHandler,
    parallelToolExecutor: options.toolExecutionHandler,
  });

  // Create tool result message
  const toolResultMessage: Message = {
    role: 'user',
    content: toolResults.map(result => ({ toolResult: result })),
  };

  options.messages.push(toolResultMessage);
  options.callbackHandler({ message: toolResultMessage });

  // Check if we should stop the event loop
  if (options.requestState.stopEventLoop) {
    const cycleEndTime = Date.now();
    options.eventLoopMetrics.totalLatencyMs += cycleEndTime - options.cycleStartTime;
    
    return {
      stopReason: options.stopReason,
      message: options.message,
      eventLoopMetrics: options.eventLoopMetrics,
      requestState: options.requestState,
    };
  }

  // Recurse for another cycle
  return await recurseEventLoop(options);
}

/**
 * Make a recursive call to eventLoopCycle with the current state
 */
async function recurseEventLoop(
  options: EventLoopCycleOptions
): Promise<EventLoopCycleResult> {
  options.callbackHandler({ start: true });

  const result = await eventLoopCycle({
    ...options,
    eventLoopCycleId: uuidv4(),
  });

  return result;
}