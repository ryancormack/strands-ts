#!/usr/bin/env node
/**
 * Basic Assistant Demo
 * 
 * This demo shows a simple conversational assistant that can:
 * - Answer questions about dates and times
 * - Maintain conversation context
 * - Use built-in tools automatically
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
${colors.bright}🤖 Strands Assistant Demo${colors.reset}
${colors.dim}Built-in tools: current_date, current_time, current_datetime${colors.reset}

Type your message or:
  ${colors.cyan}/help${colors.reset} - Show available commands
  ${colors.cyan}/exit${colors.reset} - Exit the assistant
`);

  // Create the agent with Bedrock model and built-in tools
  const agent = new Agent({
    model: new BedrockModel({
      modelId: process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
      region: process.env.AWS_REGION || 'us-west-2',
    }),
    tools: builtinTools,
    systemPrompt: `You are a helpful AI assistant. You have access to date and time tools.
When users ask about dates, times, or anything time-related, use the appropriate tools.
Be conversational and friendly.`,
  });

  // Create readline interface
  const rl = readline.createInterface({ input, output });

  // Main loop
  while (true) {
    try {
      const userInput = await rl.question(`${colors.green}You:${colors.reset} `);
      
      if (userInput.trim() === '/exit' || userInput.trim() === '/quit') {
        console.log(`${colors.dim}Goodbye!${colors.reset}`);
        break;
      }

      if (userInput.trim() === '/help') {
        console.log(`
${colors.yellow}Available commands:${colors.reset}
  /help  - Show this help message
  /exit  - Exit the assistant
  /tools - Show available tools
  /clear - Clear conversation history

${colors.yellow}Example questions:${colors.reset}
  - What is today's date?
  - What time is it in Tokyo?
  - How many days until Christmas?
  - What day of the week is it?
`);
        continue;
      }

      if (userInput.trim() === '/tools') {
        console.log(`${colors.yellow}Available tools:${colors.reset}`);
        agent.toolNames.forEach(tool => {
          console.log(`  - ${tool}`);
        });
        continue;
      }

      if (userInput.trim() === '/clear') {
        agent.messages = [];
        console.log(`${colors.green}Conversation cleared${colors.reset}`);
        continue;
      }

      // Process with agent
      console.log(`${colors.blue}Assistant:${colors.reset} `);
      
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

// Run the assistant
main().catch(console.error);