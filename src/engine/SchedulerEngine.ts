import type { Process, Algorithm } from './models/Process';
import type { GanttEntry } from './models/GanttEntry';

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

export interface EngineState {
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

export class SchedulerEngine {
  private state: EngineState;
  private quantumUsed = 0;
  private idleCycles = 0;
  private activeCycles = 0;

  constructor(config: SimConfig = DEFAULT_CONFIG) {
    this.state = this.initialState(config);
  }

  private initialState(config: SimConfig): EngineState {
    return {
      currentTime: 0,
      newPool: [],
      readyQueue: [],
      running: null,
      terminated: [],
      ganttLog: [],
      cpuUtilization: 0,
      config,
      eventLog: [],
    };
  }

  getState(): Readonly<EngineState> {
    return { ...this.state };
  }

  setConfig(config: Partial<SimConfig>) {
    this.state.config = { ...this.state.config, ...config };
  }

  injectProcess(p: Process) {
    this.state.newPool = [...this.state.newPool, p];
  }

  tick(): EngineState {
    const s = this.state;
    const t = s.currentTime;
    const cfg = s.config;
    const events: string[] = [];

    const newPoolAdmitted = s.newPool.filter(p => p.arrivalTime <= t);
    const remainingNew = s.newPool.filter(p => p.arrivalTime > t);
    
    for (const p of newPoolAdmitted) {
      p.state = 'ready';
    }
    
    s.readyQueue = [...s.readyQueue, ...newPoolAdmitted];
    s.newPool = remainingNew;

    if (s.running) {
      if (s.running.startTime === null) s.running.startTime = t;
      s.running.remainingBurst -= 1;
      this.quantumUsed += 1;

      if (s.running.remainingBurst <= 0) {
        s.running.state = 'terminated';
        s.running.completionTime = t + 1;
        s.running.turnaroundTime = s.running.completionTime! - s.running.arrivalTime;
        s.running.waitingTime = s.running.turnaroundTime! - s.running.burstTime;
        if (s.running.responseTime === null) {
          s.running.responseTime = (s.running.startTime ?? t) - s.running.arrivalTime;
        }
        events.push(`${s.running.name} terminó`);
        s.terminated = [...s.terminated, s.running];
        s.running = null;
        this.quantumUsed = 0;
      } else if (cfg.algorithm === 'RR' && this.quantumUsed >= cfg.quantum) {
        s.running.state = 'ready';
        s.readyQueue = [...s.readyQueue, s.running];
        events.push(`Quantum agotado para ${s.running.name}`);
        s.running = null;
        this.quantumUsed = 0;
      }
    }

    if (!s.running && s.readyQueue.length > 0) {
      const next = this.selectNext(s.readyQueue, s.running, t, cfg.algorithm);
      if (next) {
        s.readyQueue = s.readyQueue.filter(p => p.pid !== next.pid);
        next.state = 'running';
        if (next.startTime === null) next.startTime = t;
        if (next.responseTime === null) {
          next.responseTime = t - next.arrivalTime;
        }
        s.running = next;
      }
    }

    s.readyQueue.forEach(p => { p.waitingTime += 1; });

    const entry: GanttEntry = s.running
      ? { pid: s.running.pid, name: s.running.name, color: s.running.color, startTime: t, endTime: t + 1 }
      : { pid: 'IDLE', name: 'IDLE', color: '#374151', startTime: t, endTime: t + 1 };

    const last = s.ganttLog[s.ganttLog.length - 1];
    if (last && last.pid === entry.pid) {
      last.endTime = entry.endTime;
    } else {
      s.ganttLog = [...s.ganttLog, entry];
    }

    if (entry.pid === 'IDLE') this.idleCycles++;
    else this.activeCycles++;
    const total = this.idleCycles + this.activeCycles;
    s.cpuUtilization = total > 0 ? Math.round((this.activeCycles / total) * 100) : 0;

    s.currentTime += 1;
    s.eventLog = [events.join(', '), ...s.eventLog].slice(0, 50);
    this.state = { ...s };
    return this.getState();
  }

  private selectNext(queue: Process[], _running: Process | null, _t: number, algo: Algorithm): Process | null {
    if (queue.length === 0) return null;
    const sorted = [...queue];
    switch (algo) {
      case 'FCFS':
        return sorted.sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
      case 'SJF':
        return sorted.sort((a, b) => {
          const diff = a.remainingBurst - b.remainingBurst;
          return diff !== 0 ? diff : a.arrivalTime - b.arrivalTime;
        })[0];
      case 'RR':
        return queue[0];
    }
  }

  reset(config: SimConfig) {
    this.quantumUsed = 0;
    this.idleCycles = 0;
    this.activeCycles = 0;
    this.state = this.initialState(config);
  }

  isFinished(): boolean {
    const s = this.state;
    return s.newPool.length === 0 && s.readyQueue.length === 0 && s.running === null;
  }
}