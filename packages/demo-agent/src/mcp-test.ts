/**
 * Simple MCP test - Tests basic MCP connectivity and tool discovery
 */

import { MCPClient, createStdioTransport } from '@strands/agent-sdk';

async function testMCP() {
  console.log('Testing MCP connectivity...\n');

  // Create MCP client
  const mcpClient = new MCPClient(
    createStdioTransport('npx', ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'])
  );

  try {
    // Start connection
    await mcpClient.start();
    console.log('✅ Successfully connected to MCP server');

    // List tools
    const tools = await mcpClient.listTools();
    console.log(`\n📋 Available tools (${tools.length}):`);
    
    tools.forEach(tool => {
      console.log(`\n🔧 ${tool.toolName}`);
      console.log(`   Description: ${tool.toolSpec.description}`);
      console.log(`   Type: ${tool.toolType}`);
      console.log(`   Schema:`, JSON.stringify(tool.toolSpec.inputSchema, null, 2));
    });

    // Test a simple tool call if available
    if (tools.length > 0) {
      const readDirTool = tools.find(t => t.toolName === 'read_dir');
      if (readDirTool) {
        console.log('\n🧪 Testing read_dir tool...');
        const result = await readDirTool.invoke({
          toolUseId: 'test-1',
          input: { path: '/tmp' }
        });
        console.log('Result:', result);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mcpClient.stop();
    console.log('\n✅ Connection closed');
  }
}

testMCP().catch(console.error);