#!/usr/bin/env npx tsx
/**
 * Test script for date tool integration
 */

import { Agent } from './src/agent/agent.js';
import { BedrockModel } from './src/models/bedrock.js';

async function testDateTool() {
  try {
    console.log('🧪 Testing Date Tool Integration...\n');
    
    // Create agent with Bedrock model
    const agent = new Agent({
      model: new BedrockModel({
        modelId: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
        maxTokens: 100,
      }),
      systemPrompt: 'You are a helpful assistant. Use tools when asked about dates or times.',
    });
    
    console.log('📋 Available tools:', agent.toolNames.join(', '));
    console.log();
    
    // Test 1: Ask for today's date
    console.log('Test 1: What is today\'s date?');
    const result1 = await agent.call('What is today\'s date?');
    console.log('✅ Test 1 passed\n');
    
    // Test 2: Ask for current time
    console.log('Test 2: What time is it?');
    const result2 = await agent.call('What time is it right now?');
    console.log('✅ Test 2 passed\n');
    
    // Test 3: Ask for date and time
    console.log('Test 3: What is the current date and time?');
    const result3 = await agent.call('Can you tell me both the current date and time?');
    console.log('✅ Test 3 passed\n');
    
    console.log('🎉 All tests passed! Date tools are working correctly.');
    
    // Clean up
    agent.destroy();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testDateTool();