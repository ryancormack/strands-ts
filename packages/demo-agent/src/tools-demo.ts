#!/usr/bin/env node
/**
 * Built-in Tools Demo
 * 
 * This demo showcases all the built-in tools available in the SDK:
 * - Date/time tools
 * - HTTP request tool
 * - Web search tool
 * - Calculator tools
 */

import { Agent, BedrockModel } from '@strands/agent-sdk';
import { builtinTools } from '@strands/tools';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

async function main() {
  console.log(`
${colors.bright}🧰 Strands Built-in Tools Demo${colors.reset}
This agent has access to all built-in tools.

${colors.yellow}Available tools:${colors.reset}
• ${colors.cyan}Date/Time${colors.reset}: current_date, current_time, current_datetime
• ${colors.cyan}Web${colors.reset}: http_request, search_web
• ${colors.cyan}Math${colors.reset}: calculator, advanced_calculator

${colors.yellow}Example questions:${colors.reset}
• What's today's date?
• What time is it in Tokyo?
• Calculate 2^10 + sqrt(144)
• What's 15% of 250?
• Fetch the content from https://api.github.com
• Search for information about TypeScript
• Solve x^2 + 5x + 6 = 0

Type /tools to see all available tools
Type /exit to quit
`);

  // Create the agent with all built-in tools
  const agent = new Agent({
    model: new BedrockModel({
      modelId: process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
      region: process.env.AWS_REGION || 'us-west-2',
    }),
    tools: builtinTools,
    systemPrompt: `You are a helpful AI assistant with access to various tools.
When users ask questions, use the appropriate tools to provide accurate information.
For calculations, use the calculator tool.
For web requests, use the http_request tool.
For searching information, use the search_web tool.
For date/time queries, use the appropriate date/time tools.
Always explain what tool you're using and why.`
  });

  // Create readline interface
  const rl = readline.createInterface({ input, output });

  // Main loop
  while (true) {
    try {
      const userInput = await rl.question(`\n${colors.green}You:${colors.reset} `);
      
      if (userInput.trim() === '/exit' || userInput.trim() === '/quit') {
        console.log(`${colors.dim}Goodbye!${colors.reset}`);
        break;
      }

      if (userInput.trim() === '/tools') {
        console.log(`\n${colors.yellow}Available tools:${colors.reset}`);
        agent.toolNames.forEach(tool => {
          console.log(`  • ${tool}`);
        });
        continue;
      }

      if (userInput.trim() === '/help') {
        console.log(`
${colors.yellow}Commands:${colors.reset}
  /help  - Show this help message
  /tools - List all available tools
  /exit  - Exit the demo

${colors.yellow}Tool Categories:${colors.reset}
  
${colors.cyan}Date/Time Tools:${colors.reset}
  • current_date - Get today's date in various formats
  • current_time - Get current time with timezone support
  • current_datetime - Get both date and time together

${colors.cyan}Web Tools:${colors.reset}
  • http_request - Make HTTP requests to APIs and websites
  • search_web - Search for information (mock implementation)

${colors.cyan}Math Tools:${colors.reset}
  • calculator - Basic arithmetic calculations
  • advanced_calculator - Advanced math operations (evaluate, solve, simplify)
`);
        continue;
      }

      // Process with agent
      console.log(`\n${colors.blue}Assistant:${colors.reset} `);
      
      const result = await agent.call(userInput);
      
      // Add some spacing for readability
      console.log();
      
    } catch (error) {
      console.error(`${colors.red}Error:${colors.reset}`, error);
    }
  }

  // Cleanup
  rl.close();
  agent.destroy();
}

// Run the demo
main().catch(console.error);