/**
 * Event loop type definitions
 */

import { ToolResult, ToolUse } from './tools.js';

export interface ParallelToolExecutorInterface {
  execute(
    tasks: Array<() => Promise<ToolResult>>
  ): Promise<ToolResult[]>;
}