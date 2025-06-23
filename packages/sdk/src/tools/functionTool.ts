/**
 * Function-based tool implementation
 */

import { AgentTool, ToolSpec, ToolUse, ToolResult } from '../types/tools.js';

export interface FunctionToolSpec {
  name: string;
  description: string;
  parameters?: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * A tool that wraps a function
 */
export class FunctionTool extends AgentTool {
  private spec: ToolSpec;
  private fn: (...args: any[]) => any | Promise<any>;

  constructor(
    spec: FunctionToolSpec,
    fn: (...args: any[]) => any | Promise<any>
  ) {
    super();
    
    // Convert to full ToolSpec format
    this.spec = {
      name: spec.name,
      description: spec.description,
      inputSchema: spec.parameters ? { json: spec.parameters } : { json: { type: 'object', properties: {} } }
    };
    
    this.fn = fn;
  }

  get toolName(): string {
    return this.spec.name;
  }

  get toolSpec(): ToolSpec {
    return this.spec;
  }

  get toolType(): string {
    return 'function';
  }

  async invoke(tool: ToolUse): Promise<ToolResult> {
    try {
      // Extract parameters from tool input
      const params = tool.input || {};
      
      // Call the function
      const result = await this.fn(params);
      
      // Format the result
      if (typeof result === 'object' && result !== null && 'status' in result && 'content' in result) {
        // Already in the correct format
        return {
          toolUseId: tool.toolUseId,
          status: result.status,
          content: result.content,
        };
      } else {
        // Wrap the result
        return {
          toolUseId: tool.toolUseId,
          status: 'success',
          content: [{
            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
          }],
        };
      }
    } catch (error) {
      return {
        toolUseId: tool.toolUseId,
        status: 'error',
        content: [{
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }],
      };
    }
  }
}

/**
 * Tool decorator function for TypeScript
 * 
 * @example
 * ```typescript
 * const dateTool = tool({
 *   name: 'current_date',
 *   description: 'Get the current date',
 *   parameters: {
 *     type: 'object',
 *     properties: {
 *       timezone: { type: 'string', description: 'Timezone (optional)' }
 *     }
 *   }
 * }, async ({ timezone }) => {
 *   return new Date().toLocaleDateString();
 * });
 * ```
 */
export function tool(
  spec: FunctionToolSpec,
  fn: (params: any) => any | Promise<any>
): FunctionTool {
  return new FunctionTool(spec, fn);
}