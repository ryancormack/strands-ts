/**
 * Built-in tools for Strands Agent
 */

// Date and time tools
export { currentDate, currentTime, currentDateTime } from './dateTool.js';

// Web tools
export { httpRequest, searchWeb } from './webTool.js';

// Calculator tools
export { calculator, advancedCalculator } from './calculatorTool.js';

// Export all as a collection
import { currentDate, currentTime, currentDateTime } from './dateTool.js';
import { httpRequest, searchWeb } from './webTool.js';
import { calculator, advancedCalculator } from './calculatorTool.js';

export const builtinTools = [
  // Date/time tools
  currentDate,
  currentTime,
  currentDateTime,
  // Web tools
  httpRequest,
  searchWeb,
  // Math tools
  calculator,
  advancedCalculator,
];