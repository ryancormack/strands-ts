/**
 * Message processing utilities for the event loop
 */

import { Messages, ContentBlock } from '../types/content.js';

/**
 * Clean up orphaned empty tool uses from messages.
 * This handles cases where a tool use was started but not completed.
 */
export function cleanOrphanedEmptyToolUses(messages: Messages): void {
  // Check if the last message is from assistant
  if (messages.length === 0) return;
  
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== 'assistant') return;
  
  // Filter out empty tool uses
  const cleanedContent: ContentBlock[] = [];
  
  for (const block of lastMessage.content) {
    if (block.toolUse) {
      // Keep tool use only if it has valid input
      if (block.toolUse.input !== undefined && block.toolUse.input !== null) {
        cleanedContent.push(block);
      }
    } else {
      // Keep all non-tool-use blocks
      cleanedContent.push(block);
    }
  }
  
  // Update the message content
  lastMessage.content = cleanedContent;
  
  // If the message is now empty, remove it
  if (cleanedContent.length === 0) {
    messages.pop();
  }
}