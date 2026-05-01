import React, { useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Shuffle, Plus, Cpu } from 'lucide-react';
import { useSchedulerStore } from '../store/useSchedulerStore';
import type { Algorithm } from '../engine/core/types';

const ALGORITHMS: { value: Algorithm; label: string; desc: string }[] = [
  { value: 'FCFS', label: 'FCFS', desc: 'First Come First Served' },
  { value: 'SJF',  label: 'SJF',  desc: 'Shortest Job First' },
  { value: 'RR',   label: 'RR',   desc: 'Round Robin' },
];

const SPEEDS = [
  { label: 'Lento',   ms: 1500 },
  { label: 'Normal',  ms: 700  },
  { label: 'Rápido',  ms: 200  },
  { label: 'Turbo',   ms: 50   },
];

export const ControlPanel: React.FC = () => {
  const { start, pause, reset, tick, running, speed, setSpeed, setAlgorithm, setConfig, injectProcess, injectRandomBatch, state } = useSchedulerStore();

  const config = state.config;
  const algo = config.algorithm;
  const selAlgo = ALGORITHMS.find(a => a.value === algo)!;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ arrivalTime: 0, burstTime: 4, name: '', color: '#6366f1' });

  const handleInject = () => {
    injectProcess({
      arrivalTime: Number(form.arrivalTime),
      burstTime: Math.max(1, Number(form.burstTime)),
      name: form.name || undefined,
      color: form.color,
    });
    setShowForm(false);
    setForm(f => ({ ...f, name: '' }));
  };

  return (
    <div className="cpanel">
      <div className="cpanel-algo">
        <div className="cpanel-algo-name">{selAlgo.label}</div>
        <p className="cpanel-algo-desc">{selAlgo.desc}</p>
      </div>

      <div className="cpanel-section">
        <p className="cpanel-section-label">Control</p>
        <div className="ctrl-grid">
          <button id="btn-start" className="btn btn-primary" onClick={start} disabled={running}>
            <Play size={13} /> Iniciar
          </button>
          <button id="btn-pause" className="btn btn-secondary" onClick={pause} disabled={!running}>
            <Pause size={13} /> Pausar
          </button>
          <button id="btn-step" className="btn btn-ghost" onClick={tick}>
            <SkipForward size={13} /> Paso
          </button>
          <button id="btn-reset" className="btn btn-danger" onClick={reset}>
            <RotateCcw size={13} /> Reset
          </button>
        </div>

        <div className="speed-row">
          <span className="speed-label">Velocidad</span>
          <div className="speed-btns">
            {SPEEDS.map(s => (
              <button key={s.ms} className={`speed-btn ${speed === s.ms ? 'speed-btn-on' : ''}`} onClick={() => setSpeed(s.ms)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="cpanel-section">
        <p className="cpanel-section-label">Algoritmo</p>
        <div className="algo-pills">
          {ALGORITHMS.map(a => (
            <button key={a.value} className={`algo-pill ${algo === a.value ? 'algo-pill-on' : ''}`} onClick={() => setAlgorithm(a.value)}>
              {a.label}
            </button>
          ))}
        </div>
        {algo === 'RR' && (
          <div className="param-row">
            <label className="param-label">Quantum <span className="param-val">{config.quantum}</span></label>
            <input type="range" min={1} max={10} value={config.quantum} onChange={e => setConfig({ quantum: Number(e.target.value) })} />
          </div>
        )}
      </div>

      <div className="cpanel-section">
        <p className="cpanel-section-label">Burst Aleatorio</p>
        <div className="param-row">
          <label className="param-label">Min <span className="param-val">{config.batchBurstMin}</span></label>
          <input type="range" min={1} max={8} value={config.batchBurstMin} onChange={e => setConfig({ batchBurstMin: Number(e.target.value) })} />
        </div>
        <div className="param-row">
          <label className="param-label">Max <span className="param-val">{config.batchBurstMax}</span></label>
          <input type="range" min={3} max={15} value={config.batchBurstMax} onChange={e => setConfig({ batchBurstMax: Number(e.target.value) })} />
        </div>
      </div>

      <div className="cpanel-section">
        <p className="cpanel-section-label">Procesos</p>
        <button id="btn-batch" className="btn btn-primary btn-full" onClick={injectRandomBatch}>
          <Shuffle size={13} /> Batch (5)
        </button>
        <button id="btn-add" className="btn btn-ghost btn-full" onClick={() => setShowForm(v => !v)}>
          <Plus size={13} /> {showForm ? 'Cancelar' : 'Manual'}
        </button>

        {showForm && (
          <div className="add-form">
            <div className="form-row">
              <div className="form-field">
                <label>Nombre</label>
                <input className="text-input" placeholder="P6" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-field form-field-sm">
                <label>Color</label>
                <input type="color" className="color-input" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Llegada</label>
                <input type="number" className="text-input" min={0} value={form.arrivalTime} onChange={e => setForm(f => ({ ...f, arrivalTime: Number(e.target.value) }))} />
              </div>
              <div className="form-field">
                <label>Burst</label>
                <input type="number" className="text-input" min={1} max={20} value={form.burstTime} onChange={e => setForm(f => ({ ...f, burstTime: Number(e.target.value) }))} />
              </div>
            </div>
            <button id="btn-inject" className="btn btn-primary btn-full" onClick={handleInject}>Agregar</button>
          </div>
        )}
      </div>

      <div className="quick-stats">
        <div className="qs-item">
          <span className="qs-val">{state.currentTime}</span>
          <span className="qs-lbl">Ciclo</span>
        </div>
        <div className="qs-item">
          <span className="qs-val">{state.cpuUtilization}%</span>
          <span className="qs-lbl">CPU</span>
        </div>
        <div className="qs-item">
          <span className="qs-val">{state.terminated.length}</span>
          <span className="qs-lbl">Term</span>
        </div>
        <div className="qs-item">
          <span className="qs-val qs-cpu-now">{state.running ? <Cpu size={14} /> : '—'}</span>
          <span className="qs-lbl">{state.running?.name ?? 'Idle'}</span>
        </div>
      </div>
    </div>
  );
};