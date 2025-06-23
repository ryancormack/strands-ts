/**
 * Tool handler implementation for the agent
 */

import { ToolHandler, ToolUse, ToolResult, ToolConfig } from '../types/tools.js';
import { Messages } from '../types/content.js';
import { Model } from '../types/models.js';
import { ToolRegistry } from '../tools/registry.js';

export class AgentToolHandler implements ToolHandler {
  constructor(private toolRegistry: ToolRegistry) {}

  preprocess(
    tool: ToolUse,
    toolConfig: ToolConfig
  ): ToolResult | null {
    // Check if tool exists in config
    const toolExists = toolConfig.tools.some(
      t => t.toolSpec.name === tool.name
    );

    if (!toolExists) {
      return {
        toolUseId: tool.toolUseId,
        status: 'error',
        content: [{ text: `Tool '${tool.name}' not found` }],
      };
    }

    return null;
  }

  async process(
    tool: ToolUse,
    options: {
      messages: Messages;
      model: Model;
      systemPrompt?: string;
      toolConfig: ToolConfig;
      callbackHandler: any;
      [key: string]: any;
    }
  ): Promise<ToolResult> {
    // Preprocess
    const preprocessResult = this.preprocess(tool, options.toolConfig);
    if (preprocessResult) {
      return preprocessResult;
    }

    // Get tool from registry
    const agentTool = this.toolRegistry.getTool(tool.name);
    if (!agentTool) {
      return {
        toolUseId: tool.toolUseId,
        status: 'error',
        content: [{ text: `Tool '${tool.name}' not found in registry` }],
      };
    }

    try {
      // Invoke the tool
      const result = await agentTool.invoke(tool, options);
      return result;
    } catch (error) {
      return {
        toolUseId: tool.toolUseId,
        status: 'error',
        content: [{ text: `Tool execution failed: ${error}` }],
      };
    }
  }
}