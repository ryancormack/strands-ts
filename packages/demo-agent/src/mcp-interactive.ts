/**
 * Interactive MCP Demo
 * 
 * This demo shows how to use MCP servers with the Strands Agent SDK
 * in an interactive REPL-like environment
 */

import { Agent, BedrockModel, MCPClient, createStdioTransport } from '@strands/agent-sdk';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function main() {
  console.log(`
${colors.bright}🔧 MCP Interactive Demo${colors.reset}
${colors.dim}This demo connects to an MCP filesystem server${colors.reset}
`);

  // Available MCP servers to choose from
  const servers = [
    {
      name: 'Filesystem (Current Directory)',
      transport: () => createStdioTransport('npx', ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()])
    },
    {
      name: 'Filesystem (Temp Directory)',
      transport: () => createStdioTransport('npx', ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'])
    },
    {
      name: 'Memory (Example Server)',
      transport: () => createStdioTransport('npx', ['-y', '@modelcontextprotocol/server-memory'])
    }
  ];

  const rl = readline.createInterface({ input, output });

  try {
    // Select MCP server
    console.log(`${colors.yellow}Available MCP Servers:${colors.reset}`);
    servers.forEach((server, index) => {
      console.log(`${index + 1}. ${server.name}`);
    });

    const serverChoice = await rl.question(`\n${colors.green}Select server (1-${servers.length}):${colors.reset} `);
    const serverIndex = parseInt(serverChoice) - 1;

    if (serverIndex < 0 || serverIndex >= servers.length) {
      console.log(`${colors.red}Invalid choice${colors.reset}`);
      process.exit(1);
    }

    const selectedServer = servers[serverIndex];
    console.log(`\n${colors.cyan}Connecting to ${selectedServer.name}...${colors.reset}`);

    // Create and start MCP client
    const mcpClient = new MCPClient(selectedServer.transport());
    await mcpClient.start();
    console.log(`${colors.green}✓ Connected successfully${colors.reset}\n`);

    // Discover tools
    console.log(`${colors.yellow}Discovering available tools...${colors.reset}`);
    const tools = await mcpClient.listTools();
    
    console.log(`${colors.bright}Found ${tools.length} tools:${colors.reset}`);
    const toolGroups = new Map<string, typeof tools>();
    
    // Group tools by prefix for better organization
    tools.forEach(tool => {
      const prefix = tool.toolName.split('_')[0];
      if (!toolGroups.has(prefix)) {
        toolGroups.set(prefix, []);
      }
      toolGroups.get(prefix)!.push(tool);
    });

    // Display tools by group
    toolGroups.forEach((groupTools, prefix) => {
      console.log(`\n${colors.cyan}${prefix} tools:${colors.reset}`);
      groupTools.forEach(tool => {
        console.log(`  • ${colors.bright}${tool.toolName}${colors.reset}: ${tool.toolSpec.description}`);
      });
    });

    // Create agent
    const agent = new Agent({
      model: new BedrockModel({
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        region: process.env.AWS_REGION || 'us-east-1'
      }),
      tools: tools,
      systemPrompt: 'You are a helpful assistant with access to MCP tools. Be concise and informative in your responses.'
    });

    // Interactive loop
    console.log(`\n${colors.bright}Ready! You can now interact with the agent.${colors.reset}`);
    console.log(`${colors.dim}Type 'help' for suggestions, 'tools' to list tools, or 'exit' to quit.${colors.reset}\n`);

    while (true) {
      const query = await rl.question(`${colors.green}You:${colors.reset} `);

      if (query.toLowerCase() === 'exit') {
        break;
      }

      if (query.toLowerCase() === 'tools') {
        console.log(`\n${colors.yellow}Available tools:${colors.reset}`);
        tools.forEach(tool => {
          console.log(`  • ${tool.toolName}: ${tool.toolSpec.description}`);
        });
        console.log();
        continue;
      }

      if (query.toLowerCase() === 'help') {
        console.log(`\n${colors.yellow}Example queries:${colors.reset}`);
        console.log('  • "List all files in the current directory"');
        console.log('  • "Read the package.json file"');
        console.log('  • "Create a new file called test.txt with some content"');
        console.log('  • "What is the total size of all JSON files?"');
        console.log('  • "Find all TypeScript files and count them"');
        console.log();
        continue;
      }

      console.log(`${colors.blue}Agent:${colors.reset} ${colors.dim}Thinking...${colors.reset}`);
      
      try {
        const response = await agent.call(query);
        
        // Clear the "Thinking..." line
        process.stdout.write('\x1b[1A\x1b[2K');
        
        console.log(`${colors.blue}Agent:${colors.reset} ${response.text}\n`);
      } catch (error) {
        console.error(`${colors.red}Error:${colors.reset}`, error);
      }
    }

    // Cleanup
    console.log(`\n${colors.yellow}Closing connection...${colors.reset}`);
    await mcpClient.stop();
    console.log(`${colors.green}✓ Done${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error);
  } finally {
    rl.close();
  }
}

// Run the demo
main().catch(console.error);