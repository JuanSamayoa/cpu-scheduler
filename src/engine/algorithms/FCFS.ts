import type { Process } from '../models/Process';

export interface ISchedulerAlgorithm {
  selectNext(readyQueue: Process[]): Process | null;
  shouldPreempt(): boolean;
}

export class FCFSScheduler implements ISchedulerAlgorithm {
  selectNext(readyQueue: Process[]): Process | null {
    if (readyQueue.length === 0) return null;
    return [...readyQueue].sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
  }

  shouldPreempt(): boolean {
    return false;
  }
}