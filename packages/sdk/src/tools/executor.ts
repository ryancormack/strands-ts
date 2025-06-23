/**
 * Tool execution utilities
 */

import { Message } from '../types/content.js';
import { ParallelToolExecutorInterface } from '../types/eventLoop.js';
import { Model } from '../types/models.js';
import { 
  ToolConfig, 
  ToolHandler, 
  ToolResult, 
  ToolUse 
} from '../types/tools.js';
import { EventLoopMetrics } from '../eventLoop/eventLoop.js';

export interface RunToolsOptions {
  handler: ToolHandler;
  toolUses: ToolUse[];
  eventLoopMetrics: EventLoopMetrics;
  requestState: any;
  invalidToolUseIds: string[];
  toolResults: ToolResult[];
  model: Model;
  systemPrompt?: string;
  messages: Message[];
  toolConfig: ToolConfig;
  callbackHandler: (...args: any[]) => any;
  parallelToolExecutor?: ParallelToolExecutorInterface;
}

/**
 * Validate and prepare tools from a message
 */
export function validateAndPrepareTools(
  message: Message,
  toolUses: ToolUse[],
  toolResults: ToolResult[],
  invalidToolUseIds: string[]
): void {
  // Extract tool uses from message content
  for (const content of message.content) {
    if (content.toolUse) {
      const toolUse = content.toolUse;
      
      // Validate tool use has required fields
      if (!toolUse.toolUseId || !toolUse.name) {
        if (toolUse.toolUseId) {
          invalidToolUseIds.push(toolUse.toolUseId);
        }
        continue;
      }
      
      toolUses.push(toolUse);
    }
  }
}

/**
 * Execute tools with optional parallel execution
 */
export async function runTools(options: RunToolsOptions): Promise<void> {
  const {
    handler,
    toolUses,
    eventLoopMetrics,
    requestState,
    invalidToolUseIds,
    toolResults,
    model,
    systemPrompt,
    messages,
    toolConfig,
    callbackHandler,
    parallelToolExecutor,
  } = options;

  // Add invalid tool results
  for (const toolUseId of invalidToolUseIds) {
    toolResults.push({
      toolUseId,
      status: 'error',
      content: [{ text: 'Invalid tool use: missing required fields' }],
    });
  }

  // Process each tool
  const toolTasks: Array<() => Promise<ToolResult>> = [];
  
  for (const toolUse of toolUses) {
    const task = async () => {
      try {
        // Notify callback
        callbackHandler({
          toolExecutionStart: true,
          toolUse,
        });

        // Execute tool through handler
        const result = await handler.process(toolUse, {
          messages,
          model,
          systemPrompt,
          toolConfig,
          callbackHandler,
          requestState,
        });

        // Update metrics
        eventLoopMetrics.toolExecutions++;

        // Notify callback
        callbackHandler({
          toolExecutionComplete: true,
          toolUse,
          toolResult: result,
        });

        return result;
      } catch (error) {
        const errorResult: ToolResult = {
          toolUseId: toolUse.toolUseId,
          status: 'error',
          content: [{ text: `Tool execution failed: ${error}` }],
        };

        callbackHandler({
          toolExecutionError: true,
          toolUse,
          error: String(error),
        });

        return errorResult;
      }
    };
    
    toolTasks.push(task);
  }

  // Execute tools (parallel or sequential)
  let results: ToolResult[];
  
  if (parallelToolExecutor && toolTasks.length > 1) {
    // Parallel execution
    results = await parallelToolExecutor.execute(toolTasks);
  } else {
    // Sequential execution
    results = [];
    for (const task of toolTasks) {
      results.push(await task());
    }
  }

  // Add results
  toolResults.push(...results);
}