/**
 * Model-related type definitions for the SDK.
 */

import { Messages } from './content.js';
import { ToolSpec } from './tools.js';
import { StreamEvent } from './streaming.js';

export interface ModelConfig {
  modelId: string;
  [key: string]: any;
}

export abstract class Model {
  abstract config: ModelConfig;

  abstract updateConfig(config: Partial<ModelConfig>): void;
  abstract getConfig(): ModelConfig;
  
  abstract formatRequest(
    messages: Messages,
    toolSpecs?: ToolSpec[],
    systemPrompt?: string
  ): any;

  abstract formatChunk(event: any): StreamEvent;

  abstract stream(request: any): AsyncIterable<StreamEvent> | Iterable<StreamEvent>;

  async *converse(
    messages: Messages,
    toolSpecs?: ToolSpec[],
    systemPrompt?: string
  ): AsyncIterable<StreamEvent> {
    const request = this.formatRequest(messages, toolSpecs, systemPrompt);
    for await (const event of this.stream(request)) {
      yield this.formatChunk(event);
    }
  }

  abstract structuredOutput<T>(
    outputModel: new (...args: any[]) => T,
    prompt: Messages,
    callbackHandler?: any
  ): Promise<T>;
}