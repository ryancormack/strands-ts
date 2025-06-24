#!/usr/bin/env node
/**
 * Strands Agent SDK Demo
 * 
 * This is the main entry point for the demo package.
 * It provides a menu to select different agent demonstrations.
 */

import { spawn } from 'child_process';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

const demos = [
  {
    name: 'Basic Assistant',
    description: 'A conversational AI assistant with date/time awareness',
    script: 'assistant.ts',
    features: ['Conversation history', 'Built-in date/time tools', 'Natural language understanding']
  },
  {
    name: 'Weather Agent',
    description: 'An agent that provides weather information for cities',
    script: 'weather-agent.ts',
    features: ['Custom weather tools', 'City comparisons', 'Combined with date/time tools']
  },
  {
    name: 'Calculator Agent',
    description: 'A mathematical assistant for calculations',
    script: 'calculator-agent.ts',
    features: ['Basic arithmetic', 'Square roots', 'Percentages', 'Powers']
  },
  {
    name: 'Built-in Tools Demo',
    description: 'Showcase of all built-in SDK tools',
    script: 'tools-demo.ts',
    features: ['Date/time tools', 'HTTP requests', 'Web search', 'Calculator', 'Advanced math']
  },
  {
    name: 'MCP (Model Context Protocol) Demo',
    description: 'Connect to MCP servers and use their tools',
    script: 'mcp-demo.ts',
    features: ['File system access', 'Tool discovery', 'External tool integration', 'MCP server communication']
  },
  {
    name: 'MCP Interactive Session',
    description: 'Interactive REPL with MCP server tools',
    script: 'mcp-interactive.ts',
    features: ['Choose MCP server', 'Interactive queries', 'Tool exploration', 'Real-time file operations']
  },
  {
    name: 'Multi-Agent Orchestration',
    description: 'Demonstrates agents working together as tools',
    script: 'multi-agent-demo.ts',
    features: ['Agent hierarchies', 'Specialized agents', 'Task delegation', 'Stateful agents', 'Complex workflows']
  }
];

async function main() {
  console.log(`
${colors.bright}🚀 Strands Agent SDK Demos${colors.reset}
${colors.dim}Explore different agent capabilities${colors.reset}
`);

  const rl = readline.createInterface({ input, output });

  while (true) {
    // Display menu
    console.log(`${colors.yellow}Available Demos:${colors.reset}`);
    demos.forEach((demo, index) => {
      console.log(`
${colors.cyan}${index + 1}. ${demo.name}${colors.reset}
   ${colors.dim}${demo.description}${colors.reset}
   Features: ${demo.features.map(f => `• ${f}`).join(' ')}
`);
    });

    console.log(`${colors.cyan}0. Exit${colors.reset}\n`);

    try {
      const choice = await rl.question(`${colors.green}Select a demo (0-${demos.length}):${colors.reset} `);
      const choiceNum = parseInt(choice);

      if (choiceNum === 0) {
        console.log(`${colors.dim}Goodbye!${colors.reset}`);
        break;
      }

      if (choiceNum >= 1 && choiceNum <= demos.length) {
        const demo = demos[choiceNum - 1];
        console.log(`\n${colors.bright}Starting ${demo.name}...${colors.reset}\n`);
        
        // Close readline before spawning child process
        rl.close();
        
        // Run the selected demo
        const demoPath = join(__dirname, demo.script);
        const child = spawn('tsx', [demoPath], {
          stdio: 'inherit',
          env: { ...process.env }
        });

        // Wait for the demo to complete
        await new Promise((resolve) => {
          child.on('close', resolve);
        });

        // Recreate readline interface
        const newRl = readline.createInterface({ input, output });
        console.log(`\n${colors.dim}Demo completed. Press Enter to continue...${colors.reset}`);
        await newRl.question('');
        newRl.close();
        
        // Clear console for clean menu display
        console.clear();
      } else {
        console.log(`${colors.red}Invalid choice. Please try again.${colors.reset}\n`);
      }
    } catch (error) {
      console.error(`${colors.red}Error:${colors.reset}`, error);
    }
  }

  rl.close();
}

// Run the main menu
main().catch(console.error);