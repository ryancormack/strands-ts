#!/usr/bin/env node
/**
 * Calculator Agent Demo
 * 
 * This demo shows how to create mathematical tools and handle complex calculations.
 */

import { Agent, BedrockModel, tool } from '@strands/agent-sdk';
import { calculate, sqrt, power, percentage } from '@strands/tools/src/builtins/calculatorTool';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

async function main() {
  console.log(`
🧮 Calculator Agent Demo
Ask me to perform calculations!

Examples:
- What is 25 * 4?
- Calculate the square root of 144
- What is 15% of 200?
- What is 2 to the power of 10?
- Calculate (5 + 3) * 2

Type /exit to quit
`);

  // Create the agent with calculator tools
  const agent = new Agent({
    model: new BedrockModel({
      modelId: process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
      region: process.env.AWS_REGION || 'us-west-2',
    }),
    tools: [calculate, sqrt, power, percentage],
    systemPrompt: `You are a helpful calculator assistant. You can perform various mathematical calculations.
Use the appropriate tools to solve mathematical problems.
Always show your work and explain the calculations.`,
  });

  // Create readline interface
  const rl = readline.createInterface({ input, output });

  // Main loop
  while (true) {
    try {
      const userInput = await rl.question('\nYou: ');
      
      if (userInput.trim() === '/exit' || userInput.trim() === '/quit') {
        console.log('Goodbye! 🔢');
        break;
      }

      console.log('\nCalculator: ');
      await agent.call(userInput);
      
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // Cleanup
  rl.close();
  agent.destroy();
}

// Run the calculator agent
main().catch(console.error);