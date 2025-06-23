# TypeScript Migration Plan for Strands Agent SDK

## Overview
This plan details the migration of the Strands Python SDK to TypeScript. All TypeScript code will be written to the `/Users/ryancormack/code/ryancormack/strands-ts` directory. The initial focus is on core functionality needed to create a REPL-like agent that can use MCP tools.

## Output Directory
**All TypeScript files will be created in: `/Users/ryancormack/code/ryancormack/strands-ts`**

## Phase 1: Core Event Loop & REPL (Priority 1)

### 1.1 Event Loop Architecture
- Port `event_loop/event_loop.py` → `/Users/ryancormack/code/ryancormack/strands-ts/src/eventLoop/eventLoop.ts`
  - Implement `eventLoopCycle()` function with retry logic
  - Handle tool execution flow
  - Implement context window overflow handling
  - Port streaming message processing

### 1.2 Basic Agent Class
- Port `agent/agent.py` → `/Users/ryancormack/code/ryancormack/strands-ts/src/agent/agent.ts`
  - Core Agent class with constructor accepting model, tools, system prompt
  - Implement `call()` method for synchronous interaction
  - Implement `streamAsync()` for async streaming
  - Tool registry integration
  - Message history management

### 1.3 REPL Implementation
- Create `/Users/ryancormack/code/ryancormack/strands-ts/src/repl/repl.ts`
  - Interactive command-line interface using Node.js readline
  - Handle user input in a loop
  - Display agent responses with proper formatting
  - Graceful shutdown handling

## Phase 2: Bedrock Integration (Priority 2)

### 2.1 Model Interface
- Port `types/models.py` → `/Users/ryancormack/code/ryancormack/strands-ts/src/types/models.ts`
  - Define abstract Model interface
  - Implement request/response formatting methods

### 2.2 Bedrock Model Provider
- Port `models/bedrock.py` → `/Users/ryancormack/code/ryancormack/strands-ts/src/models/bedrock.ts`
  - AWS SDK v3 integration for Bedrock Runtime
  - Implement streaming and non-streaming modes
  - Handle context window overflow errors
  - Support for tool configuration and caching

## Phase 3: MCP Tool Integration (Priority 3)

### 3.1 MCP Client
- Port `tools/mcp/mcp_client.py` → `/Users/ryancormack/code/ryancormack/strands-ts/src/tools/mcp/mcpClient.ts`
  - Background thread management using Node.js worker threads
  - MCP session lifecycle management
  - Tool discovery and invocation

### 3.2 Tool System
- Port `types/tools.py` → `/Users/ryancormack/code/ryancormack/strands-ts/src/types/tools.ts`
  - Define tool interfaces (AgentTool, ToolSpec, ToolUse, ToolResult)
  - Tool registry for managing available tools
  
### 3.3 MCP Tool Adapter
- Port `tools/mcp/mcp_agent_tool.py` → `/Users/ryancormack/code/ryancormack/strands-ts/src/tools/mcp/mcpAgentTool.ts`
  - Adapt MCP tools to agent tool interface
  - Handle tool execution through MCP client

## Phase 4: Supporting Infrastructure

### 4.1 Type Definitions
- Port `types/content.py` → `/Users/ryancormack/code/ryancormack/strands-ts/src/types/content.ts`
  - Message and content block types
  - Role definitions
  - Streaming event types

### 4.2 Conversation Management
- Port basic sliding window conversation manager → `/Users/ryancormack/code/ryancormack/strands-ts/src/agent/conversationManager.ts`
  - Message history truncation
  - Context window management

### 4.3 Error Handling
- Port exception types → `/Users/ryancormack/code/ryancormack/strands-ts/src/types/exceptions.ts`
  - ModelThrottledException
  - ContextWindowOverflowException
  - MCPClientInitializationError

## Implementation Details

### Technology Stack
- **Runtime**: Node.js 20+ (LTS)
- **Language**: TypeScript 5.x
- **Package Manager**: pnpm
- **AWS SDK**: @aws-sdk/client-bedrock-runtime
- **MCP SDK**: @modelcontextprotocol/sdk
- **Build Tool**: esbuild or tsx for fast compilation
- **Test Framework**: Vitest (fast, TypeScript-native)

### Project Structure
```
/Users/ryancormack/code/ryancormack/strands-ts/
├── src/
│   ├── agent/
│   │   ├── agent.ts
│   │   └── conversationManager.ts
│   ├── eventLoop/
│   │   ├── eventLoop.ts
│   │   └── streaming.ts
│   ├── models/
│   │   ├── bedrock.ts
│   │   └── index.ts
│   ├── tools/
│   │   ├── mcp/
│   │   │   ├── mcpClient.ts
│   │   │   └── mcpAgentTool.ts
│   │   ├── registry.ts
│   │   └── types.ts
│   ├── types/
│   │   ├── content.ts
│   │   ├── models.ts
│   │   ├── tools.ts
│   │   └── exceptions.ts
│   ├── repl/
│   │   └── repl.ts
│   └── index.ts
├── examples/
│   └── dateToolExample.ts
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── .nvmrc (specifying node 20)
├── migration.md (this document)
└── README.md
```

### Package.json Configuration
```json
{
  "name": "@strands/agent-sdk",
  "version": "0.1.0",
  "engines": {
    "node": ">=20.0.0"
  },
  "packageManager": "pnpm@8.15.0",
  "type": "module",
  "scripts": {
    "build": "tsx scripts/build.ts",
    "dev": "tsx watch src/repl/repl.ts",
    "test": "vitest",
    "typecheck": "tsc --noEmit"
  }
}
```

### Key Differences from Python

1. **Async/Await**: Replace Python's asyncio with native JavaScript promises and async/await
2. **Threading**: Use Node.js worker threads instead of Python threading for MCP client
3. **Type System**: Leverage TypeScript's type system for better type safety
4. **Module System**: Use ES modules instead of Python imports
5. **Error Handling**: Use JavaScript Error classes and try/catch instead of Python exceptions

### Testing Strategy
- Unit tests using Vitest (TypeScript-native, fast)
- Integration tests for Bedrock and MCP
- Example scripts demonstrating key functionality

### Success Criteria
- Agent can be instantiated and run in a REPL loop
- Agent can successfully call Bedrock models
- Agent can discover and use MCP tools
- Example: Agent uses a date tool via MCP and returns today's date

## Next Steps After Phase 4

### Phase 5: Additional Model Providers
- OpenAI, Anthropic, Ollama support
- Custom provider interface

### Phase 6: A2A Support
- Multi-agent communication
- HTTP server integration

### Phase 7: Advanced Features
- Tool hot reloading
- Telemetry and metrics
- Structured output support

This migration plan provides a clear path to implement a TypeScript version of the Strands SDK with initial focus on core functionality needed for a working agent with MCP tool support.