import type { Process } from '../models/Process';
import type { ISchedulerAlgorithm } from './FCFS';

export class RoundRobinScheduler implements ISchedulerAlgorithm {
  quantum: number;

  constructor(quantum: number) {
    this.quantum = quantum;
  }

  selectNext(readyQueue: Process[]): Process | null {
    return readyQueue[0] ?? null;
  }

  shouldPreempt(): boolean {
    return true;
  }

  getQuantum(): number {
    return this.quantum;
  }
}