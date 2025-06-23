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
   
   # Or specific demos
   pnpm --filter @strands/demo-agent assistant
   pnpm --filter @strands/demo-agent weather
   pnpm --filter @strands/demo-agent calculator
   ```

## Features

- ✅ **Event Loop Architecture** - Core agent loop with streaming support
- ✅ **AWS Bedrock Integration** - Full support for Claude models
- ✅ **Tool System** - Flexible tool creation with decorators
- ✅ **Built-in Tools Package** - Optional tools for common tasks
- ✅ **REPL Interface** - Interactive command-line interface
- ✅ **TypeScript Support** - Full type safety and IDE support
- 🚧 **MCP Support** - Model Context Protocol (coming soon)

## SDK Usage

```typescript
import { Agent, BedrockModel, tool } from '@strands/agent-sdk';
import { calculator, currentDate } from '@strands/tools';

// Create an agent with specific tools
const agent = new Agent({
  model: new BedrockModel({
    modelId: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0'
  }),
  tools: [calculator, currentDate],
  systemPrompt: 'You are a helpful assistant.'
});

// Use the tools
const response = await agent.call("What is today's date?");

// Create custom tools
const myTool = tool({
  name: 'my_tool',
  description: 'Does something useful',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string' }
    }
  }
}, async ({ input }) => {
  return `Processed: ${input}`;
});

// Add custom tools
const agentWithTools = new Agent({
  tools: [myTool]
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

## Progress

See [packages/sdk/migration.md](./packages/sdk/migration.md) for the detailed migration plan and progress.