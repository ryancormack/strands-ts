/**
 * MCP Agent Tool adapter
 * 
 * This module provides the MCPAgentTool class which serves as an adapter between
 * MCP (Model Context Protocol) tools and the agent framework's tool interface.
 * It allows MCP tools to be seamlessly integrated and used within the agent ecosystem.
 */

import { Tool as MCPTool } from '@modelcontextprotocol/sdk/types.js';
import { AgentTool, ToolSpec, ToolUse, ToolResult } from '../../types/tools.js';
import { MCPClient } from './mcpClient.js';

/**
 * Adapter class that wraps an MCP tool and exposes it as an AgentTool.
 * 
 * This class bridges the gap between the MCP protocol's tool representation
 * and the agent framework's tool interface, allowing MCP tools to be used
 * seamlessly within the agent framework.
 */
export class MCPAgentTool extends AgentTool {
  private mcpTool: MCPTool;
  private mcpClient: MCPClient;

  constructor(mcpTool: MCPTool, mcpClient: MCPClient) {
    super();
    if (process.env.DEBUG) {
      console.debug(`Creating MCP agent tool: ${mcpTool.name}`);
    }
    this.mcpTool = mcpTool;
    this.mcpClient = mcpClient;
  }

  get toolName(): string {
    return this.mcpTool.name;
  }

  get toolSpec(): ToolSpec {
    const description = this.mcpTool.description || `Tool which performs ${this.mcpTool.name}`;
    
    return {
      inputSchema: { json: this.mcpTool.inputSchema },
      name: this.mcpTool.name,
      description: description
    };
  }

  get toolType(): string {
    return 'python';
  }

  async invoke(tool: ToolUse): Promise<ToolResult> {
    if (process.env.DEBUG) {
      console.debug(`Invoking MCP tool '${this.toolName}' with tool_use_id=${tool.toolUseId}`);
    }
    
    return this.mcpClient.callTool(
      tool.toolUseId,
      this.toolName,
      tool.input
    );
  }
}