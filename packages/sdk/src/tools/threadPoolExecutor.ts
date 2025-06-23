/**
 * Thread pool executor for parallel tool execution
 */

import { ParallelToolExecutorInterface } from '../types/eventLoop.js';
import { ToolResult } from '../types/tools.js';

export class ThreadPoolExecutorWrapper implements ParallelToolExecutorInterface {
  constructor(private maxWorkers: number = 4) {}

  async execute(
    tasks: Array<() => Promise<ToolResult>>
  ): Promise<ToolResult[]> {
    // For now, we'll use Promise.all for parallel execution
    // In a more sophisticated implementation, we could use worker threads
    // to truly parallelize CPU-intensive tasks
    
    // Limit concurrency
    const results: ToolResult[] = [];
    const executing: Promise<void>[] = [];
    
    for (const task of tasks) {
      const promise = task().then(result => {
        results.push(result);
      });
      
      executing.push(promise);
      
      if (executing.length >= this.maxWorkers) {
        await Promise.race(executing);
        // Remove completed promises
        executing.splice(0, executing.length, ...executing.filter(p => 
          p !== promise
        ));
      }
    }
    
    // Wait for all remaining tasks
    await Promise.all(executing);
    
    return results;
  }

  shutdown(wait: boolean = true): void {
    // No-op for now since we're not using actual worker threads
    console.log('Thread pool executor shutdown');
  }
}