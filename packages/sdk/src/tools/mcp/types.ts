/**
 * Type definitions for MCP integration
 */

import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

/**
 * Factory function that creates an MCP transport
 */
export type MCPTransportFactory = () => Promise<Transport>;

/**
 * MCP-specific error types
 */
export class MCPClientInitializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MCPClientInitializationError';
  }
}

/**
 * MCP content type to image format mapping
 */
export const MIME_TO_FORMAT: Record<string, string> = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};