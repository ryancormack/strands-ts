/**
 * AWS Bedrock model provider
 */

import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
  ConverseCommand,
  type ConverseStreamCommandInput,
  type ConverseCommandInput,
  type Message as BedrockMessage,
  type SystemContentBlock,
  type Tool,
  type ToolConfiguration,
  type InferenceConfiguration,
  ThrottlingException,
  ValidationException,
} from '@aws-sdk/client-bedrock-runtime';
import { Model, ModelConfig } from '../types/models.js';
import { Messages, Message } from '../types/content.js';
import { ToolSpec } from '../types/tools.js';
import { StreamEvent } from '../types/streaming.js';
import { ContextWindowOverflowException, ModelThrottledException } from '../types/exceptions.js';

export interface BedrockConfig extends ModelConfig {
  modelId: string;
  region?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  streaming?: boolean;
  cachePrompt?: string;
  cacheTools?: string;
  guardrailId?: string;
  guardrailVersion?: string;
  guardrailTrace?: 'enabled' | 'disabled' | 'enabled_full';
  guardrailStreamProcessingMode?: 'sync' | 'async';
  guardrailRedactInput?: boolean;
  guardrailRedactInputMessage?: string;
  guardrailRedactOutput?: boolean;
  guardrailRedactOutputMessage?: string;
  additionalRequestFields?: Record<string, any>;
  additionalResponseFieldPaths?: string[];
}

const DEFAULT_BEDROCK_MODEL_ID = 'us.anthropic.claude-3-7-sonnet-20250219-v1:0';

const BEDROCK_CONTEXT_WINDOW_OVERFLOW_MESSAGES = [
  'Input is too long for requested model',
  'input length and `max_tokens` exceed context limit',
  'too many total text bytes',
];

export class BedrockModel extends Model {
  public config: BedrockConfig;
  private client: BedrockRuntimeClient;

  constructor(config: Partial<BedrockConfig> = {}) {
    super();
    this.config = {
      modelId: config.modelId || DEFAULT_BEDROCK_MODEL_ID,
      region: config.region || process.env.AWS_REGION || 'us-west-2',
      streaming: config.streaming ?? true,
      ...config
    };

    // Initialize Bedrock client
    this.client = new BedrockRuntimeClient({
      region: this.config.region,
    });

    if (this.config.region === 'us-west-2' && !config.region) {
      console.warn('Defaulted to us-west-2 because no region was specified');
      console.warn('This behavior will change in an upcoming release');
    }
  }

  updateConfig(config: Partial<BedrockConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): BedrockConfig {
    return this.config;
  }

