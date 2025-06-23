/**
 * Server-Sent Events (SSE) transport for MCP servers
 * 
 * This transport connects to MCP servers over HTTP using Server-Sent Events
 */

import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { MCPTransportFactory } from '../types.js';

/**
 * Creates an SSE transport factory for MCP servers
 * 
 * Note: The SSEClientTransport from MCP SDK does not support custom headers.
 * If you need custom headers, consider implementing a custom transport.
 */
export function createSSETransport(
  url: string
): MCPTransportFactory {
  return async (): Promise<Transport> => {
    const sseUrl = new URL(url);
    
    const transport = new SSEClientTransport(sseUrl);

    return transport;
  };
}