/**
 * Streaming-related type definitions for the SDK.
 * These types handle streaming responses from models.
 */

export type StopReason = 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use';

export interface Metrics {
  latencyMs?: number;
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface StreamEvent {
  messageStart?: {
    role: string;
  };
  contentBlockStart?: {
    start?: {
      toolUse?: {
        toolUseId: string;
        name: string;
      };
    };
  };
  contentBlockDelta?: {
    delta: {
      text?: string;
      toolUse?: {
        input: string;
      };
    };
  };
  contentBlockStop?: {};
  messageStop?: {
    stopReason: string;
    additionalModelResponseFields?: any;
  };
  metadata?: {
    usage?: Usage;
    metrics?: Metrics;
    trace?: any;
  };
  redactContent?: {
    redactUserContentMessage?: string;
    redactAssistantContentMessage?: string;
  };
}