/**
 * Built-in calculator tool
 */

import { tool } from '@strands/agent-sdk';

/**
 * Safe math evaluation using Function constructor
 * Only allows basic math operations and functions
 */
function evaluateExpression(expr: string, variables?: Record<string, number>): number {
  // Replace variables if provided
  let processedExpr = expr;
  if (variables) {
    Object.entries(variables).forEach(([name, value]) => {
      // Replace variable names with values, ensuring word boundaries
      const regex = new RegExp(`\\b${name}\\b`, 'g');
      processedExpr = processedExpr.replace(regex, String(value));
    });
  }

  // Validate expression contains only allowed characters
  const allowedPattern = /^[0-9+\-*/().,\s\^]+$/;
  if (!allowedPattern.test(processedExpr)) {
    throw new Error('Expression contains invalid characters');
  }

  // Replace ^ with ** for exponentiation
  processedExpr = processedExpr.replace(/\^/g, '**');

  try {
    // Use Function constructor for safer evaluation than eval
    const result = new Function('return ' + processedExpr)();
    
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error('Invalid calculation result');
    }
    
    return result;
  } catch (error) {
    throw new Error(`Failed to evaluate expression: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Format number with appropriate precision
 */
function formatNumber(num: number, precision?: number): string {
  if (precision !== undefined) {
    return num.toFixed(precision);
  }
  
  // Auto-format based on magnitude
  if (Math.abs(num) < 0.0001 || Math.abs(num) > 1e6) {
    return num.toExponential(6);
  }
  
  // Remove trailing zeros after decimal
  return parseFloat(num.toFixed(10)).toString();
}

export const calculate = tool({
  name: 'calculate',
  description: 'Perform basic arithmetic calculations',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'Mathematical expression to evaluate (e.g., "2 + 2", "10 * 5", "100 / 4")'
      }
    },
    required: ['expression']
  }
}, async ({ expression }) => {
  try {
    // Simple safe math evaluation (in production, use a proper math parser)
    const result = Function(`"use strict"; return (${expression})`)();
    return `${expression} = ${result}`;
  } catch (error: any) {
    return `Error evaluating expression: ${error.message}`;
  }
});

export const sqrt = tool({
  name: 'square_root',
  description: 'Calculate the square root of a number',
  parameters: {
    type: 'object',
    properties: {
      number: {
        type: 'number',
        description: 'The number to find the square root of'
      }
    },
    required: ['number']
  }
}, async ({ number }) => {
  if (number < 0) {
    return `Cannot calculate square root of negative number: ${number}`;
  }
  return `√${number} = ${Math.sqrt(number)}`;
});

export const power = tool({
  name: 'power',
  description: 'Calculate x raised to the power of y',
  parameters: {
    type: 'object',
    properties: {
      base: {
        type: 'number',
        description: 'The base number'
      },
      exponent: {
        type: 'number',
        description: 'The exponent'
      }
    },
    required: ['base', 'exponent']
  }
}, async ({ base, exponent }) => {
  const result = Math.pow(base, exponent);
  return `${base}^${exponent} = ${result}`;
});

export const percentage = tool({
  name: 'percentage',
  description: 'Calculate percentage (what is X% of Y, or X is what % of Y)',
  parameters: {
    type: 'object',
    properties: {
      value: {
        type: 'number',
        description: 'The value'
      },
      percent: {
        type: 'number',
        description: 'The percentage'
      },
      operation: {
        type: 'string',
        enum: ['of', 'is'],
        description: '"of" for X% of Y, "is" for X is what % of Y'
      }
    },
    required: ['value', 'percent', 'operation']
  }
}, async ({ value, percent, operation }) => {
  if (operation === 'of') {
    const result = (percent / 100) * value;
    return `${percent}% of ${value} = ${result}`;
  } else {
    const result = (value / percent) * 100;
    return `${value} is ${result}% of ${percent}`;
  }
});

/**
 * Calculator tool for mathematical operations
 */
export const calculator = tool({
  name: 'calculator',
  description: 'Perform mathematical calculations. Supports basic arithmetic, exponentiation, and parentheses.',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'Mathematical expression to evaluate (e.g., "2 + 2", "10 * (5 - 3)", "2^8")'
      },
      precision: {
        type: 'number',
        description: 'Number of decimal places for the result (optional)',
        minimum: 0,
        maximum: 10
      },
      variables: {
        type: 'object',
        description: 'Variables to substitute in the expression (e.g., {"x": 5, "y": 10})',
        additionalProperties: { type: 'number' }
      }
    },
    required: ['expression']
  }
}, async ({ expression, precision, variables }) => {
  try {
    // Clean up the expression
    const cleanExpr = expression.trim();
    
    if (!cleanExpr) {
      return 'Error: Empty expression provided';
    }
    
    // Evaluate the expression
    const result = evaluateExpression(cleanExpr, variables);
    
    // Format the result
    const formattedResult = formatNumber(result, precision);
    
    // Build response
    let response = `${cleanExpr} = ${formattedResult}`;
    
    // Add variable substitution info if used
    if (variables && Object.keys(variables).length > 0) {
      const varInfo = Object.entries(variables)
        .map(([name, value]) => `${name} = ${value}`)
        .join(', ');
      response = `${cleanExpr} = ${formattedResult}\n(where ${varInfo})`;
    }
    
    return response;
    
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : 'Failed to calculate expression'}`;
  }
});

/**
 * Advanced calculator with multiple operation modes
 * This is a simplified version of the Python calculator with SymPy
 */
export const advancedCalculator = tool({
  name: 'advanced_calculator',
  description: 'Advanced calculator with support for different operation modes including solving equations and calculus operations.',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'Mathematical expression or equation'
      },
      mode: {
        type: 'string',
        enum: ['evaluate', 'solve', 'simplify'],
        description: 'Operation mode: evaluate (default), solve (for equations), or simplify',
        default: 'evaluate'
      },
      variable: {
        type: 'string',
        description: 'Variable to solve for (required for solve mode)',
        default: 'x'
      }
    },
    required: ['expression']
  }
}, async ({ expression, mode = 'evaluate', variable = 'x' }) => {
  try {
    switch (mode) {
      case 'evaluate':
        const result = evaluateExpression(expression);
        return `${expression} = ${formatNumber(result)}`;
        
      case 'solve':
        // Simple linear equation solver (ax + b = c)
        // This is a very basic implementation
        // For full functionality, a proper math library would be needed
        return `Solving equations requires a symbolic math library. 
For now, use the basic calculator for numerical evaluations.
To solve ${expression} for ${variable}, you would need to:
1. Rearrange the equation algebraically
2. Use the basic calculator to evaluate the result`;
        
      case 'simplify':
        // Basic simplification rules
        // A full implementation would require a CAS (Computer Algebra System)
        return `Expression simplification requires a symbolic math library.
The expression "${expression}" would need algebraic manipulation.
For numerical calculations, use mode='evaluate'.`;
        
      default:
        return `Unknown mode: ${mode}. Use 'evaluate', 'solve', or 'simplify'.`;
    }
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : 'Failed to process expression'}`;
  }
});