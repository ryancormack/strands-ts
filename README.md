* Use the real one*

* https://github.com/strands-agents/sdk-typescript

** DO NOT BLINDLY USE THIS. IT IS AN EXPERIMENT TO SEE WHAT IS POSSIBLE**

This Typescript implementation is an AI generated migration of the Python SDK to TypeScript, using the same architecture and design principles. It is not a direct translation but rather a reimagining of the SDK in TypeScript, leveraging its features and idioms.

It MUST NOT be taken as a Typescript SDK. The code has not been reviewed, but it has been tested and seems to work as is. Dot NOT paste any secrets or sensitive information in here.


# Read Me before all else.

This bit was written by me. The [Strands SDK](https://github.com/strands-agents/sdk-python) is an open source Python SDK for building AI agents. It supports a load of Model Providers, including Bedrock, VertexAI, Ollama and more. It has some built in tools for doing things, allows you to integrate MCP servers into those Agents and has a REPL interface for interacting with the agents.

I'm by no means fluent in Python. I can read it, but I don't know the idioms or best practices. So I thought it would be fun to see if an AI could generate a TypeScript version of the SDK, using the same architecture and design principles. Over a couple of hours I coaxed Claude Code using Opus to generate a Typescript version of the SDK, using the same architecture and design principles. The result is a TypeScript SDK that is essentially an AI generated Typescript clone. It shouldn't be used. But I wanted to see how far you could get an AI to translate a whole load of code. I've not reviewed the code and 100% recommend you don't use the code. But I've used it and it runs. It loads MCP servers, it runs the agent. It's missing a load of features that make Strands great though. You should 100% go and check Strands out. It's great, so a huge thanks to the Strands team, and I'll continue my adventure learning Python, because I am running Strands Agents in Production and it's great..

Now, back to the AI generated code...


# Strands Agent SDK - TypeScript

A TypeScript SDK for building AI agents with a model-driven approach, migrated from the Python SDK.

## Workspace Structure

This is a pnpm monorepo with the following packages:

```
strands-ts/
├── packages/
│   ├── sdk/              # Core SDK (@strands/agent-sdk)
│   │   ├── src/          # SDK source code
│   │   ├── dist/         # Built JavaScript files
│   │   └── docs/         # SDK documentation
│   ├── tools/            # Built-in tools (@strands/tools)
│   │   ├── src/          # Tools implementations
│   │   └── dist/         # Built JavaScript files
│   └── demo-agent/       # Demo applications
│       └── src/          # Demo implementations
```

## Quick Start

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Build the SDK:**
   ```bash
   pnpm build:sdk
   ```

3. **Run the demos:**
   ```bash
   # Interactive demo menu
   pnpm demo
   
   # Or run specific demos directly
   pnpm --filter @strands/demo-agent assistant      # Basic conversational assistant
   pnpm --filter @strands/demo-agent weather        # Weather information agent
   pnpm --filter @strands/demo-agent calculator     # Mathematical calculations
   pnpm --filter @strands/demo-agent tools          # All built-in tools showcase
   pnpm --filter @strands/demo-agent mcp            # MCP server integration
   pnpm --filter @strands/demo-agent multi-agent    # Multi-agent orchestration
   
   # Interactive REPL
   pnpm --filter @strands/agent-sdk repl
   ```

## Features

### Core Features
- ✅ **Event Loop Architecture** - Core agent loop with streaming support
- ✅ **AWS Bedrock Integration** - Full support for Claude models via Converse API
- ✅ **Tool System** - Flexible tool creation and registration
- ✅ **TypeScript Support** - Full type safety and IDE support
- ✅ **Conversation Management** - Sliding window and null conversation managers
- ✅ **Error Handling** - Proper error types and recovery mechanisms
- ✅ **Streaming Support** - Real-time streaming responses from models

### Tools & Integration
- ✅ **Built-in Tools Package** - Date/time, calculator, HTTP requests, web search
- ✅ **MCP Support** - Full Model Context Protocol integration
  - Stdio transport for local MCP servers
  - SSE transport for remote MCP servers
  - Automatic tool discovery and integration
- ✅ **Agents as Tools** - Use agents as tools within other agents
  - Hierarchical multi-agent systems
  - Stateful and stateless agent tools
  - Agent orchestration patterns

### User Interface
- ✅ **REPL Interface** - Interactive command-line interface with:
  - Syntax highlighting
  - Command history
  - Built-in commands (.help, .exit, .model, .tools, etc.)
  - Session management
- ✅ **Demo Applications** - Multiple example implementations:
  - Basic assistant with conversation
  - Weather agent with custom tools
  - Calculator agent
  - MCP integration demos
  - Multi-agent orchestration demo

## SDK Usage

### Basic Agent
```typescript
import { Agent, BedrockModel } from '@strands/agent-sdk';
import { calculator, currentDate } from '@strands/tools';

const agent = new Agent({
  model: new BedrockModel({
    modelId: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0'
  }),
  tools: [calculator, currentDate],
  systemPrompt: 'You are a helpful assistant.'
});

const response = await agent.call("What is today's date?");
console.log(response.text);
```

### Custom Tools
```typescript
import { tool } from '@strands/agent-sdk';

const myTool = tool({
  name: 'my_tool',
  description: 'Does something useful',
  parameters: {
    input: { type: 'string', description: 'Input to process' }
  },
  handler: async ({ input }) => {
    return `Processed: ${input}`;
  }
});
```

### MCP Integration
```typescript
import { MCPClient, createStdioTransport } from '@strands/agent-sdk';

// Connect to MCP server
const mcpClient = new MCPClient(
  createStdioTransport('npx', ['-y', '@modelcontextprotocol/server-filesystem'])
);
await mcpClient.start();

// Use MCP tools with agent
const tools = await mcpClient.listTools();
const agent = new Agent({
  model: new BedrockModel(),
  tools: tools
});
```

### Multi-Agent Systems
```typescript
import { agentAsTool } from '@strands/agent-sdk';

// Create specialized agent as a tool
const researchTool = agentAsTool({
  name: 'researcher',
  description: 'Researches topics',
  agentFactory: () => new Agent({
    model: new BedrockModel(),
    systemPrompt: 'You are a research expert...',
    tools: [searchWeb, httpRequest]
  })
});

// Orchestrator uses specialized agents
const orchestrator = new Agent({
  model: new BedrockModel(),
  tools: [researchTool, writerTool],
  systemPrompt: 'You coordinate specialized agents...'
});
```

## AWS Configuration

The SDK requires AWS credentials to access Bedrock. Configure credentials using one of these methods:

1. **AWS CLI** (recommended):
   ```bash
   aws configure
   ```

2. **Environment variables**:
   ```bash
   export AWS_ACCESS_KEY_ID=your-access-key
   export AWS_SECRET_ACCESS_KEY=your-secret-key
   export AWS_REGION=us-west-2
   ```

3. **AWS Profile**:
   ```bash
   export AWS_PROFILE=your-profile-name
   ```

4. **IAM Role** (when running on AWS infrastructure)

## Development

- SDK source: `packages/sdk/src/`
- Run SDK REPL: `pnpm --filter @strands/agent-sdk repl`
- Type check: `pnpm typecheck`
- Clean builds: `pnpm clean`

## Demo Agent

The demo package showcases:
- Basic conversational assistant
- Weather agent with custom tools
- Calculator agent with mathematical tools

See `packages/demo-agent/README.md` for details.

## Architecture

The SDK follows the same architecture as the Python version:

- **Event Loop**: Core execution engine that handles model interactions and tool execution
- **Agent**: High-level interface for interacting with models and tools
- **Models**: Abstraction layer for different model providers (Bedrock, OpenAI, etc.)
- **Tools**: System for extending agent capabilities with custom functions
- **MCP**: Model Context Protocol support for tool integration

## Not Yet Implemented

The following features from the Python SDK are not yet implemented:

### Model Providers
- ❌ OpenAI models
- ❌ Anthropic direct API
- ❌ Ollama local models
- ❌ LiteLLM universal interface
- ❌ Vertex AI (Google)
- ❌ Custom model providers

### Advanced Features
- ❌ A2A (Agent-to-Agent) HTTP protocol
- ❌ Hot reloading of tools
- ❌ Telemetry and observability (OpenTelemetry)
- ❌ Structured output with Pydantic-like validation
- ❌ Conversation persistence
- ❌ Bedrock guardrails
- ❌ Cache points for conversation optimization
- ❌ Token counting and management
- ❌ Summarizing conversation manager

### Tools
- ❌ SQL database tools
- ❌ Vector database tools
- ❌ Email tools
- ❌ Slack integration
- ❌ File system tools (available via MCP)

## Progress

See [packages/sdk/migration.md](./packages/sdk/migration.md) for the detailed migration plan and progress.
