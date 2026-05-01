import type { Process, Algorithm } from '../models/Process';
import type { GanttEntry } from '../models/GanttEntry';

export type { Process, Algorithm };
export type { GanttEntry };

export interface SimConfig {
  algorithm: Algorithm;
  quantum: number;
  batchBurstMin: number;
  batchBurstMax: number;
}

export const DEFAULT_CONFIG: SimConfig = {
  algorithm: 'FCFS',
  quantum: 3,
  batchBurstMin: 3,
  batchBurstMax: 8,
};

export interface SchedulerState {
  currentTime: number;
  newPool: Process[];
  readyQueue: Process[];
  running: Process | null;
  terminated: Process[];
  ganttLog: GanttEntry[];
  cpuUtilization: number;
  config: SimConfig;
  eventLog: string[];
}