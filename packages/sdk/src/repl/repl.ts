#!/usr/bin/env node
/**
 * REPL (Read-Eval-Print Loop) implementation for interactive agent usage
 */

import * as readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { Agent } from '../agent/agent.js';
import { BedrockModel } from '../models/bedrock.js';

// ANSI color codes
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

export class AgentREPL {
  private agent: Agent;
  private rl: readline.Interface;
  private isProcessing: boolean = false;

  constructor(agent?: Agent) {
    this.agent = agent || new Agent({
      model: new BedrockModel(),
      name: 'REPL Agent',
      description: 'Interactive agent for REPL usage'
    });

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: `${colors.cyan}> ${colors.reset}`,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Handle line input
    this.rl.on('line', async (input) => {
      if (this.isProcessing) {
        console.log(`${colors.yellow}Please wait for the current request to complete...${colors.reset}`);
        return;
      }

      const trimmedInput = input.trim();
      
      // Handle special commands
      if (trimmedInput === '') {
        this.rl.prompt();
        return;
      }

      if (trimmedInput === '/exit' || trimmedInput === '/quit') {
        this.close();
        return;
      }

      if (trimmedInput === '/help') {
        this.showHelp();
        this.rl.prompt();
        return;
      }

      if (trimmedInput === '/clear') {
        this.clearConversation();
        this.rl.prompt();
        return;
      }

      if (trimmedInput === '/tools') {
        this.showTools();
        this.rl.prompt();
        return;
      }

      if (trimmedInput === '/history') {
        this.showHistory();
        this.rl.prompt();
        return;
      }

      // Process user input
      await this.processInput(trimmedInput);
    });

    // Handle SIGINT (Ctrl+C)
    this.rl.on('SIGINT', () => {
      if (this.isProcessing) {
        console.log(`\n${colors.yellow}Interrupting current request...${colors.reset}`);
        this.isProcessing = false;
        this.rl.prompt();
      } else {
        console.log(`\n${colors.dim}(To exit, type /exit or press Ctrl+C again)${colors.reset}`);
        this.rl.prompt();
      }
    });

    // Handle close
    this.rl.on('close', () => {
      this.close();
    });
  }

  private async processInput(input: string): Promise<void> {
    this.isProcessing = true;
    
    try {
      console.log(`${colors.dim}Assistant:${colors.reset} `);
      
      // Call the agent
      const result = await this.agent.call(input);
      
      // The PrintingCallbackHandler already printed the response
      console.log(''); // New line after response
      
    } catch (error) {
      console.error(`\n${colors.red}Error: ${error}${colors.reset}`);
    } finally {
      this.isProcessing = false;
      this.rl.prompt();
    }
  }

  private showHelp(): void {
    console.log(`
${colors.bright}Strands Agent REPL${colors.reset}

${colors.yellow}Commands:${colors.reset}
  /help     - Show this help message
  /exit     - Exit the REPL
  /quit     - Exit the REPL
  /clear    - Clear conversation history
  /tools    - Show available tools
  /history  - Show conversation history

${colors.yellow}Usage:${colors.reset}
  Simply type your message and press Enter to interact with the agent.
  The agent will respond and may use tools to help answer your questions.
`);
  }

  private showTools(): void {
    const tools = this.agent.toolNames;
    
    if (tools.length === 0) {
      console.log(`${colors.dim}No tools available${colors.reset}`);
    } else {
      console.log(`${colors.yellow}Available tools:${colors.reset}`);
      for (const tool of tools) {
        console.log(`  - ${tool}`);
      }
    }
  }

  private showHistory(): void {
    const messages = this.agent.messages;
    
    if (messages.length === 0) {
      console.log(`${colors.dim}No conversation history${colors.reset}`);
      return;
    }

    console.log(`${colors.yellow}Conversation history:${colors.reset}`);
    for (const message of messages) {
      const role = message.role === 'user' ? colors.green + 'User' : colors.blue + 'Assistant';
      const content = message.content
        .map(block => block.text || '[tool use/result]')
        .filter(text => text)
        .join(' ');
      
      console.log(`${role}${colors.reset}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
    }
  }

  private clearConversation(): void {
    this.agent.messages = [];
    console.log(`${colors.green}Conversation history cleared${colors.reset}`);
  }

  public start(): void {
    console.log(`
${colors.bright}Welcome to Strands Agent REPL${colors.reset}
${colors.dim}Type /help for commands, or start chatting with the agent${colors.reset}
`);
    
    this.rl.prompt();
  }

  private close(): void {
    console.log(`\n${colors.dim}Goodbye!${colors.reset}`);
    this.agent.destroy();
    this.rl.close();
    process.exit(0);
  }
}

// Main entry point when run directly
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  const repl = new AgentREPL();
  repl.start();
}