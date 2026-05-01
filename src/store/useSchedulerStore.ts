import { create } from 'zustand';
import { Scheduler } from '../engine/core/Scheduler';
import { DEFAULT_CONFIG, type SimConfig, type SchedulerState } from '../engine/core/types';
import { createProcess, resetPidCounter } from '../engine/models/Process';

export type TransitionType = 'admit' | 'dispatch' | 'preempt' | 'terminate' | 'quantum' | 'idle';

export interface ProcessTransition {
  pid: string;
  fromState: string;
  toState: string;
  timestamp: number;
  type: TransitionType;
}

export interface AnimationState {
  isAnimating: boolean;
  transitions: ProcessTransition[];
  contextSwitchPending: boolean;
  lastGantt: { pid: string; name: string; color: string; startTime: number; endTime: number } | null;
  transitionProgress: number;
}

interface SchedulerStore {
  scheduler: Scheduler;
  state: SchedulerState;
  running: boolean;
  speed: number;
  animation: AnimationState;
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  setAlgorithm: (a: 'FCFS' | 'SJF' | 'RR') => void;
  setConfig: (patch: Partial<SimConfig>) => void;
  setSpeed: (s: number) => void;
  injectProcess: (params: { arrivalTime: number; burstTime: number; priority?: number; name?: string; color?: string }) => void;
  injectRandomBatch: () => void;
  getAnimationState: () => AnimationState;
  clearTransitions: () => void;
}

let intervalId: ReturnType<typeof setInterval> | null = null;

const initialAnimationState: AnimationState = {
  isAnimating: false,
  transitions: [],
  contextSwitchPending: false,
  lastGantt: null,
  transitionProgress: 0,
};

export const useSchedulerStore = create<SchedulerStore>((set, get) => {
  const scheduler = new Scheduler(DEFAULT_CONFIG);

  const detectTransitions = (prevState: SchedulerState, newState: SchedulerState): ProcessTransition[] => {
    const transitions: ProcessTransition[] = [];
    const t = newState.currentTime;

    const prevRunning = prevState.running;
    const newRunning = newState.running;

    if (prevRunning && !newRunning && prevRunning.state === 'terminated') {
      transitions.push({ pid: prevRunning.pid, fromState: 'running', toState: 'terminated', timestamp: t, type: 'terminate' });
    }

    if (!prevRunning && newRunning) {
      transitions.push({ pid: newRunning.pid, fromState: 'ready', toState: 'running', timestamp: t, type: 'dispatch' });
    }

    if (prevRunning && newRunning && prevRunning.pid !== newRunning.pid) {
      transitions.push({ pid: prevRunning.pid, fromState: 'running', toState: 'ready', timestamp: t, type: 'preempt' });
      transitions.push({ pid: newRunning.pid, fromState: 'ready', toState: 'running', timestamp: t, type: 'dispatch' });
    }

    const admitted = newState.readyQueue.filter(np => !prevState.readyQueue.some(p => p.pid === np.pid));
    admitted.forEach(p => transitions.push({ pid: p.pid, fromState: 'new', toState: 'ready', timestamp: t, type: 'admit' }));

    const quantumExhausted = prevRunning && newRunning && prevRunning.pid === newRunning.pid && newState.eventLog[0]?.includes('Quantum');
    if (quantumExhausted) {
      transitions.push({ pid: prevRunning.pid, fromState: 'running', toState: 'ready', timestamp: t, type: 'quantum' });
    }

    if (!newRunning && prevState.readyQueue.length > 0 && newState.readyQueue.length === 0) {
      transitions.push({ pid: 'cpu', fromState: 'idle', toState: 'idle', timestamp: t, type: 'idle' });
    }

    return transitions;
  };

  return {
    scheduler,
    state: scheduler.getState(),
    running: false,
    speed: 700,
    animation: initialAnimationState,

    start: () => {
      if (get().running) return;
      set({ running: true, animation: { ...get().animation, isAnimating: true } });
      intervalId = setInterval(() => {
        const { scheduler, state } = get();
        if (scheduler.isFinished() && state.terminated.length > 0) {
          get().pause();
          return;
        }
        const newState = scheduler.tick();
        const transitions = detectTransitions(state, newState);
        const lastGantt = newState.ganttLog[newState.ganttLog.length - 1] ?? null;
        set({
          state: { ...newState },
          animation: { ...get().animation, transitions, lastGantt, transitionProgress: 1 }
        });
      }, get().speed);
    },

    pause: () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
      set({ running: false, animation: { ...get().animation, isAnimating: false } });
    },

    reset: () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
      resetPidCounter();
      const config = get().state.config;
      scheduler.reset(config);
      set({ running: false, state: { ...scheduler.getState() }, animation: initialAnimationState });
    },

    tick: () => {
      const { scheduler, state } = get();
      const newState = scheduler.tick();
      const transitions = detectTransitions(state, newState);
      const lastGantt = newState.ganttLog[newState.ganttLog.length - 1] ?? null;
      set({ state: { ...newState }, animation: { transitions, lastGantt, isAnimating: false, contextSwitchPending: false, transitionProgress: 1 } });
    },

    setAlgorithm: (algorithm: 'FCFS' | 'SJF' | 'RR') => {
      get().scheduler.setConfig({ algorithm });
      set({ state: { ...get().scheduler.getState() } });
    },

    setConfig: (patch: Partial<SimConfig>) => {
      get().scheduler.setConfig(patch);
      set({ state: { ...get().scheduler.getState() } });
    },

    setSpeed: (speed: number) => {
      set({ speed });
      const { running } = get();
      if (running) {
        get().pause();
        setTimeout(() => get().start(), 10);
      }
    },

    injectProcess: (params) => {
      const p = createProcess(params);
      get().scheduler.injectProcess(p);
      set({ state: { ...get().scheduler.getState() } });
    },

    injectRandomBatch: () => {
      const { scheduler, state } = get();
      const t = state.currentTime;
      const { batchBurstMin, batchBurstMax } = state.config;
      const BATCH = [
        { name: 'P1', color: '#6366f1' },
        { name: 'P2', color: '#10b981' },
        { name: 'P3', color: '#f59e0b' },
        { name: 'P4', color: '#ec4899' },
        { name: 'P5', color: '#8b5cf6' },
      ];
      BATCH.forEach((def, idx) => {
        const burst = batchBurstMin + Math.floor(Math.random() * (batchBurstMax - batchBurstMin + 1));
        const p = createProcess({ name: def.name, color: def.color, arrivalTime: t + idx, burstTime: burst });
        scheduler.injectProcess(p);
      });
      set({ state: { ...scheduler.getState() } });
    },

    getAnimationState: () => get().animation,

    clearTransitions: () => set({ animation: { ...get().animation, transitions: [] } }),
  };
});