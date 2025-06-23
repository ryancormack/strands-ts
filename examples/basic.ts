/**
 * Basic example of using the Strands Agent SDK
 */

import { Agent } from '../src/index.js';

async function main() {
  // Create an agent
  const agent = new Agent({
    name: 'Example Agent',
    description: 'A simple example agent',
    systemPrompt: 'You are a helpful assistant.',
  });

  try {
    // Simple conversation
    console.log('User: What is TypeScript?');
    const result = await agent.call('What is TypeScript?');
    
    console.log('\nAgent response:', result.content);
    console.log('\nMetrics:', result.metrics);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    agent.destroy();
  }
}

// Run the example
main().catch(console.error);