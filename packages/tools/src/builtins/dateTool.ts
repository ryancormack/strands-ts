/**
 * Built-in date and time tools
 */

import { tool } from '@strands/agent-sdk';

/**
 * Get the current date
 */
export const currentDate = tool({
  name: 'current_date',
  description: 'Get the current date. Returns the date in a human-readable format.',
  parameters: {
    type: 'object',
    properties: {
      timezone: {
        type: 'string',
        description: 'Timezone name (e.g., "America/New_York", "Europe/London"). If not provided, uses system timezone.'
      },
      format: {
        type: 'string',
        enum: ['short', 'long', 'iso'],
        description: 'Date format. "short" for MM/DD/YYYY, "long" for full date, "iso" for ISO 8601 format.'
      }
    },
    required: []
  }
}, async ({ timezone, format = 'long' }) => {
  try {
    const now = new Date();
    
    // Format options based on requested format
    let options: Intl.DateTimeFormatOptions;
    
    switch (format) {
      case 'short':
        options = { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          timeZone: timezone 
        };
        break;
      case 'iso':
        // For ISO format, we'll use toISOString() and handle timezone separately
        if (timezone) {
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
          const parts = formatter.formatToParts(now);
          const dateObj: any = {};
          parts.forEach(part => {
            if (part.type !== 'literal') {
              dateObj[part.type] = part.value;
            }
          });
          return `${dateObj.year}-${dateObj.month}-${dateObj.day}`;
        }
        return now.toISOString().split('T')[0];
      case 'long':
      default:
        options = { 
          weekday: 'long',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          timeZone: timezone 
        };
        break;
    }
    
    const formatter = new Intl.DateTimeFormat('en-US', options);
    return `Today's date is ${formatter.format(now)}`;
    
  } catch (error) {
    if (error instanceof RangeError && error.message.includes('time zone')) {
      return `Error: Invalid timezone "${timezone}". Please use a valid timezone like "America/New_York" or "Europe/London".`;
    }
    throw error;
  }
});

/**
 * Get the current time
 */
export const currentTime = tool({
  name: 'current_time', 
  description: 'Get the current time. Returns the time in a human-readable format.',
  parameters: {
    type: 'object',
    properties: {
      timezone: {
        type: 'string',
        description: 'Timezone name (e.g., "America/New_York", "Europe/London"). If not provided, uses system timezone.'
      },
      format: {
        type: 'string',
        enum: ['12h', '24h'],
        description: 'Time format. "12h" for 12-hour format with AM/PM, "24h" for 24-hour format.'
      }
    },
    required: []
  }
}, async ({ timezone, format = '12h' }) => {
  try {
    const now = new Date();
    
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: format === '12h',
      timeZone: timezone
    };
    
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const timeStr = formatter.format(now);
    
    // Add timezone info if specified
    let result = `The current time is ${timeStr}`;
    if (timezone) {
      result += ` in ${timezone}`;
    }
    
    return result;
    
  } catch (error) {
    if (error instanceof RangeError && error.message.includes('time zone')) {
      return `Error: Invalid timezone "${timezone}". Please use a valid timezone like "America/New_York" or "Europe/London".`;
    }
    throw error;
  }
});

/**
 * Get both current date and time
 */
export const currentDateTime = tool({
  name: 'current_datetime',
  description: 'Get the current date and time together. Returns both in a human-readable format.',
  parameters: {
    type: 'object',
    properties: {
      timezone: {
        type: 'string',
        description: 'Timezone name (e.g., "America/New_York", "Europe/London"). If not provided, uses system timezone.'
      }
    },
    required: []
  }
}, async ({ timezone }) => {
  try {
    const now = new Date();
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone
    };
    
    const formatter = new Intl.DateTimeFormat('en-US', options);
    let result = `It is currently ${formatter.format(now)}`;
    
    if (timezone) {
      result += ` in ${timezone}`;
    }
    
    return result;
    
  } catch (error) {
    if (error instanceof RangeError && error.message.includes('time zone')) {
      return `Error: Invalid timezone "${timezone}". Please use a valid timezone like "America/New_York" or "Europe/London".`;
    }
    throw error;
  }
});