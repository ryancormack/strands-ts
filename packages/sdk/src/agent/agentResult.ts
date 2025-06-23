/**
 * Agent result type definition
 */

import { Message } from '../types/content.js';
import { StopReason } from '../types/streaming.js';
import { EventLoopMetrics } from '../eventLoop/eventLoop.js';

export class AgentResult {
  constructor(
    public readonly stopReason: StopReason,
    public readonly message: Message,
    public readonly metrics: EventLoopMetrics,
    public readonly state: any
  ) {}

  get content(): string {
    // Extract text content from the message
    return this.message.content
      .map(block => block.text || '')
      .filter(text => text)
      .join('');
  }

  get toolUses(): any[] {
    // Extract tool uses from the message
    return this.message.content
      .map(block => block.toolUse)
      .filter(toolUse => toolUse);
  }
}