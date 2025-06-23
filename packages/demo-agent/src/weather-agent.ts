#!/usr/bin/env node
/**
 * Weather Agent Demo
 * 
 * This demo shows how to create custom tools for specific functionality.
 * The weather agent can provide weather information using mock data.
 */

import { Agent, BedrockModel, tool, type FunctionTool } from '@strands/agent-sdk';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

// Mock weather data
const weatherData: Record<string, any> = {
  'new york': { temp: 72, condition: 'Partly Cloudy', humidity: 65 },
  'london': { temp: 59, condition: 'Rainy', humidity: 80 },
  'tokyo': { temp: 77, condition: 'Clear', humidity: 55 },
  'paris': { temp: 64, condition: 'Cloudy', humidity: 70 },
  'sydney': { temp: 68, condition: 'Sunny', humidity: 45 },
};

// Create weather tools
const getWeather = tool({
  name: 'get_weather',
  description: 'Get current weather for a city',
  parameters: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: 'City name (e.g., "New York", "London")'
      }
    },
    required: ['city']
  }
}, async ({ city }) => {
  const normalizedCity = city.toLowerCase();
  const weather = weatherData[normalizedCity];
  
  if (!weather) {
    return `Weather data not available for ${city}. Available cities: ${Object.keys(weatherData).join(', ')}`;
  }
  
  return `Current weather in ${city}: ${weather.temp}°F, ${weather.condition}, Humidity: ${weather.humidity}%`;
});

const compareWeather = tool({
  name: 'compare_weather',
  description: 'Compare weather between two cities',
  parameters: {
    type: 'object',
    properties: {
      city1: {
        type: 'string',
        description: 'First city name'
      },
      city2: {
        type: 'string',
        description: 'Second city name'
      }
    },
    required: ['city1', 'city2']
  }
}, async ({ city1, city2 }) => {
  const weather1 = weatherData[city1.toLowerCase()];
  const weather2 = weatherData[city2.toLowerCase()];
  
  if (!weather1 || !weather2) {
    return 'Weather data not available for one or both cities';
  }
  
  const tempDiff = Math.abs(weather1.temp - weather2.temp);
  const warmer = weather1.temp > weather2.temp ? city1 : city2;
  
  return `Weather comparison:
- ${city1}: ${weather1.temp}°F, ${weather1.condition}
- ${city2}: ${weather2.temp}°F, ${weather2.condition}
${warmer} is warmer by ${tempDiff}°F`;
});

async function main() {
  console.log(`
🌤️  Weather Agent Demo
Ask me about weather in major cities!

Available cities: New York, London, Tokyo, Paris, Sydney
Type /exit to quit
`);

  // Create the agent with custom weather tools
  const agent = new Agent({
    model: new BedrockModel({
      modelId: process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
      region: process.env.AWS_REGION || 'us-west-2',
    }),
    tools: [getWeather, compareWeather],
    includeBuiltinTools: true, // Also include date/time tools
    systemPrompt: `You are a weather assistant. You can provide weather information for major cities.
Use the get_weather tool to check weather for a single city.
Use the compare_weather tool when users ask about weather in multiple cities.
You also have access to date and time tools if needed.`,
  });

  // Create readline interface
  const rl = readline.createInterface({ input, output });

  // Example interactions
  console.log(`
Example questions:
- What's the weather in New York?
- Compare the weather between London and Tokyo
- Which city is warmest today?
- What time is it in Paris?
`);

  // Main loop
  while (true) {
    try {
      const userInput = await rl.question('\nYou: ');
      
      if (userInput.trim() === '/exit' || userInput.trim() === '/quit') {
        console.log('Goodbye! ☀️');
        break;
      }

      console.log('\nWeather Agent: ');
      await agent.call(userInput);
      
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // Cleanup
  rl.close();
  agent.destroy();
}

// Run the weather agent
main().catch(console.error);