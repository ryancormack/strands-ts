/**
 * Tool-related type definitions for the SDK.
 * These types are modeled after the Bedrock API.
 */

import { DocumentContent, ImageContent } from './media.js';

export type JSONSchema = Record<string, any>;

export interface ToolSpec {
  description: string;
  inputSchema: JSONSchema;
  name: string;
}

export interface Tool {
  toolSpec: ToolSpec;
}

export interface ToolUse {
  input: any;
  name: string;
  toolUseId: string;
}

export interface ToolResultContent {
  document?: DocumentContent;
  image?: ImageContent;
  json?: any;
  text?: string;
}

export type ToolResultStatus = 'success' | 'error';

export interface ToolResult {
  content: ToolResultContent[];
  status: ToolResultStatus;
  toolUseId: string;
}

export interface ToolChoiceAuto {}

export interface ToolChoiceAny {}

export interface ToolChoiceTool {
  name: string;
}

export type ToolChoice = 
  | { auto: ToolChoiceAuto }
  | { any: ToolChoiceAny }
  | { tool: ToolChoiceTool };

export interface ToolConfig {
  tools: Tool[];
  toolChoice: ToolChoice;
}

export abstract class AgentTool {
  protected _isDynamic: boolean = false;

  abstract get toolName(): string;
  abstract get toolSpec(): ToolSpec;
  abstract get toolType(): string;

  get supportsHotReload(): boolean {
    return false;
  }

  abstract invoke(tool: ToolUse, ...args: any[]): Promise<ToolResult> | ToolResult;

  get isDynamic(): boolean {
    return this._isDynamic;
  }

  markDynamic(): void {
    this._isDynamic = true;
  }

  getDisplayProperties(): Record<string, string> {
    return {
      Name: this.toolName,
      Type: this.toolType,
    };
  }
}

export interface ToolHandler {
  preprocess?(
    tool: ToolUse,
    toolConfig: ToolConfig,
    ...args: any[]
  ): ToolResult | null;

  process(
    tool: ToolUse,
    options: {
      messages: any;
      model: any;
      systemPrompt?: string;
      toolConfig: ToolConfig;
      callbackHandler: any;
      [key: string]: any;
    }
  ): Promise<ToolResult> | ToolResult;
}