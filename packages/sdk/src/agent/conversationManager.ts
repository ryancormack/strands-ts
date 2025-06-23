/**
 * Conversation management interfaces and implementations
 */

import { Messages, Message } from '../types/content.js';
import { ContextWindowOverflowException } from '../types/exceptions.js';

export interface ConversationManager {
  applyManagement(agent: any): void;
  reduceContext(agent: any, error?: ContextWindowOverflowException): void;
}

/**
 * Sliding window conversation manager that maintains a fixed number of recent messages
 */
export class SlidingWindowConversationManager implements ConversationManager {
  constructor(
    private maxMessages: number = 20,
    private preserveSystemMessages: boolean = true
  ) {}

  applyManagement(agent: any): void {
    const messages: Messages = agent.messages;
    
    if (messages.length <= this.maxMessages) {
      return;
    }

    // Keep system messages if configured
    const systemMessages: Message[] = [];
    const conversationMessages: Message[] = [];

    for (const message of messages) {
      // Check if this is a system-related message
      const hasSystemContent = message.content.some(
        block => block.guardContent || block.cachePoint
      );
      
      if (this.preserveSystemMessages && hasSystemContent) {
        systemMessages.push(message);
      } else {
        conversationMessages.push(message);
      }
    }

    // Calculate how many conversation messages we can keep
    const maxConversationMessages = this.maxMessages - systemMessages.length;
    
    // Keep the most recent conversation messages
    const keptConversationMessages = conversationMessages.slice(-maxConversationMessages);
    
    // Rebuild the messages array
    agent.messages = [...systemMessages, ...keptConversationMessages];
  }

  reduceContext(agent: any, error?: ContextWindowOverflowException): void {
    const messages: Messages = agent.messages;
    
    // Remove 25% of messages on overflow
    const removeCount = Math.floor(messages.length * 0.25);
    
    if (removeCount > 0) {
      // Keep the first message (usually system) and remove from the beginning of conversation
      const firstMessage = messages[0];
      const remainingMessages = messages.slice(removeCount + 1);
      
      agent.messages = [firstMessage, ...remainingMessages];
      
      console.log(`Reduced context by removing ${removeCount} messages due to overflow`);
    }
  }
}

/**
 * Null conversation manager that doesn't manage conversation history
 */
export class NullConversationManager implements ConversationManager {
  applyManagement(agent: any): void {
    // No-op
  }

  reduceContext(agent: any, error?: ContextWindowOverflowException): void {
    // No-op
  }
}