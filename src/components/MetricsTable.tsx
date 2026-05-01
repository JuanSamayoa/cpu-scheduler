import React from 'react';
import { Monitor, Clock3, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';
import { useSchedulerStore } from '../store/useSchedulerStore';
import type { Process } from '../engine/core/types';

const STATE_LABELS: Record<string, { label: string; cls: string }> = {
  new:        { label: 'Nuevo',      cls: 'badge-new' },
  ready:      { label: 'Listo',      cls: 'badge-ready' },
  running:    { label: 'CPU',        cls: 'badge-running' },
  terminated: { label: 'Terminado',  cls: 'badge-terminated' },
};

function fmt(n: number | null): string {
  if (n === null) return '—';
  return n.toFixed(0);
}

export const MetricsTable: React.FC = () => {
  const { state, animation } = useSchedulerStore();
  const { newPool, readyQueue, running, terminated, cpuUtilization } = state;

  const all: Process[] = [...newPool, ...readyQueue, ...(running ? [running] : []), ...terminated]
    .sort((a, b) => a.pid.localeCompare(b.pid, undefined, { numeric: true }));

  const terms = terminated;
  const avgWT = terms.length ? terms.reduce((s, p) => s + p.waitingTime, 0) / terms.length : null;
  const avgTAT = terms.length ? terms.reduce((s, p) => s + (p.turnaroundTime ?? 0), 0) / terms.length : null;
  const avgRT = terms.length ? terms.reduce((s, p) => s + (p.responseTime ?? 0), 0) / terms.length : null;

  return (
    <div className="metrics-wrapper">
      <div className="kpi-row">
        <div className="kpi-card">
          <Monitor size={14} strokeWidth={1.5} className="kpi-icon-svg" />
          <div className="kpi-value">{cpuUtilization}%</div>
          <div className="kpi-label">CPU</div>
          <div className="kpi-bar"><div className="kpi-bar-fill" style={{ width: `${cpuUtilization}%` }} /></div>
        </div>
        <div className="kpi-card">
          <Clock3 size={14} strokeWidth={1.5} className="kpi-icon-svg" />
          <div className="kpi-value">{avgWT !== null ? avgWT.toFixed(1) : '—'}</div>
          <div className="kpi-label">Espera</div>
        </div>
        <div className="kpi-card">
          <RefreshCw size={14} strokeWidth={1.5} className="kpi-icon-svg" />
          <div className="kpi-value">{avgTAT !== null ? avgTAT.toFixed(1) : '—'}</div>
          <div className="kpi-label">Retorno</div>
        </div>
        <div className="kpi-card">
          <Zap size={14} strokeWidth={1.5} className="kpi-icon-svg" />
          <div className="kpi-value">{avgRT !== null ? avgRT.toFixed(1) : '—'}</div>
          <div className="kpi-label">Respuesta</div>
        </div>
        <div className="kpi-card">
          <CheckCircle2 size={14} strokeWidth={1.5} className="kpi-icon-svg" />
          <div className="kpi-value">{terminated.length}</div>
          <div className="kpi-label">Terminados</div>
        </div>
      </div>

      <div className="table-container">
        <table className="metrics-table" id="metrics-table">
          <thead>
            <tr>
              <th>PID</th>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Llegada</th>
              <th>Burst</th>
              <th>Restante</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>WT</th>
              <th>TAT</th>
              <th>RT</th>
            </tr>
          </thead>
          <tbody>
            {all.map(p => {
              const badge = STATE_LABELS[p.state] ?? { label: p.state, cls: '' };
              return (
                <tr key={p.pid} className={`proc-row proc-row-${p.state} ${animation.transitions.some(t => t.pid === p.pid) ? 'proc-row-transition' : ''}`}>
                  <td><span className="pid-badge" style={{ backgroundColor: p.color }}>{p.pid}</span></td>
                  <td>{p.name}</td>
                  <td><span className={`state-badge ${badge.cls}`}>{badge.label}</span></td>
                  <td>{p.arrivalTime}</td>
                  <td>{p.burstTime}</td>
                  <td>
                    <div className="burst-bar">
                      <div className="burst-fill" style={{ width: `${(p.remainingBurst / p.burstTime) * 100}%`, backgroundColor: p.color }} />
                      <span className="burst-text">{p.remainingBurst}</span>
                    </div>
                  </td>
                  <td>{fmt(p.startTime)}</td>
                  <td>{fmt(p.completionTime)}</td>
                  <td className={p.state === 'terminated' ? 'metric-value' : ''}>{fmt(p.waitingTime > 0 ? p.waitingTime : null)}</td>
                  <td className={p.state === 'terminated' ? 'metric-value' : ''}>{fmt(p.turnaroundTime)}</td>
                  <td className={p.state === 'terminated' ? 'metric-value' : ''}>{fmt(p.responseTime)}</td>
                </tr>
              );
            })}
            {all.length === 0 && (
              <tr><td colSpan={11} className="table-empty">Sin procesos. Agrega uno desde el panel.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};