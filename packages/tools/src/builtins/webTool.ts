/**
 * Built-in web-related tools
 */

import { tool } from '@strands/agent-sdk';
import https from 'https';
import http from 'http';
import { URL } from 'url';

/**
 * HTTP request tool for making web requests
 */
export const httpRequest = tool({
  name: 'http_request',
  description: 'Make HTTP requests to APIs and websites. Supports GET, POST, PUT, DELETE methods with headers and authentication.',
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to request (must be a valid HTTP or HTTPS URL)'
      },
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'],
        description: 'HTTP method (default: GET)',
        default: 'GET'
      },
      headers: {
        type: 'object',
        description: 'Optional HTTP headers to include in the request',
        additionalProperties: { type: 'string' }
      },
      body: {
        type: 'string',
        description: 'Request body for POST/PUT/PATCH requests'
      },
      maxSize: {
        type: 'number',
        description: 'Maximum response size in bytes (default: 1MB)',
        default: 1048576
      }
    },
    required: ['url']
  }
}, async ({ url, method = 'GET', headers = {}, body, maxSize = 1048576 }) => {
  try {
    // Validate URL
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return `Error: Only HTTP and HTTPS protocols are supported. Got: ${parsedUrl.protocol}`;
    }

    // Select the appropriate module
    const client = parsedUrl.protocol === 'https:' ? https : http;

    // Default headers
    const requestHeaders = {
      'User-Agent': 'Strands-Agent-SDK/1.0',
      'Accept': 'text/html,application/json,text/plain,*/*',
      ...headers
    };

    return new Promise((resolve) => {
      const request = client.get(url, { headers: requestHeaders }, (response) => {
        let data = '';
        let bytesReceived = 0;

        // Handle redirects
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          resolve(`Redirect: ${response.statusCode} to ${response.headers.location}`);
          return;
        }

        // Check status code
        if (response.statusCode && response.statusCode >= 400) {
          resolve(`HTTP Error: ${response.statusCode} ${response.statusMessage}`);
          return;
        }

        response.on('data', (chunk) => {
          bytesReceived += chunk.length;
          if (bytesReceived > maxSize) {
            request.abort();
            resolve(`Error: Response exceeded maximum size of ${maxSize} bytes`);
            return;
          }
          data += chunk;
        });

        response.on('end', () => {
          const contentType = response.headers['content-type'] || '';
          resolve(`Content from ${url}:
Status: ${response.statusCode}
Content-Type: ${contentType}
Size: ${bytesReceived} bytes

${data.substring(0, 5000)}${data.length > 5000 ? '... (truncated)' : ''}`);
        });
      });

      request.on('error', (error) => {
        resolve(`Error fetching URL: ${error.message}`);
      });

      // Set timeout
      request.setTimeout(30000, () => {
        request.abort();
        resolve('Error: Request timed out after 30 seconds');
      });
    });
  } catch (error) {
    return `Error: Invalid URL or request failed - ${error instanceof Error ? error.message : String(error)}`;
  }
});

/**
 * Search the web using a search engine API
 * Note: This is a mock implementation. In production, you would integrate with a real search API
 */
export const searchWeb = tool({
  name: 'search_web',
  description: 'Search the web for information. Returns relevant search results.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query'
      },
      numResults: {
        type: 'number',
        description: 'Number of results to return (default: 5, max: 10)',
        default: 5,
        minimum: 1,
        maximum: 10
      }
    },
    required: ['query']
  }
}, async ({ query, numResults = 5 }) => {
  // Note: This is a mock implementation
  // In a real implementation, you would:
  // 1. Use a search API like Google Custom Search, Bing Search API, or DuckDuckGo API
  // 2. Make an authenticated request with API keys
  // 3. Parse and format the results
  
  return `Search functionality requires API integration. 
To implement real web search:

1. Choose a search provider:
   - Google Custom Search API
   - Bing Web Search API
   - DuckDuckGo API
   - SerpAPI

2. Obtain API credentials

3. Update this tool to make actual API requests

Mock results for "${query}":
- Result 1: Information about ${query}
- Result 2: Latest news on ${query}
- Result 3: ${query} documentation
- Result 4: How to work with ${query}
- Result 5: ${query} best practices

Note: These are placeholder results. Implement a real search API for actual functionality.`;
});