export type ProcessState = 'new' | 'ready' | 'running' | 'terminated';
export type Algorithm = 'FCFS' | 'SJF' | 'RR';

export interface Process {
  pid: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
  remainingBurst: number;
  priority: number;
  state: ProcessState;
  color: string;
  startTime: number | null;
  completionTime: number | null;
  waitingTime: number;
  turnaroundTime: number | null;
  responseTime: number | null;
}

let pidCounter = 1;
let paletteIdx = 0;

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

export function createProcess(params: {
  name?: string;
  arrivalTime: number;
  burstTime: number;
  priority?: number;
  color?: string;
}): Process {
  const pid = `P${pidCounter++}`;
  return {
    pid,
    name: params.name ?? pid,
    arrivalTime: params.arrivalTime,
    burstTime: params.burstTime,
    remainingBurst: params.burstTime,
    priority: params.priority ?? 1,
    state: 'new',
    color: params.color ?? PALETTE[paletteIdx++ % PALETTE.length],
    startTime: null,
    completionTime: null,
    waitingTime: 0,
    turnaroundTime: null,
    responseTime: null,
  };
}

export function resetPidCounter() {
  pidCounter = 1;
  paletteIdx = 0;
}