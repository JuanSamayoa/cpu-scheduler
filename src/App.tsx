import { Activity } from 'lucide-react';
import { ControlPanel } from './components/ControlPanel';
import { GanttChart } from './components/GanttChart';
import { MetricsTable } from './components/MetricsTable';
import { ProcessQueues } from './components/ProcessQueues';
import { StepLog } from './components/StepLog';
import { useSchedulerStore } from './store/useSchedulerStore';

const ALGO_LABELS = { FCFS: 'FCFS', SJF: 'SJF', RR: 'Round Robin' };

export default function App() {
  const { running, state } = useSchedulerStore();
  const { currentTime, cpuUtilization, terminated, running: runningProc, config } = state;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <Activity size={20} strokeWidth={1.8} className="brand-icon" />
          <div>
            <h1>CPU Scheduler</h1>
            <p className="brand-sub">Simulador de Planificación</p>
          </div>
        </div>

        <div className="header-meta">
          <div className={`status-chip ${running ? 'status-running' : 'status-paused'}`}>
            <span className="status-dot" />
            {running ? 'Simulando' : 'Pausado'}
          </div>

          <div className="header-kv">
            <span className="hkv-label">Algoritmo</span>
            <span className="hkv-val">{ALGO_LABELS[config.algorithm]}</span>
          </div>

          {config.algorithm === 'RR' && (
            <div className="header-kv">
              <span className="hkv-label">Quantum</span>
              <span className="hkv-val">Q = {config.quantum}</span>
            </div>
          )}

          <div className="header-kv">
            <span className="hkv-label">Ciclo</span>
            <span className="hkv-val hkv-mono">t = {currentTime}</span>
          </div>

          <div className="header-kv">
            <span className="hkv-label">CPU</span>
            <span className="hkv-val hkv-mono">{cpuUtilization}%</span>
          </div>

          {runningProc && (
            <div className="header-cpu">
              <span className="cpu-label">EN CPU</span>
              <span className="cpu-badge" style={{ backgroundColor: runningProc.color }}>
                {runningProc.name}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        <aside className="sidebar">
          <ControlPanel />
        </aside>

        <div className="content">
          <section className="section-card">
            <ProcessQueues />
          </section>

          <section className="section-card">
            <GanttChart />
          </section>

          <section className="section-card">
            <div className="section-heading">
              <h2>Métricas</h2>
              {terminated.length > 0 && (
                <span className="metrics-legend">WT = Espera · TAT = Retorno · RT = Respuesta</span>
              )}
            </div>
            <MetricsTable />
          </section>
        </div>

        <aside className="log-sidebar">
          <StepLog />
        </aside>
      </main>
    </div>
  );
}