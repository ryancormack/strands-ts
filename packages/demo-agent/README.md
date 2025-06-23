# Strands Agent SDK Demo

This package contains demonstration agents built with the Strands Agent SDK, showcasing different capabilities and use cases.

## Prerequisites

- Node.js 20+
- pnpm
- AWS credentials configured (via AWS CLI, environment variables, or IAM role)
- Access to Claude 3 Sonnet model in AWS Bedrock

## Installation

From the workspace root:

```bash
pnpm install
```

The demo package uses pnpm workspace features to depend on the SDK. The first time you run a demo, it will automatically build the SDK.

## Running the Demos

### Interactive Demo Menu

Run all demos through an interactive menu:

```bash
pnpm run dev
```

### Individual Demos

You can also run specific demos directly:

```bash
# Basic conversational assistant
pnpm run assistant

# Weather information agent
pnpm run weather

# Calculator agent
pnpm run calculator
```

## Available Demos

### 1. Basic Assistant

A conversational AI assistant that demonstrates:
- Natural language conversation
- Built-in date and time tools
- Conversation history management
- Multi-turn interactions

**Example interactions:**
- "What is today's date?"
- "What time is it in Tokyo?"
- "How many days until New Year?"

### 2. Weather Agent

An agent with custom weather tools that shows:
- Creating custom function tools
- Tool composition (weather + date/time)
- Multi-parameter tools
- City weather comparisons

**Example interactions:**
- "What's the weather in New York?"
- "Compare weather between London and Tokyo"
- "Which city is warmest today?"

### 3. Calculator Agent

A mathematical assistant demonstrating:
- Multiple specialized tools
- Mathematical computations
- Error handling
- Complex calculations

**Example interactions:**
- "What is 25 * 4?"
- "Calculate the square root of 144"
- "What is 15% of 200?"
- "What is 2 to the power of 10?"

## Environment Variables

You can customize the agent behavior with these environment variables:

```bash
# AWS Bedrock Configuration
export AWS_REGION=us-west-2
export BEDROCK_MODEL_ID=us.anthropic.claude-3-7-sonnet-20250219-v1:0

# Run a demo with custom settings
AWS_REGION=eu-west-1 pnpm run assistant
```

## Creating Your Own Agent

Use these demos as templates for creating your own agents:

1. Import the SDK:
   ```typescript
   import { Agent, BedrockModel, tool } from '@strands/agent-sdk';
   ```

2. Create custom tools:
   ```typescript
   const myTool = tool({
     name: 'my_tool',
     description: 'What this tool does',
     parameters: {
       type: 'object',
       properties: {
         param1: { type: 'string', description: 'Parameter description' }
       },
       required: ['param1']
     }
   }, async ({ param1 }) => {
     // Tool implementation
     return `Result: ${param1}`;
   });
   ```

3. Create an agent:
   ```typescript
   const agent = new Agent({
     model: new BedrockModel(),
     tools: [myTool],
     systemPrompt: 'You are a helpful assistant...'
   });
   ```

4. Use the agent:
   ```typescript
   const result = await agent.call('User input here');
   ```

## Tips

- The agent automatically includes built-in date/time tools unless disabled
- Use `includeBuiltinTools: false` to exclude default tools
- Tools are automatically invoked based on the user's request
- The agent maintains conversation history for context
- Use `agent.messages = []` to clear conversation history
- Call `agent.destroy()` when done to clean up resources

## AWS Credentials

The demos require AWS credentials to access Bedrock. You can provide credentials in several ways:

1. **AWS CLI Configuration** (recommended):
   ```bash
   aws configure
   ```

2. **Environment Variables**:
   ```bash
   export AWS_ACCESS_KEY_ID=your-access-key
   export AWS_SECRET_ACCESS_KEY=your-secret-key
   export AWS_REGION=us-west-2
   ```

3. **AWS Profile**:
   ```bash
   export AWS_PROFILE=your-profile-name
   ```

4. **IAM Role** (for EC2/ECS/Lambda):
   The SDK will automatically use the instance role

## Troubleshooting

**AWS Credentials Error:**
If you see authentication errors, verify your credentials:
```bash
# Check current credentials
aws sts get-caller-identity

# Configure credentials
aws configure
```

**Model Access Error:**
Ensure you have access to Claude 3 Sonnet in your AWS account:
1. Go to AWS Bedrock console
2. Navigate to Model access
3. Request access to Anthropic Claude models

**Region Error:**
The default region is `us-west-2`. If you're using a different region:
```bash
export AWS_REGION=your-region
export BEDROCK_MODEL_ID=your-region.anthropic.claude-3-7-sonnet-20250219-v1:0
```