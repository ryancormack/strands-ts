// Test file to verify MCP type fixes
import { MCPClient, createStdioTransport, createSSETransport } from './packages/sdk/src/index.js';

// Test stdio transport
const stdioTransport = createStdioTransport('npx', ['test']);

// Test SSE transport (no headers parameter)
const sseTransport = createSSETransport('https://example.com/sse');

// Test MCP client
async function test() {
  const client = new MCPClient(stdioTransport);
  await client.start();
  const tools = await client.listTools();
  await client.stop();
}

console.log('Type checks passed!');