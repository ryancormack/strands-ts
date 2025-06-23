/**
 * Agent Interface.
 * 
 * This module implements the core Agent class that serves as the primary entry point 
 * for interacting with foundation models and tools in the SDK.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  eventLoopCycle, 
  EventLoopCycleOptions,
  EventLoopMetrics 
} from '../eventLoop/eventLoop.js';
import { 
  CallbackHandler, 
  CompositeCallbackHandler, 
  PrintingCallbackHandler, 
  nullCallbackHandler 
} from '../handlers/callbackHandler.js';
import { AgentToolHandler } from '../handlers/toolHandler.js';
import { Messages, Message, ContentBlock } from '../types/content.js';
import { ContextWindowOverflowException } from '../types/exceptions.js';
import { Model } from '../types/models.js';
import { ToolConfig, ToolUse, ToolResult, AgentTool } from '../types/tools.js';
import { AgentResult } from './agentResult.js';
import { 
  ConversationManager, 
  SlidingWindowConversationManager 
} from './conversationManager.js';
import { ToolRegistry } from '../tools/registry.js';
import { ThreadPoolExecutorWrapper } from '../tools/threadPoolExecutor.js';
import { BedrockModel } from '../models/bedrock.js';

export interface AgentOptions {
  model?: Model | string;
  messages?: Messages;
  tools?: AgentTool[];
  systemPrompt?: string;
  callbackHandler?: CallbackHandler | null;
  conversationManager?: ConversationManager;
  maxParallelTools?: number;
  recordDirectToolCall?: boolean;
  name?: string;
  description?: string;
}

export class Agent {
  public model: Model;
  public messages: Messages;
  public systemPrompt?: string;
  public callbackHandler: CallbackHandler;
  public conversationManager: ConversationManager;
  public toolRegistry: ToolRegistry;
  public toolHandler: AgentToolHandler;
  public eventLoopMetrics: EventLoopMetrics;
  public recordDirectToolCall: boolean;
  public name?: string;
  public description?: string;

  private threadPool?: ThreadPoolExecutorWrapper;
  private threadPoolWrapper?: ThreadPoolExecutorWrapper;

  constructor(options: AgentOptions = {}) {
    // Initialize model
    if (!options.model) {
      this.model = new BedrockModel();
    } else if (typeof options.model === 'string') {
      this.model = new BedrockModel({ modelId: options.model });
    } else {
      this.model = options.model;
    }

    // Initialize messages
    this.messages = options.messages || [];

    // Set system prompt
    this.systemPrompt = options.systemPrompt;

    // Initialize callback handler
    if (options.callbackHandler === undefined) {
      const printHandler = new PrintingCallbackHandler();
      this.callbackHandler = printHandler.handler;
    } else if (options.callbackHandler === null) {
      this.callbackHandler = nullCallbackHandler;
    } else {
      this.callbackHandler = options.callbackHandler;
    }

    // Initialize conversation manager
    this.conversationManager = options.conversationManager || new SlidingWindowConversationManager();

    // Initialize thread pool for parallel tool execution
    const maxParallelTools = options.maxParallelTools || 1;
    if (maxParallelTools > 1) {
      this.threadPool = new ThreadPoolExecutorWrapper(maxParallelTools);
      this.threadPoolWrapper = this.threadPool;
    } else if (maxParallelTools < 1) {
      throw new Error('maxParallelTools must be greater than 0');
    }

    this.recordDirectToolCall = options.recordDirectToolCall ?? true;

    // Initialize tool registry and handler
    this.toolRegistry = new ToolRegistry();
    this.toolHandler = new AgentToolHandler(this.toolRegistry);

    // Process tools if provided
    if (options.tools) {
      this.toolRegistry.processTools(options.tools);
    }

    // Initialize metrics
    this.eventLoopMetrics = {
      cycles: 0,
      totalLatencyMs: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      toolExecutions: 0,
    };

    // Set agent metadata
    this.name = options.name;
    this.description = options.description;
  }

  /**
   * Get tool configuration
   */
  get toolConfig(): ToolConfig {
    return this.toolRegistry.initializeToolConfig();
  }

  /**
   * Get all tool names
   */
  get toolNames(): string[] {
    return this.toolRegistry.getToolNames();
  }

  /**
   * Process a natural language prompt through the agent's event loop
   */
  async call(prompt: string, options: any = {}): Promise<AgentResult> {
    try {
      // Run the event loop and get the result
      const result = await this.runLoop(prompt, options);
      return result;
    } catch (error) {
      throw error;
    } finally {
      this.conversationManager.applyManagement(this);
    }
  }

  /**
   * Convenience method - make agent callable
   */
  async invoke(prompt: string, options: any = {}): Promise<AgentResult> {
    return this.call(prompt, options);
  }

  /**
   * Process a prompt and yield events as an async iterator
   */
  async *streamAsync(prompt: string, options: any = {}): AsyncGenerator<any> {
    const stopEvent = uuidv4();
    const events: any[] = [];
    let eventIndex = 0;
    let completed = false;
    let error: Error | null = null;

    // Create a queuing callback handler
    const queuingCallbackHandler: CallbackHandler = (...args: any[]) => {
      events.push({ ...args[0] });
    };

    // Run the event loop in the background
    const runPromise = (async () => {
      try {
        const result = await this.runLoop(prompt, options, queuingCallbackHandler);
        completed = true;
        events.push(stopEvent);
        return result;
      } catch (err) {
        error = err as Error;
        events.push(stopEvent);
        throw err;
      }
    })();

    // Yield events as they come
    while (true) {
      // Wait for new events
      if (eventIndex >= events.length && !completed && !error) {
        await new Promise(resolve => setTimeout(resolve, 10));
        continue;
      }

      if (eventIndex < events.length) {
        const event = events[eventIndex++];
        
        if (event === stopEvent) {
          break;
        }
        
        yield event;
      }
    }

    // Wait for completion and handle any errors
    try {
      await runPromise;
    } catch (err) {
      if (error) throw error;
    }
  }

  /**
   * Execute the agent's event loop with the given prompt
   */
  private async runLoop(
    prompt: string,
    options: any,
    supplementaryCallbackHandler?: CallbackHandler
  ): Promise<AgentResult> {
    // Combine callback handlers if needed
    const invocationCallbackHandler = supplementaryCallbackHandler
      ? new CompositeCallbackHandler(this.callbackHandler, supplementaryCallbackHandler).handler
      : this.callbackHandler;

    // Initialize event loop
    invocationCallbackHandler({ initEventLoop: true, ...options });

    // Create user message
    const messageContent: ContentBlock[] = [{ text: prompt }];
    const newMessage: Message = {
      role: 'user',
      content: messageContent,
    };
    this.messages.push(newMessage);

    // Execute event loop cycle
    return await this.executeEventLoopCycle(invocationCallbackHandler, options);
  }

  /**
   * Execute the event loop cycle with retry logic for context limits
   */
  private async executeEventLoopCycle(
    callbackHandler: CallbackHandler,
    options: any
  ): Promise<AgentResult> {
    const cycleOptions: EventLoopCycleOptions = {
      model: options.model || this.model,
      systemPrompt: options.systemPrompt || this.systemPrompt,
      messages: options.messages || this.messages,
      toolConfig: options.toolConfig || this.toolConfig,
      callbackHandler: options.callbackHandler || callbackHandler,
      toolHandler: options.toolHandler || this.toolHandler,
      toolExecutionHandler: options.toolExecutionHandler || this.threadPoolWrapper,
      eventLoopMetrics: options.eventLoopMetrics || this.eventLoopMetrics,
      agent: this,
      ...options,
    };

    try {
      const result = await eventLoopCycle(cycleOptions);
      
      return new AgentResult(
        result.stopReason,
        result.message,
        result.eventLoopMetrics,
        result.requestState
      );
    } catch (error) {
      if (error instanceof ContextWindowOverflowException) {
        // Try reducing context and retrying
        this.conversationManager.reduceContext(this, error);
        return await this.executeEventLoopCycle(callbackHandler, options);
      }
      throw error;
    }
  }

  /**
   * Tool caller interface for direct tool invocation
   */
  get tool(): any {
    const agent = this;
    
    return new Proxy({}, {
      get(target, prop: string) {
        return async (input: any = {}) => {
          const toolName = prop;
          const tool = agent.toolRegistry.getTool(toolName);
          
          if (!tool) {
            throw new Error(`Tool '${toolName}' not found`);
          }

          // Create tool use
          const toolUse: ToolUse = {
            toolUseId: `tooluse_${toolName}_${Math.random().toString(36).substr(2, 9)}`,
            name: toolName,
            input,
          };

          // Execute tool
          const result = await agent.toolHandler.process(toolUse, {
            messages: agent.messages,
            model: agent.model,
            systemPrompt: agent.systemPrompt,
            toolConfig: agent.toolConfig,
            callbackHandler: agent.callbackHandler,
            agent,
          });

          if (agent.recordDirectToolCall) {
            agent.recordToolExecution(toolUse, result);
          }

          agent.conversationManager.applyManagement(agent);

          return result;
        };
      }
    });
  }

  /**
   * Record a tool execution in message history
   */
  private recordToolExecution(
    toolUse: ToolUse,
    toolResult: ToolResult
  ): void {
    // Create user message describing the tool call
    const userMessage: Message = {
      role: 'user',
      content: [{
        text: `agent.tool.${toolUse.name} direct tool call.\nInput parameters: ${JSON.stringify(toolUse.input)}\n`
      }],
    };

    // Create assistant message with tool use
    const toolUseMessage: Message = {
      role: 'assistant',
      content: [{ toolUse }],
    };

    // Create user message with tool result
    const toolResultMessage: Message = {
      role: 'user',
      content: [{ toolResult }],
    };

    // Create assistant acknowledgment
    const assistantMessage: Message = {
      role: 'assistant',
      content: [{ text: `agent.${toolUse.name} was called` }],
    };

    // Add to message history
    this.messages.push(userMessage, toolUseMessage, toolResultMessage, assistantMessage);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.threadPoolWrapper) {
      this.threadPoolWrapper.shutdown(false);
    }
  }
}