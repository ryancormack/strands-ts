#!/usr/bin/env node
/**
 * Calculator Agent Demo
 * 
 * This demo shows how to create mathematical tools and handle complex calculations.
 */

import { Agent, BedrockModel, tool } from '@strands/agent-sdk';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

// Create calculator tools
const calculate = tool({
  name: 'calculate',
  description: 'Perform basic arithmetic calculations',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'Mathematical expression to evaluate (e.g., "2 + 2", "10 * 5", "100 / 4")'
      }
    },
    required: ['expression']
  }
}, async ({ expression }) => {
  try {
    // Simple safe math evaluation (in production, use a proper math parser)
    const result = Function(`"use strict"; return (${expression})`)();
    return `${expression} = ${result}`;
  } catch (error) {
    return `Error evaluating expression: ${error.message}`;
  }
});

const sqrt = tool({
  name: 'square_root',
  description: 'Calculate the square root of a number',
  parameters: {
    type: 'object',
    properties: {
      number: {
        type: 'number',
        description: 'The number to find the square root of'
      }
    },
    required: ['number']
  }
}, async ({ number }) => {
  if (number < 0) {
    return `Cannot calculate square root of negative number: ${number}`;
  }
  return `√${number} = ${Math.sqrt(number)}`;
});

const power = tool({
  name: 'power',
  description: 'Calculate x raised to the power of y',
  parameters: {
    type: 'object',
    properties: {
      base: {
        type: 'number',
        description: 'The base number'
      },
      exponent: {
        type: 'number',
        description: 'The exponent'
      }
    },
    required: ['base', 'exponent']
  }
}, async ({ base, exponent }) => {
  const result = Math.pow(base, exponent);
  return `${base}^${exponent} = ${result}`;
});

const percentage = tool({
  name: 'percentage',
  description: 'Calculate percentage (what is X% of Y, or X is what % of Y)',
  parameters: {
    type: 'object',
    properties: {
      value: {
        type: 'number',
        description: 'The value'
      },
      percent: {
        type: 'number',
        description: 'The percentage'
      },
      operation: {
        type: 'string',
        enum: ['of', 'is'],
        description: '"of" for X% of Y, "is" for X is what % of Y'
      }
    },
    required: ['value', 'percent', 'operation']
  }
}, async ({ value, percent, operation }) => {
  if (operation === 'of') {
    const result = (percent / 100) * value;
    return `${percent}% of ${value} = ${result}`;
  } else {
    const result = (value / percent) * 100;
    return `${value} is ${result}% of ${percent}`;
  }
});

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
    includeBuiltinTools: false, // Don't include date/time tools for this demo
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