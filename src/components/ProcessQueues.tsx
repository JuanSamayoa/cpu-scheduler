import React from 'react';
import { FilePlus2, ListChecks, Cpu, CheckCircle2 } from 'lucide-react';
import { useSchedulerStore } from '../store/useSchedulerStore';
import type { Process } from '../engine/core/types';

interface QueueCardProps {
  title: string;
  icon: React.ReactNode;
  processes: Process[];
  highlight?: boolean;
}

const QueueCard: React.FC<QueueCardProps> = ({ title, icon, processes, highlight }) => (
  <div className={`queue-card ${highlight ? 'queue-highlight' : ''}`}>
    <div className="queue-title">
      <span className="queue-icon">{icon}</span>
      <span>{title}</span>
      <span className="queue-count">{processes.length}</span>
    </div>
    <div className="queue-chips">
      {processes.length === 0 ? (
        <span className="queue-empty">vacía</span>
      ) : (
        processes.map(p => (
          <div key={p.pid} className={`proc-chip proc-chip-animated ${p.state}`} style={{ borderColor: p.color, backgroundColor: `${p.color}15` }} data-pid={p.pid} data-state={p.state}>
            <span className="chip-pid" style={{ color: p.color }}>{p.name}</span>
            <span className="chip-burst">{p.remainingBurst}t</span>
          </div>
        ))
      )}
    </div>
  </div>
);

export const ProcessQueues: React.FC = () => {
  const { state, animation } = useSchedulerStore();
  const { newPool, readyQueue, running, terminated } = state;

  return (
    <div className="queues-wrapper">
      <div className="queues-header">
        <h2>Colas</h2>
        {animation.transitions.length > 0 && <span className="transition-badge">{animation.transitions.length} transiciones</span>}
      </div>
      <div className="queues-grid">
        <QueueCard title="Nuevos" icon={<FilePlus2 size={11} />} processes={newPool} />
        <QueueCard title="Listos" icon={<ListChecks size={11} />} processes={readyQueue} />
        <QueueCard title="CPU" icon={<Cpu size={11} />} processes={running ? [running] : []} highlight={!!running} />
        <QueueCard title="Terminados" icon={<CheckCircle2 size={11} />} processes={terminated} />
      </div>
    </div>
  );
};