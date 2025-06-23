#!/bin/bash
# Quick test script for Bedrock integration

echo "Testing AWS Bedrock Integration..."
echo ""

# Check for AWS credentials
if [ -z "$AWS_ACCESS_KEY_ID" ] && [ ! -f ~/.aws/credentials ]; then
    echo "⚠️  Warning: AWS credentials not found!"
    echo "Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables"
    echo "or configure AWS CLI with 'aws configure'"
    echo ""
fi

# Check AWS region
if [ -z "$AWS_REGION" ]; then
    echo "ℹ️  AWS_REGION not set, will default to us-west-2"
    echo ""
fi

# Create a simple test file
cat > /tmp/bedrock-test.ts << 'EOF'
import { Agent, BedrockModel } from './src/index.js';

async function test() {
  try {
    const model = new BedrockModel({
      modelId: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
      maxTokens: 100,
    });

    const agent = new Agent({
      model,
      systemPrompt: 'You are a helpful assistant. Keep responses concise.',
    });

    console.log('🤖 Testing Bedrock connection...\n');
    const result = await agent.call('Say "Hello from Bedrock!" if you can hear me.');
    
    console.log('\n✅ Bedrock integration working!');
    console.log(`📊 Tokens used: ${result.metrics.totalTokens}`);
    
    agent.destroy();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Bedrock test failed:', error.message);
    process.exit(1);
  }
}

test();
EOF

# Run the test
echo "Running connection test..."
cd "$(dirname "$0")"
npx tsx /tmp/bedrock-test.ts

# Clean up
rm -f /tmp/bedrock-test.ts