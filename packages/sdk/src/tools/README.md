# Tools System

The Strands Agent SDK provides a flexible tools system that allows agents to interact with external systems and perform specialized tasks.

## Tool Types

### 1. Function Tools
Basic tools created from functions using the `tool` helper:

```typescript
import { tool } from '@strands/agent-sdk';

const myTool = tool({
  name: 'my_tool',
  description: 'Does something useful',
  parameters: {
    input: {
      type: 'string',
      description: 'The input to process',
      required: true
    }
  },
  handler: async (params) => {
    return `Processed: ${params.input}`;
  }
});
```

### 2. MCP Tools
Tools from Model Context Protocol servers:

```typescript
import { MCPClient, createStdioTransport } from '@strands/agent-sdk';

const mcpClient = new MCPClient(
  createStdioTransport('npx', ['-y', '@modelcontextprotocol/server-filesystem'])
);
await mcpClient.start();
const tools = await mcpClient.listTools();
```

### 3. Agents as Tools
Use agents as tools within other agents for hierarchical multi-agent systems:

```typescript
import { agentAsTool } from '@strands/agent-sdk';

const researchTool = agentAsTool({
  name: 'research_assistant',
  description: 'Researches topics and provides information',
  agentFactory: () => new Agent({
    model: new BedrockModel(),
    systemPrompt: 'You are a research assistant...',
    tools: [searchWeb, httpRequest]
  })
});

// Use in an orchestrator agent
const orchestrator = new Agent({
  model: new BedrockModel(),
  tools: [researchTool, writerTool],
  systemPrompt: 'You coordinate between specialized agents...'
});
```

## Agents as Tools Pattern

The agents-as-tools pattern enables powerful multi-agent architectures:

### Basic Usage

```typescript
import { Agent, agentAsTool } from '@strands/agent-sdk';

// Create a specialized agent tool
const expertTool = agentAsTool({
  name: 'domain_expert',
  description: 'Expert in specific domain',
  agentFactory: () => new Agent({
    model: new BedrockModel(),
    systemPrompt: 'You are an expert in...',
    tools: [...specializedTools]
  })
});
```

### Stateful Agents

For agents that need to maintain state across calls:

```typescript
import { statefulAgentAsTool } from '@strands/agent-sdk';

const assistant = new Agent({
  model: new BedrockModel(),
  systemPrompt: 'You remember our conversation...'
});

const statefulTool = statefulAgentAsTool({
  name: 'memory_assistant',
  description: 'Assistant that remembers context',
  agent: assistant // Same instance reused
});
```

### Batch Creation

Create multiple agent tools efficiently:

```typescript
import { createAgentTools } from '@strands/agent-sdk';

const tools = createAgentTools({
  researcher: {
    description: 'Researches topics',
    agentFactory: () => new Agent({...})
  },
  writer: {
    description: 'Writes content',
    agentFactory: () => new Agent({...})
  },
  analyst: {
    description: 'Analyzes data',
    agentFactory: () => new Agent({...})
  }
});
```

## Best Practices

1. **Focused Expertise**: Each agent tool should have a clear, focused purpose
2. **Clear Descriptions**: Write descriptive tool descriptions to help the orchestrator choose correctly
3. **Appropriate Tools**: Give specialized agents only the tools they need
4. **System Prompts**: Use detailed system prompts to define agent behavior
5. **Error Handling**: Agent tools automatically handle errors and return them in a standard format

## Examples

See the demo package for complete examples:
- `multi-agent-demo.ts` - Comprehensive multi-agent orchestration examples
- `assistant.ts` - Simple agent with tools
- `mcp-demo.ts` - Using MCP tools with agents