/**
 * Standard Input/Output transport for MCP servers
 * 
 * This transport uses the MCP SDK's StdioClientTransport which handles spawning
 * and communicating with the child process
 */

import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { MCPTransportFactory } from '../types.js';

/**
 * Creates a stdio transport factory for MCP servers
 */
export function createStdioTransport(
  command: string,
  args: string[] = [],
  env?: Record<string, string>
): MCPTransportFactory {
  return async (): Promise<Transport> => {
    const transport = new StdioClientTransport({
      command,
      args,
      env
    });

    // The transport will handle spawning the process when start() is called
    // by the MCP client
    return transport;
  };
}