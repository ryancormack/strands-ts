/**
 * Agent as Tool Pattern
 * 
 * This module provides utilities for wrapping agents as tools, enabling
 * hierarchical multi-agent systems where specialized agents can be
 * orchestrated by a main agent.
 */

import { Agent } from '../agent/agent.js';
import { FunctionTool, tool } from './functionTool.js';
import { ToolSpec } from '../types/tools.js';

export interface AgentAsToolConfig {
  /**
   * The name of the tool
   */
  name: string;
  
  /**
   * Description of what this agent does
   */
  description: string;
  
  /**
   * Factory function that creates the agent instance
   * Called each time the tool is invoked
   */
  agentFactory: () => Agent;
  
  /**
   * Name of the parameter that contains the query
   * @default 'query'
   */
  parameterName?: string;
  
  /**
   * Optional description for the query parameter
   */
  parameterDescription?: string;
  
  /**
   * Whether to return the full AgentResult or just the text
   * @default false (returns just text)
   */
  returnFullResult?: boolean;
}

/**
 * Creates a tool that wraps an agent, allowing it to be used by other agents
 * 
 * @example
 * ```typescript
 * const researchTool = agentAsTool({
 *   name: 'research_assistant',
 *   description: 'Researches topics and provides factual information',
 *   agentFactory: () => new Agent({
 *     model: new BedrockModel(),
 *     systemPrompt: 'You are a research assistant...',
 *     tools: [webSearch, httpRequest]
 *   })
 * });
 * 
 * const orchestrator = new Agent({
 *   model: new BedrockModel(),
 *   tools: [researchTool],
 *   systemPrompt: 'You coordinate between specialized agents...'
 * });
 * ```
 */
export function agentAsTool(config: AgentAsToolConfig): FunctionTool {
  const paramName = config.parameterName || 'query';
  const paramDescription = config.parameterDescription || `Input ${paramName} for the ${config.name}`;
  
  return tool({
    name: config.name,
    description: config.description,
    parameters: {
      [paramName]: {
        type: 'string',
        description: paramDescription,
        required: true
      }
    },
    handler: async (params: Record<string, any>) => {
      // Create agent instance using the factory
      const agent = config.agentFactory();
      
      // Get the query from params
      const query = params[paramName];
      if (!query) {
        throw new Error(`Missing required parameter: ${paramName}`);
      }
      
      // Call the agent
      const result = await agent.call(query);
      
      // Return based on configuration
      return config.returnFullResult ? result : result.text;
    }
  });
}

/**
 * Creates a stateful agent tool that maintains the same agent instance across calls
 * 
 * @example
 * ```typescript
 * const statefulAssistant = statefulAgentAsTool({
 *   name: 'memory_assistant',
 *   description: 'An assistant that remembers previous interactions',
 *   agent: new Agent({
 *     model: new BedrockModel(),
 *     systemPrompt: 'You remember our conversation history...'
 *   })
 * });
 * ```
 */
export function statefulAgentAsTool(config: Omit<AgentAsToolConfig, 'agentFactory'> & { agent: Agent }): FunctionTool {
  return agentAsTool({
    ...config,
    agentFactory: () => config.agent // Always returns the same instance
  });
}

/**
 * Creates multiple agent tools from a configuration map
 * 
 * @example
 * ```typescript
 * const tools = createAgentTools({
 *   researcher: {
 *     description: 'Researches topics',
 *     agentFactory: () => new Agent({...})
 *   },
 *   writer: {
 *     description: 'Writes content',
 *     agentFactory: () => new Agent({...})
 *   }
 * });
 * ```
 */
export function createAgentTools(
  configs: Record<string, Omit<AgentAsToolConfig, 'name'>>
): FunctionTool[] {
  return Object.entries(configs).map(([name, config]) => 
    agentAsTool({ name, ...config })
  );
}