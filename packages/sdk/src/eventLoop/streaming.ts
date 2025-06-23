/**
 * Streaming message processing for the event loop
 */

import { Message, Messages, ContentBlock } from '../types/content.js';
import { Model } from '../types/models.js';
import { StopReason, Metrics, Usage, StreamEvent } from '../types/streaming.js';
import { ToolConfig, ToolUse } from '../types/tools.js';

export interface StreamMessagesResult {
  stopReason: StopReason;
  message: Message;
  usage: Usage;
  metrics: Metrics;
}

/**
 * Process streaming messages from the model
 */
export async function streamMessages(
  model: Model,
  systemPrompt: string | undefined,
  messages: Messages,
  toolConfig: ToolConfig | undefined,
  callbackHandler: (...args: any[]) => any
): Promise<StreamMessagesResult> {
  const contentBlocks: ContentBlock[] = [];
  let currentText = '';
  let currentToolUse: Partial<ToolUse> | null = null;
  let currentToolInput = '';
  let stopReason: StopReason = 'end_turn';
  let usage: Usage = {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
  };
  let metrics: Metrics = {};
  let role: 'assistant' | 'user' = 'assistant';

  // Stream events from model
  const stream = model.converse(messages, toolConfig?.tools.map(t => t.toolSpec), systemPrompt);
  
  for await (const event of stream) {
    // Process different event types
    if (event.messageStart) {
      role = event.messageStart.role as 'assistant' | 'user';
      callbackHandler({ messageStart: true, role });
    }
    
    if (event.contentBlockStart?.start?.toolUse) {
      const toolUse = event.contentBlockStart.start.toolUse;
      currentToolUse = {
        toolUseId: toolUse.toolUseId,
        name: toolUse.name,
      };
      currentToolInput = '';
      callbackHandler({ 
        toolUseStart: true, 
        toolUseId: toolUse.toolUseId,
        toolName: toolUse.name 
      });
    }
    
    if (event.contentBlockDelta?.delta) {
      const delta = event.contentBlockDelta.delta;
      
      if (delta.text) {
        currentText += delta.text;
        callbackHandler({ delta: delta.text });
      }
      
      if (delta.toolUse?.input) {
        currentToolInput += delta.toolUse.input;
        callbackHandler({ 
          toolUseDelta: true,
          input: delta.toolUse.input 
        });
      }
    }
    
    if (event.contentBlockStop) {
      // Finalize current content block
      if (currentText) {
        contentBlocks.push({ text: currentText });
        currentText = '';
      }
      
      if (currentToolUse && currentToolInput) {
        try {
          const toolInput = JSON.parse(currentToolInput);
          const toolUse: ToolUse = {
            toolUseId: currentToolUse.toolUseId!,
            name: currentToolUse.name!,
            input: toolInput,
          };
          contentBlocks.push({ toolUse });
          callbackHandler({ 
            toolUseComplete: true,
            toolUse 
          });
        } catch (error) {
          console.error('Failed to parse tool input:', error);
          // Add error content block
          contentBlocks.push({
            text: `Error parsing tool input: ${error}`
          });
        }
        currentToolUse = null;
        currentToolInput = '';
      }
    }
    
    if (event.messageStop) {
      stopReason = event.messageStop.stopReason as StopReason;
      callbackHandler({ 
        messageStop: true, 
        stopReason 
      });
    }
    
    if (event.metadata) {
      if (event.metadata.usage) {
        usage = event.metadata.usage;
      }
      if (event.metadata.metrics) {
        metrics = event.metadata.metrics;
      }
    }

    // Handle content redaction
    if (event.redactContent) {
      if (event.redactContent.redactUserContentMessage) {
        // Redact the last user message
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
        if (lastUserMessage) {
          lastUserMessage.content = [{ text: event.redactContent.redactUserContentMessage }];
        }
      }
      
      if (event.redactContent.redactAssistantContentMessage) {
        // Clear current content and add redacted message
        contentBlocks.length = 0;
        contentBlocks.push({ text: event.redactContent.redactAssistantContentMessage });
      }
    }
  }

  // Create the final message
  const message: Message = {
    role,
    content: contentBlocks,
  };

  return {
    stopReason,
    message,
    usage,
    metrics,
  };
}

/**
 * Process a stream of events and yield formatted events for callback handling
 */
export async function* processStream(
  stream: AsyncIterable<StreamEvent>,
  messages: Messages
): AsyncGenerator<any> {
  const result = await streamMessages(
    {
      async *converse() {
        yield* stream;
      }
    } as any,
    undefined,
    messages,
    undefined,
    () => {} // No-op callback for this use case
  );

  yield {
    stop: [
      result.stopReason,
      result.message,
      result.usage,
      result.metrics
    ]
  };
}