  formatRequest(
    messages: Messages,
    toolSpecs?: ToolSpec[],
    systemPrompt?: string
  ): ConverseStreamCommandInput | ConverseCommandInput {
    // Convert our message format to Bedrock format
    const bedrockMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content.map(block => {
        if (block.text !== undefined) {
          return { text: block.text };
        }
        if (block.image) {
          return {
            image: {
              format: block.image.format,
              source: {
                bytes: block.image.source.bytes,
              }
            }
          };
        }
        if (block.toolUse) {
          return {
            toolUse: {
              toolUseId: block.toolUse.toolUseId,
              name: block.toolUse.name,
              input: block.toolUse.input,
            }
          };
        }
        if (block.toolResult) {
          return {
            toolResult: {
              toolUseId: block.toolResult.toolUseId,
              content: block.toolResult.content.map(content => {
                if (content.text) {
                  return { text: content.text };
                }
                if (content.image) {
                  return {
                    image: {
                      format: content.image.format,
                      source: {
                        bytes: content.image.source.bytes,
                      }
                    }
                  };
                }
                if (content.json) {
                  return { json: content.json };
                }
                return { text: '' };
              }),
              status: block.toolResult.status,
            }
          };
        }
        return { text: '' };
      }).filter(content => content !== null),
    })) as any as BedrockMessage[];

    // Build system content
    const system: SystemContentBlock[] = [];
    if (systemPrompt) {
      system.push({ text: systemPrompt });
    }
    if (this.config.cachePrompt) {
      system.push({ cachePoint: { type: 'default' as const } } as any);
    }

    // Build tool configuration
    let toolConfig: ToolConfiguration | undefined;
    if (toolSpecs && toolSpecs.length > 0) {
      const tools = toolSpecs.map(spec => ({
        toolSpec: {
          name: spec.name,
          description: spec.description,
          inputSchema: spec.inputSchema,
        }
      })) as any as Tool[];

      if (this.config.cacheTools) {
        tools.push({ cachePoint: { type: this.config.cacheTools } } as any);
      }

      toolConfig = {
        tools,
        toolChoice: { auto: {} },
      };
    }

    // Build inference configuration
    const inferenceConfig: InferenceConfiguration = {};
    if (this.config.maxTokens !== undefined) {
      inferenceConfig.maxTokens = this.config.maxTokens;
    }
    if (this.config.temperature !== undefined) {
      inferenceConfig.temperature = this.config.temperature;
    }
    if (this.config.topP !== undefined) {
      inferenceConfig.topP = this.config.topP;
    }
    if (this.config.stopSequences) {
      inferenceConfig.stopSequences = this.config.stopSequences;
    }

    // Build guardrail configuration
    let guardrailConfig: any;
    if (this.config.guardrailId && this.config.guardrailVersion) {
      guardrailConfig = {
        guardrailIdentifier: this.config.guardrailId,
        guardrailVersion: this.config.guardrailVersion,
        trace: this.config.guardrailTrace || 'enabled',
      };
      if (this.config.guardrailStreamProcessingMode) {
        guardrailConfig.streamProcessingMode = this.config.guardrailStreamProcessingMode;
      }
    }

    const request: ConverseStreamCommandInput = {
      modelId: this.config.modelId,
      messages: bedrockMessages,
      system: system.length > 0 ? system : undefined,
      toolConfig,
      inferenceConfig,
      guardrailConfig,
      additionalModelRequestFields: this.config.additionalRequestFields,
      additionalModelResponseFieldPaths: this.config.additionalResponseFieldPaths,
    };

    return request;
  }

  formatChunk(event: any): StreamEvent {
    // Bedrock events are already in the correct format
    return event as StreamEvent;
  }

  async *stream(request: ConverseStreamCommandInput | ConverseCommandInput): AsyncIterable<StreamEvent> {
    try {
      if (this.config.streaming) {
        // Streaming implementation
        const command = new ConverseStreamCommand(request as ConverseStreamCommandInput);
        const response = await this.client.send(command);

        if (response.stream) {
          for await (const chunk of response.stream) {
            // Check for guardrail triggers
            if (chunk.metadata?.trace?.guardrail && this.hasBlockedGuardrail(chunk.metadata.trace.guardrail)) {
              yield* this.generateRedactionEvents();
            }
            
            // Convert Bedrock event to our StreamEvent format
            if (chunk.messageStart) {
              yield { messageStart: { role: chunk.messageStart.role || 'assistant' } };
            }
            if (chunk.contentBlockStart) {
              yield { contentBlockStart: chunk.contentBlockStart as any };
            }
            if (chunk.contentBlockDelta) {
              yield { contentBlockDelta: chunk.contentBlockDelta as any };
            }
            if (chunk.contentBlockStop) {
              yield { contentBlockStop: chunk.contentBlockStop };
            }
            if (chunk.messageStop) {
              yield { messageStop: chunk.messageStop as any };
            }
            if (chunk.metadata) {
              yield { metadata: chunk.metadata as any };
            }
          }
        }
      } else {
        // Non-streaming implementation
        const command = new ConverseCommand(request as ConverseCommandInput);
        const response = await this.client.send(command);

        if (response.output?.message) {
          yield* this.convertNonStreamingToStreaming(response);
        }

        // Check for guardrail triggers
        if (response.trace?.guardrail && this.hasBlockedGuardrail(response.trace.guardrail)) {
          yield* this.generateRedactionEvents();
        }
      }
    } catch (error: any) {
      // Handle throttling error
      if (error instanceof ThrottlingException || error.name === 'ThrottlingException') {
        throw new ModelThrottledException(error.message);
      }

      // Handle context window overflow
      if (error instanceof ValidationException || error.name === 'ValidationException') {
        const errorMessage = error.message || '';
        if (BEDROCK_CONTEXT_WINDOW_OVERFLOW_MESSAGES.some(msg => errorMessage.includes(msg))) {
          console.warn('Bedrock threw context window overflow error');
          throw new ContextWindowOverflowException(errorMessage);
        }
      }

      // Re-throw other errors
      throw error;
    }
  }

  private *convertNonStreamingToStreaming(response: any): Iterable<StreamEvent> {
    const message = response.output.message;
    
    // Yield messageStart event
    yield { messageStart: { role: message.role } };

    // Process content blocks
    for (const content of message.content || []) {
      // Yield contentBlockStart event if needed
      if (content.toolUse) {
        yield {
          contentBlockStart: {
            start: {
              toolUse: {
                toolUseId: content.toolUse.toolUseId,
                name: content.toolUse.name,
              }
            }
          }
        };

        // Yield tool input as delta
        const inputValue = JSON.stringify(content.toolUse.input);
        yield {
          contentBlockDelta: {
            delta: {
              toolUse: { input: inputValue }
            }
          }
        };
      } else if (content.text) {
        // Yield text as delta
        yield {
          contentBlockDelta: {
            delta: { text: content.text }
          }
        };
      }

      // Yield contentBlockStop
      yield { contentBlockStop: {} };
    }

    // Yield messageStop event
    yield {
      messageStop: {
        stopReason: response.stopReason,
        additionalModelResponseFields: response.additionalModelResponseFields,
      }
    };

    // Yield metadata event
    if (response.usage || response.metrics || response.trace) {
      const metadata: StreamEvent = { metadata: {} };
      if (response.usage) {
        metadata.metadata!.usage = response.usage;
      }
      if (response.metrics) {
        metadata.metadata!.metrics = response.metrics;
      }
      if (response.trace) {
        metadata.metadata!.trace = response.trace;
      }
      yield metadata;
    }
  }

  private hasBlockedGuardrail(guardrailData: any): boolean {
    // Check if guardrail data contains any blocked policies
    const inputAssessment = guardrailData.inputAssessment || {};
    const outputAssessments = guardrailData.outputAssessments || {};

    // Check input assessments
    for (const assessment of Object.values(inputAssessment)) {
      if (this.findDetectedAndBlockedPolicy(assessment)) {
        return true;
      }
    }

    // Check output assessments
    for (const assessment of Object.values(outputAssessments)) {
      if (this.findDetectedAndBlockedPolicy(assessment)) {
        return true;
      }
    }

    return false;
  }

  private findDetectedAndBlockedPolicy(input: any): boolean {
    if (typeof input === 'object' && input !== null) {
      if (input.action === 'BLOCKED' && input.detected === true) {
        return true;
      }

      for (const value of Object.values(input)) {
        if (this.findDetectedAndBlockedPolicy(value)) {
          return true;
        }
      }
    } else if (Array.isArray(input)) {
      for (const item of input) {
        if (this.findDetectedAndBlockedPolicy(item)) {
          return true;
        }
      }
    }
    return false;
  }

  private *generateRedactionEvents(): Iterable<StreamEvent> {
    if (this.config.guardrailRedactInput ?? true) {
      console.log('Redacting user input due to guardrail');
      yield {
        redactContent: {
          redactUserContentMessage: this.config.guardrailRedactInputMessage || '[User input redacted.]'
        }
      };
    }

    if (this.config.guardrailRedactOutput) {
      console.log('Redacting assistant output due to guardrail');
      yield {
        redactContent: {
          redactAssistantContentMessage: this.config.guardrailRedactOutputMessage || '[Assistant output redacted.]'
        }
      };
    }
  }

  async structuredOutput<T>(
    outputModel: new (...args: any[]) => T,
    prompt: Messages,
    callbackHandler?: any
  ): Promise<T> {
    // This would need to be implemented with tool use
    // For now, throw not implemented
    throw new Error('Structured output not yet implemented for Bedrock');
  }
}