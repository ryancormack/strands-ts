#!/usr/bin/env npx tsx
/**
 * Quick test to verify imports work
 */

import { Agent, BedrockModel, currentDate } from '../../../src/index.js';

console.log('✅ Imports successful!');
console.log('Available exports:', {
  Agent: typeof Agent,
  BedrockModel: typeof BedrockModel,
  currentDate: typeof currentDate
});

// Quick test
const agent = new Agent({
  model: new BedrockModel(),
  systemPrompt: 'Test agent'
});

console.log('✅ Agent created successfully!');
console.log('Available tools:', agent.toolNames);

agent.destroy();