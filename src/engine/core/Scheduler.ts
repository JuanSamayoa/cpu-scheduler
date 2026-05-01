import type { Process } from '../models/Process';
import type { GanttEntry } from '../models/GanttEntry';
import type { SimConfig, SchedulerState } from './types';
import { DEFAULT_CONFIG } from './types';
import { FCFSScheduler, SJFScheduler, RoundRobinScheduler } from '../algorithms';

export class Scheduler {
  private state: SchedulerState;
  private algorithm: FCFSScheduler | SJFScheduler | RoundRobinScheduler;
  private quantumUsed = 0;
  private idleCycles = 0;
  private activeCycles = 0;

  constructor(config: SimConfig = DEFAULT_CONFIG) {
    this.algorithm = this.buildAlgorithm(config);
    this.state = this.initialState(config);
  }

  private initialState(config: SimConfig): SchedulerState {
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

  private buildAlgorithm(config: SimConfig) {
    switch (config.algorithm) {
      case 'FCFS': return new FCFSScheduler();
      case 'SJF': return new SJFScheduler();
      case 'RR': return new RoundRobinScheduler(config.quantum);
    }
  }

  getState(): Readonly<SchedulerState> {
    return { ...this.state };
  }

  setConfig(config: Partial<SimConfig>) {
    this.state.config = { ...this.state.config, ...config };
    this.algorithm = this.buildAlgorithm(this.state.config);
    this.quantumUsed = 0;
  }

  injectProcess(p: Process) {
    this.state.newPool = [...this.state.newPool, p];
  }

  tick(): SchedulerState {
    const s = this.state;
    const t = s.currentTime;
    const cfg = s.config;
    const events: string[] = [];

    const admitted = s.newPool.filter(p => p.arrivalTime <= t);
    const remaining = s.newPool.filter(p => p.arrivalTime > t);
    admitted.forEach(p => { p.state = 'ready'; });
    s.readyQueue = [...s.readyQueue, ...admitted];
    s.newPool = remaining;

    if (s.running) {
      if (s.running.startTime === null) s.running.startTime = t;
      s.running.remainingBurst -= 1;
      this.quantumUsed += 1;

      if (s.running.remainingBurst <= 0) {
        s.running.state = 'terminated';
        s.running.completionTime = t + 1;
        s.running.turnaroundTime = s.running.completionTime - s.running.arrivalTime;
        s.running.waitingTime = s.running.turnaroundTime - s.running.burstTime;
        s.running.responseTime ??= (s.running.startTime ?? t) - s.running.arrivalTime;
        events.push(`✓ ${s.running.name} terminó`);
        s.terminated = [...s.terminated, s.running];
        s.running = null;
        this.quantumUsed = 0;
      } else if (cfg.algorithm === 'RR' && this.quantumUsed >= cfg.quantum) {
        s.running.state = 'ready';
        s.readyQueue = [...s.readyQueue, s.running];
        events.push(`⟳ Quantum agotado: ${s.running.name}`);
        s.running = null;
        this.quantumUsed = 0;
      }
    }

    if (!s.running && s.readyQueue.length > 0) {
      const next = this.algorithm.selectNext(s.readyQueue);
      if (next) {
        s.readyQueue = s.readyQueue.filter(p => p.pid !== next.pid);
        next.state = 'running';
        next.startTime ??= t;
        next.responseTime ??= t - next.arrivalTime;
        s.running = next;
        events.push(`▶ ${next.name} en CPU`);
      }
    }

    s.readyQueue.forEach(p => { p.waitingTime += 1; });

    const entry: GanttEntry = s.running
      ? { pid: s.running.pid, name: s.running.name, color: s.running.color, startTime: t, endTime: t + 1 }
      : { pid: 'IDLE', name: 'IDLE', color: '#374151', startTime: t, endTime: t + 1 };

    const last = s.ganttLog[s.ganttLog.length - 1];
    if (last?.pid === entry.pid) {
      last.endTime = entry.endTime;
    } else {
      s.ganttLog = [...s.ganttLog, entry];
    }

    if (entry.pid === 'IDLE') this.idleCycles++;
    else this.activeCycles++;
    const total = this.idleCycles + this.activeCycles;
    s.cpuUtilization = total > 0 ? Math.round((this.activeCycles / total) * 100) : 0;

    s.currentTime += 1;
    s.eventLog = [events.join(' | '), ...s.eventLog].slice(0, 50);
    this.state = { ...s };
    return this.getState();
  }

  reset(config: SimConfig) {
    this.quantumUsed = 0;
    this.idleCycles = 0;
    this.activeCycles = 0;
    this.algorithm = this.buildAlgorithm(config);
    this.state = this.initialState(config);
  }

  isFinished(): boolean {
    const s = this.state;
    return s.newPool.length === 0 && s.readyQueue.length === 0 && s.running === null;
  }
}