/**
 * Tool registry for managing available tools
 */

import { AgentTool, Tool, ToolConfig, ToolSpec } from '../types/tools.js';

export class ToolRegistry {
  private registry: Map<string, AgentTool> = new Map();
  private dynamicTools: Map<string, AgentTool> = new Map();

  /**
   * Process a list of tools and register them
   */
  processTools(tools: any[]): string[] {
    const toolNames: string[] = [];

    for (const tool of tools) {
      if (tool instanceof AgentTool) {
        this.registerTool(tool);
        toolNames.push(tool.toolName);
      } else {
        console.warn('Unrecognized tool specification:', tool);
      }
    }

    return toolNames;
  }

  /**
   * Register a tool in the registry
   */
  registerTool(tool: AgentTool): void {
    const existingTool = this.registry.get(tool.toolName);
    if (existingTool) {
      console.warn(`Tool '${tool.toolName}' already registered, overwriting`);
    }

    this.registry.set(tool.toolName, tool);

    if (tool.isDynamic) {
      this.dynamicTools.set(tool.toolName, tool);
    }

    console.log(`Registered tool: ${tool.toolName} (type: ${tool.toolType})`);
  }

  /**
   * Get a tool by name
   */
  getTool(name: string): AgentTool | undefined {
    return this.registry.get(name);
  }

  /**
   * Get all registered tool names
   */
  getToolNames(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Get all tools configuration
   */
  getAllToolsConfig(): Map<string, ToolSpec> {
    const toolConfig = new Map<string, ToolSpec>();

    for (const [name, tool] of this.registry) {
      try {
        const spec = tool.toolSpec;
        this.validateToolSpec(spec);
        toolConfig.set(name, spec);
      } catch (error) {
        console.warn(`Tool spec validation failed for '${name}':`, error);
      }
    }

    return toolConfig;
  }

  /**
   * Initialize tool configuration
   */
  initializeToolConfig(): ToolConfig {
    const allTools = this.getAllToolsConfig();
    const tools: Tool[] = Array.from(allTools.values()).map(spec => ({
      toolSpec: spec,
    }));

    return {
      tools,
      toolChoice: { auto: {} },
    };
  }

  /**
   * Validate a tool specification
   */
  private validateToolSpec(spec: ToolSpec): void {
    if (!spec.name) {
      throw new Error('Tool spec missing required field: name');
    }
    if (!spec.description) {
      throw new Error('Tool spec missing required field: description');
    }
    if (!spec.inputSchema) {
      throw new Error('Tool spec missing required field: inputSchema');
    }

    // Ensure inputSchema has required structure
    if (!spec.inputSchema.json) {
      spec.inputSchema = { json: spec.inputSchema };
    }

    const jsonSchema = spec.inputSchema.json;
    if (!jsonSchema.type) {
      jsonSchema.type = 'object';
    }
    if (!jsonSchema.properties) {
      jsonSchema.properties = {};
    }
    if (!jsonSchema.required) {
      jsonSchema.required = [];
    }
  }

  /**
   * Clear all registered tools
   */
  clear(): void {
    this.registry.clear();
    this.dynamicTools.clear();
  }
}