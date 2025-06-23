/**
 * Example of using the Strands Agent SDK with AWS Bedrock
 */

import { Agent, BedrockModel } from '../src/index.js';

async function main() {
  console.log('=== Strands Agent with AWS Bedrock Example ===\n');

  // Create a Bedrock model with custom configuration
  const model = new BedrockModel({
    modelId: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
    region: process.env.AWS_REGION || 'us-west-2',
    temperature: 0.7,
    maxTokens: 500,
  });

  // Create an agent with the Bedrock model
  const agent = new Agent({
    model,
    name: 'Bedrock Example Agent',
    description: 'An agent powered by AWS Bedrock',
    systemPrompt: 'You are a helpful AI assistant powered by AWS Bedrock.',
  });

  try {
    // Test 1: Simple question
    console.log('Test 1: Simple question');
    console.log('User: What is AWS Bedrock?');
    console.log('---');
    
    const result1 = await agent.call('What is AWS Bedrock?');
    console.log('\n---');
    console.log(`Stop reason: ${result1.stopReason}`);
    console.log(`Tokens used: ${result1.metrics.totalTokens}`);
    console.log('\n');

    // Test 2: Multi-turn conversation
    console.log('Test 2: Multi-turn conversation');
    console.log('User: Can you explain it in simpler terms?');
    console.log('---');
    
    const result2 = await agent.call('Can you explain it in simpler terms?');
    console.log('\n---');
    console.log(`Stop reason: ${result2.stopReason}`);
    console.log(`Total messages in conversation: ${agent.messages.length}`);
    console.log('\n');

    // Test 3: Different model configuration
    console.log('Test 3: Using a different model');
    const novaModel = new BedrockModel({
      modelId: 'us.amazon.nova-pro-v1:0',
      temperature: 0.3,
      maxTokens: 200,
    });

    const novaAgent = new Agent({
      model: novaModel,
      name: 'Nova Agent',
      systemPrompt: 'You are a concise assistant. Keep responses brief.',
    });

    console.log('User: What is TypeScript in one sentence?');
    console.log('---');
    
    const result3 = await novaAgent.call('What is TypeScript in one sentence?');
    console.log('\n---');
    console.log(`Model used: ${novaModel.getConfig().modelId}`);
    console.log('\n');

    // Test 4: Streaming example
    console.log('Test 4: Streaming response');
    console.log('User: Count from 1 to 5 slowly');
    console.log('---');
    
    let streamedText = '';
    for await (const event of agent.streamAsync('Count from 1 to 5 slowly')) {
      if (event.delta) {
        streamedText += event.delta;
      }
    }
    console.log('\n---');
    console.log('Streaming complete!\n');

  } catch (error) {
    console.error('Error:', error);
    console.log('\nMake sure you have:');
    console.log('1. AWS credentials configured (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)');
    console.log('2. Access to Bedrock models in your AWS account');
    console.log('3. The correct AWS region set');
  } finally {
    agent.destroy();
  }
}

// Run the example
main().catch(console.error);