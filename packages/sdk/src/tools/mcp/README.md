# MCP (Model Context Protocol) Integration

The Strands Agent SDK provides seamless integration with MCP servers, allowing agents to use tools provided by any MCP-compatible server.

## Quick Start

```typescript
import { Agent, BedrockModel, MCPClient, createStdioTransport } from '@strands/agent-sdk';

// Create MCP client for a filesystem server
const mcpClient = new MCPClient(
  createStdioTransport('npx', ['-y', '@modelcontextprotocol/server-filesystem'])
);

// Start the connection
await mcpClient.start();

// Discover available tools
const tools = await mcpClient.listTools();

// Create agent with MCP tools
const agent = new Agent({
  model: new BedrockModel({ modelId: 'claude-3-sonnet' }),
  tools: tools,
  systemPrompt: 'You are a helpful assistant with file system access.'
});

// Use the agent
const result = await agent.call('What files are in the current directory?');

// Cleanup
await mcpClient.stop();
```

## Transport Options

### Stdio Transport (Local Servers)

```typescript
// Filesystem server
createStdioTransport('npx', ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/dir'])

// Memory server
createStdioTransport('npx', ['-y', '@modelcontextprotocol/server-memory'])

// Custom server
createStdioTransport('./my-mcp-server', ['--arg1', 'value1'])
```

### SSE Transport (Remote Servers)

```typescript
import { createSSETransport } from '@strands/agent-sdk';

const transport = createSSETransport('https://my-mcp-server.com/sse');

// Note: The MCP SDK's SSEClientTransport does not support custom headers.
// If you need authentication, the server should handle it via URL parameters
// or implement a custom transport.
```

## Available MCP Servers

Popular MCP servers you can use:

- **@modelcontextprotocol/server-filesystem** - File system operations
- **@modelcontextprotocol/server-memory** - In-memory key-value store
- **@modelcontextprotocol/server-github** - GitHub API access
- **@modelcontextprotocol/server-slack** - Slack integration
- **@modelcontextprotocol/server-postgres** - PostgreSQL database access

## Error Handling

```typescript
try {
  await mcpClient.start();
} catch (error) {
  if (error instanceof MCPClientInitializationError) {
    console.error('Failed to connect to MCP server:', error.message);
  }
}
```

## Advanced Usage

### Multiple MCP Servers

```typescript
// Connect to multiple MCP servers
const fsClient = new MCPClient(
  createStdioTransport('npx', ['-y', '@modelcontextprotocol/server-filesystem'])
);
const dbClient = new MCPClient(
  createStdioTransport('npx', ['-y', '@modelcontextprotocol/server-postgres'])
);

await fsClient.start();
await dbClient.start();

const fsTools = await fsClient.listTools();
const dbTools = await dbClient.listTools();

// Combine tools from multiple servers
const agent = new Agent({
  model: new BedrockModel({ modelId: 'claude-3-sonnet' }),
  tools: [...fsTools, ...dbTools]
});
```

### Custom Tool Filtering

```typescript
const allTools = await mcpClient.listTools();

// Filter tools by name
const readTools = allTools.filter(tool => 
  tool.toolName.includes('read')
);

// Filter tools by capability
const fileTools = allTools.filter(tool =>
  tool.toolSpec.description.toLowerCase().includes('file')
);
```

## Debugging

Enable debug logging to see MCP communication:

```bash
DEBUG=1 npm run your-script
```

## Best Practices

1. **Lifecycle Management**: Always call `stop()` when done
2. **Error Handling**: Wrap MCP operations in try-catch blocks
3. **Tool Discovery**: Cache tool lists if connecting to the same server multiple times
4. **Security**: Be cautious with filesystem and database access tools

## Examples

See the demo package for complete examples:
- `mcp-demo.ts` - Basic MCP usage
- `mcp-interactive.ts` - Interactive REPL with MCP tools
- `mcp-test.ts` - Testing MCP connectivity