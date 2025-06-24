/**
 * MCP Demo - Demonstrates using MCP tools with the Strands Agent SDK
 * 
 * This example shows how to connect to an MCP server and use its tools
 */

import { Agent, BedrockModel, MCPClient, createStdioTransport } from '@strands/agent-sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🚀 Starting MCP Demo...\n');

  // Create MCP client for the filesystem server
  const mcpClient = new MCPClient(
    createStdioTransport('npx', ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()])
  );

  try {
    // Start the MCP connection
    console.log('📡 Connecting to MCP server...');
    await mcpClient.start();
    console.log('✅ Connected to MCP server\n');

    // Discover available tools
    console.log('🔧 Discovering available tools...');
    const mcpTools = await mcpClient.listTools();
    console.log(`Found ${mcpTools.length} tools:`);
    mcpTools.forEach(tool => {
      console.log(`  - ${tool.toolName}: ${tool.toolSpec.description}`);
    });
    console.log();

    // Create agent with MCP tools
    const agent = new Agent({
      model: new BedrockModel({
        modelId: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
        region: process.env.AWS_REGION || 'us-west-2'
      }),
      tools: mcpTools,
      systemPrompt: 'You are a helpful assistant with file system access. Be concise in your responses.'
    });

    // Example queries
    const queries = [
      'What files are in the current directory?',
      'Can you read the package.json file and tell me what the project name is?',
      'Create a file called hello.txt with the content "Hello from MCP!"'
    ];

    for (const query of queries) {
      console.log(`\n💬 User: ${query}`);
      // const result = await agent.call(query);
      // console.log(`🤖 Agent: ${result.text}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await mcpClient.stop();
    console.log('✅ MCP connection closed');
  }
}

// Run the demo
main().catch(console.error);