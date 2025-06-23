# Strands Tools

Built-in tools for the Strands Agent SDK, providing ready-to-use functionality for common tasks.

## Installation

```bash
npm install @strands/tools @strands/agent-sdk
# or
pnpm add @strands/tools @strands/agent-sdk
```

## Available Tools

### Date & Time Tools

- **currentDate** - Get the current date with timezone and format options
- **currentTime** - Get the current time with 12/24 hour format support  
- **currentDateTime** - Get both date and time together

### Web Tools

- **httpRequest** - Make HTTP requests with support for all methods, headers, and authentication
- **searchWeb** - Web search functionality (currently a mock implementation)

### Calculator Tools

- **calculator** - Basic arithmetic calculator with variable support
- **advancedCalculator** - Advanced mathematical operations (evaluate, solve, simplify)

## Usage

### Basic Usage

```typescript
import { Agent } from '@strands/agent-sdk';
import { currentDate, calculator, httpRequest } from '@strands/tools';

const agent = new Agent({
  tools: [currentDate, calculator, httpRequest]
});

// The agent can now use these tools
const response = await agent.call("What's today's date?");
```

### Using All Built-in Tools

```typescript
import { Agent } from '@strands/agent-sdk';
import { builtinTools } from '@strands/tools';

const agent = new Agent({
  tools: builtinTools
});
```

### Individual Tool Examples

#### Date/Time Tools

```typescript
import { currentDate, currentTime, currentDateTime } from '@strands/tools';

// Use with specific timezone
agent.tool.current_date({ timezone: 'America/New_York' });

// Get time in 24-hour format
agent.tool.current_time({ format: '24h' });
```

#### Calculator

```typescript
import { calculator } from '@strands/tools';

// Basic calculation
agent.tool.calculator({ expression: '2^10 + sqrt(144)' });

// With variables
agent.tool.calculator({ 
  expression: 'x^2 + y', 
  variables: { x: 5, y: 10 } 
});

// With precision
agent.tool.calculator({ 
  expression: '22/7', 
  precision: 5 
});
```

#### HTTP Requests

```typescript
import { httpRequest } from '@strands/tools';

// Simple GET request
agent.tool.http_request({ url: 'https://api.github.com' });

// POST with headers
agent.tool.http_request({
  url: 'https://api.example.com/data',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ key: 'value' })
});
```

## Tool Specifications

Each tool follows the Strands tool specification format:

```typescript
{
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}
```

## Creating Custom Tools

You can create your own tools using the `tool` function from the SDK:

```typescript
import { tool } from '@strands/agent-sdk';

const myTool = tool({
  name: 'my_custom_tool',
  description: 'Does something custom',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string', description: 'Input parameter' }
    },
    required: ['input']
  }
}, async ({ input }) => {
  // Tool implementation
  return `Processed: ${input}`;
});
```

## License

Apache-2.0