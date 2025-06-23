# Built-in Date Tools

The Strands TypeScript SDK includes built-in date and time tools that are automatically available to agents.

## Available Tools

### currentDate
Returns the current date in various formats.

**Parameters:**
- `timezone` (optional): Timezone name (e.g., "America/New_York", "Europe/London")
- `format` (optional): Date format - "short" (MM/DD/YYYY), "long" (full date), or "iso" (ISO 8601)

### currentTime
Returns the current time.

**Parameters:**
- `timezone` (optional): Timezone name
- `format` (optional): Time format - "12h" (with AM/PM) or "24h"

### currentDateTime
Returns both current date and time together.

**Parameters:**
- `timezone` (optional): Timezone name

## Usage Example

```typescript
import { Agent } from 'strands-agent-sdk';

const agent = new Agent();

// The date tools are automatically available
const response = await agent.call("What is today's date?");
// Agent will use the currentDate tool to answer

// You can also disable built-in tools if needed
const agentNoTools = new Agent({
  includeBuiltinTools: false
});
```

## Testing

To test the date tool functionality:

1. Run the REPL:
   ```bash
   npm run repl
   ```

2. Ask date-related questions:
   - "What is today's date?"
   - "What time is it?"
   - "What's the current date and time in Tokyo?"

The agent will automatically use the appropriate date tool to answer your questions.