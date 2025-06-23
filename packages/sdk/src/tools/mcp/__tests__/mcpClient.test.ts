/**
 * Unit tests for MCPClient
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MCPClient } from '../mcpClient.js';
import { MCPClientInitializationError } from '../types.js';

describe('MCPClient', () => {
  let mockTransport: any;
  let mockTransportFactory: any;
  let client: MCPClient;

  beforeEach(() => {
    // Mock transport
    mockTransport = {
      close: vi.fn()
    };
    
    mockTransportFactory = vi.fn().mockResolvedValue(mockTransport);
    client = new MCPClient(mockTransportFactory);
  });

  afterEach(async () => {
    // Cleanup
    try {
      await client.stop();
    } catch {
      // Ignore errors during cleanup
    }
  });

  describe('start', () => {
    it('should initialize the client successfully', async () => {
      // Mock successful connection
      const mockClientConnect = vi.fn().mockResolvedValue(undefined);
      vi.spyOn(client as any, 'initialize').mockImplementation(async () => {
        (client as any).isInitialized = true;
        (client as any).client = { connect: mockClientConnect };
      });

      const result = await client.start();
      
      expect(result).toBe(client);
      expect((client as any).isInitialized).toBe(true);
    });

    it('should throw error if already initialized', async () => {
      // Initialize once
      vi.spyOn(client as any, 'initialize').mockImplementation(async () => {
        (client as any).isInitialized = true;
      });
      await client.start();

      // Try to initialize again
      await expect(client.start()).rejects.toThrow(MCPClientInitializationError);
    });
  });

  describe('listTools', () => {
    it('should throw error if not initialized', async () => {
      await expect(client.listTools()).rejects.toThrow(MCPClientInitializationError);
    });
  });

  describe('callTool', () => {
    it('should throw error if not initialized', async () => {
      await expect(client.callTool('test-id', 'test-tool')).rejects.toThrow(MCPClientInitializationError);
    });
  });

  describe('stop', () => {
    it('should reset client state', async () => {
      // Initialize first
      vi.spyOn(client as any, 'initialize').mockImplementation(async () => {
        (client as any).isInitialized = true;
        (client as any).client = { close: vi.fn() };
      });
      await client.start();

      // Stop the client
      await client.stop();

      expect((client as any).isInitialized).toBe(false);
      expect((client as any).client).toBeNull();
    });
  });
});