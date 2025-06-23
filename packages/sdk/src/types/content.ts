/**
 * Content-related type definitions for the SDK.
 * These types are modeled after the Bedrock API.
 */

import type { ToolResult, ToolUse } from './tools.js';
import { ImageContent, DocumentContent, VideoContent } from './media.js';

export { ImageContent, DocumentContent, VideoContent };

export interface GuardContent {
  text: {
    qualifiers: Array<'grounding_source' | 'query' | 'guard_content'>;
    text: string;
  };
}

export interface ReasoningContentBlock {
  reasoningText?: {
    text: string;
    signature?: string;
  };
  redactedContent?: Uint8Array;
}

export interface CachePoint {
  type: string;
}

export interface ContentBlock {
  cachePoint?: CachePoint;
  document?: DocumentContent;
  guardContent?: GuardContent;
  image?: ImageContent;
  reasoningContent?: ReasoningContentBlock;
  text?: string;
  toolResult?: ToolResult;
  toolUse?: ToolUse;
  video?: VideoContent;
}

export type Role = 'user' | 'assistant';

export interface Message {
  content: ContentBlock[];
  role: Role;
}

export type Messages = Message[];