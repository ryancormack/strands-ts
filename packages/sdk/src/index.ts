/**
 * Strands Agent SDK - TypeScript
 * 
 * Main entry point for the SDK
 */

// Core exports
export { Agent, type AgentOptions } from './agent/agent.js';
export { AgentResult } from './agent/agentResult.js';

// Model exports
export { Model, type ModelConfig } from './types/models.js';
export { BedrockModel, type BedrockConfig } from './models/bedrock.js';

// Type exports
export * from './types/content.js';
export * from './types/tools.js';
export * from './types/streaming.js';
export * from './types/exceptions.js';
export * from './types/eventLoop.js';

// Tool system exports
export { ToolRegistry } from './tools/registry.js';
export { AgentTool } from './types/tools.js';
export { FunctionTool, tool } from './tools/functionTool.js';

// Note: Built-in tools are now in the @strands/tools package

// Conversation management exports
export { 
  ConversationManager,
  SlidingWindowConversationManager,
  NullConversationManager 
} from './agent/conversationManager.js';

// Handler exports
export {
  CallbackHandler,
  PrintingCallbackHandler,
  CompositeCallbackHandler,
  nullCallbackHandler
} from './handlers/callbackHandler.js';

// MCP exports
export {
  MCPClient,
  MCPAgentTool,
  createStdioTransport,
  createSSETransport,
  MCPTransportFactory,
  MCPClientInitializationError
} from './tools/mcp/index.js';