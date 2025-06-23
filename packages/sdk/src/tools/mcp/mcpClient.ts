/**
 * Model Context Protocol (MCP) client implementation
 * 
 * This module provides the MCPClient class which handles connections to MCP servers.
 * It manages the lifecycle of MCP connections, including initialization, tool discovery,
 * tool invocation, and proper cleanup of resources.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { 
  CallToolResult as MCPCallToolResult
} from '@modelcontextprotocol/sdk/types.js';
import { v4 as uuidv4 } from 'uuid';
import { 
  MCPTransportFactory, 
  MCPClientInitializationError,
  MIME_TO_FORMAT 
} from './types.js';
import { ToolResult, ToolResultContent } from '../../types/tools.js';
import { MCPAgentTool } from './mcpAgentTool.js';

const CLIENT_SESSION_NOT_RUNNING_ERROR_MESSAGE = 
  'the client session is not running. Ensure the agent is used within ' +
  'the MCP client context manager. For more information see: ' +
  'https://strandsagents.com/latest/user-guide/concepts/tools/mcp-tools/#mcpclientinitializationerror';

/**
 * Represents a connection to a Model Context Protocol (MCP) server.
 * 
 * This class implements a lifecycle pattern for efficient connection management,
 * allowing reuse of the same connection for multiple tool calls to reduce latency.
 */
export class MCPClient {
  private sessionId: string;
  private transportFactory: MCPTransportFactory;
  private client: Client | null = null;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(transportFactory: MCPTransportFactory) {
    this.sessionId = uuidv4();
    this.transportFactory = transportFactory;
    this.debug('initializing MCPClient connection');
  }

  /**
   * Starts the MCP client connection
   */
  async start(): Promise<MCPClient> {
    if (this.isInitialized) {
      throw new MCPClientInitializationError('the client session is currently running');
    }

    if (this.initializationPromise) {
      await this.initializationPromise;
      return this;
    }

    this.debug('starting MCPClient');
    
    this.initializationPromise = this.initialize();
    
    try {
      await this.initializationPromise;
      this.debug('the client initialization was successful');
    } catch (error) {
      this.debug(`client failed to initialize: ${error}`);
      throw new MCPClientInitializationError('the client initialization failed');
    }

    return this;
  }

  /**
   * Stops the MCP client connection
   */
  async stop(): Promise<void> {
    this.debug('stopping MCPClient');
    
    if (this.client) {
      await this.client.close();
      this.client = null;
    }

    // Reset fields to allow instance reuse
    this.isInitialized = false;
    this.initializationPromise = null;
    this.sessionId = uuidv4();
    
    this.debug('MCPClient stopped');
  }

  /**
   * Lists available tools from the MCP server
   */
  async listTools(): Promise<MCPAgentTool[]> {
    this.debug('listing MCP tools');
    
    if (!this.isSessionActive()) {
      throw new MCPClientInitializationError(CLIENT_SESSION_NOT_RUNNING_ERROR_MESSAGE);
    }

    const listToolsResponse = await this.client!.listTools();
    this.debug(`received ${listToolsResponse.tools.length} tools from MCP server`);

    const mcpTools = listToolsResponse.tools.map(tool => new MCPAgentTool(tool, this));
    this.debug(`successfully adapted ${mcpTools.length} MCP tools`);
    
    return mcpTools;
  }

  /**
   * Calls a tool on the MCP server
   */
  async callTool(
    toolUseId: string,
    name: string,
    args?: Record<string, unknown>
  ): Promise<ToolResult> {
    this.debug(`calling MCP tool '${name}' with tool_use_id=${toolUseId}`);
    
    if (!this.isSessionActive()) {
      throw new MCPClientInitializationError(CLIENT_SESSION_NOT_RUNNING_ERROR_MESSAGE);
    }

    try {
      const result = await this.client!.callTool({ name, arguments: args }) as MCPCallToolResult;
      this.debug(`received tool result with ${result.content.length} content items`);

      const mappedContent = result.content
        .map((content: any) => this.mapMCPContentToToolResultContent(content))
        .filter((content): content is ToolResultContent => content !== null);

      const status = result.isError ? 'error' : 'success';
      this.debug(`tool execution completed with status: ${status}`);
      
      return {
        status,
        toolUseId,
        content: mappedContent
      };
    } catch (error) {
      this.debug(`tool execution failed: ${error}`);
      return {
        status: 'error',
        toolUseId,
        content: [{ text: `Tool execution failed: ${error}` }]
      };
    }
  }

  /**
   * Initializes the MCP client connection
   */
  private async initialize(): Promise<void> {
    try {
      const transport = await this.transportFactory();
      this.debug('transport connection established');
      
      this.client = new Client({
        name: 'strands-agent',
        version: '0.1.0'
      }, {
        capabilities: {}
      });

      await this.client.connect(transport);
      this.debug('client connected successfully');
      
      this.isInitialized = true;
    } catch (error) {
      throw new MCPClientInitializationError(`Failed to initialize MCP client: ${error}`);
    }
  }

  /**
   * Maps MCP content types to tool result content types
   */
  private mapMCPContentToToolResultContent(
    content: any
  ): ToolResultContent | null {
    // Handle text content
    if (content.type === 'text' && 'text' in content) {
      this.debug('mapping MCP text content');
      return { text: content.text };
    } 
    // Handle image content
    else if (content.type === 'image' && 'data' in content && 'mimeType' in content) {
      this.debug(`mapping MCP image content with mime type: ${content.mimeType}`);
      const format = MIME_TO_FORMAT[content.mimeType];
      if (!format) {
        this.debug(`unsupported mime type: ${content.mimeType}`);
        return null;
      }
      
      // Convert base64 to buffer
      const buffer = Buffer.from(content.data, 'base64');
      
      return {
        image: {
          format: format as any,
          source: { bytes: buffer }
        }
      };
    } 
    // Handle resource content (convert to text)
    else if (content.type === 'resource' && 'resource' in content) {
      this.debug('mapping MCP resource content');
      // Resources can have text or blob data
      if (content.resource.text) {
        return { text: content.resource.text };
      } else if (content.resource.blob) {
        // For now, we'll convert blob resources to text indicating it's binary data
        return { text: `[Binary resource: ${content.resource.uri}]` };
      }
      return { text: `[Resource: ${content.resource.uri}]` };
    }
    else {
      this.debug(`unhandled content type: ${content.type} - dropping content`);
      return null;
    }
  }

  /**
   * Checks if the session is active
   */
  private isSessionActive(): boolean {
    return this.client !== null && this.isInitialized;
  }

  /**
   * Debug logging helper
   */
  private debug(message: string): void {
    if (process.env.DEBUG) {
      console.debug(`[MCPClient ${this.sessionId}] ${message}`);
    }
  }
}