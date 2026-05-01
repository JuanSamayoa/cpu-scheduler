import type { Process } from '../models/Process';
import type { ISchedulerAlgorithm } from './FCFS';

export class SJFScheduler implements ISchedulerAlgorithm {
  selectNext(readyQueue: Process[]): Process | null {
    if (readyQueue.length === 0) return null;
    return [...readyQueue].sort((a, b) => {
      const diff = a.remainingBurst - b.remainingBurst;
      return diff !== 0 ? diff : a.arrivalTime - b.arrivalTime;
    })[0];
  }

  shouldPreempt(): boolean {
    return false;
  }
}