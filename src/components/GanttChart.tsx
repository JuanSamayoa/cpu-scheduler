import React from 'react';
import { useSchedulerStore } from '../store/useSchedulerStore';

export const GanttChart: React.FC = () => {
  const { state } = useSchedulerStore();
  const ganttLog = state.ganttLog;
  
  const maxTime = Math.max(...ganttLog.map(e => e.endTime), 10);

  return (
    <div className="gantt-wrapper">
      <div className="gantt-header">
        <h2>Diagrama de Gantt</h2>
        <span className="gantt-time">t = {state.currentTime}</span>
      </div>
      <div className="gantt-container">
        <div className="gantt-timeline">
          {ganttLog.map((entry, i) => {
            const left = (entry.startTime / maxTime) * 100;
            const width = ((entry.endTime - entry.startTime) / maxTime) * 100;
            const isNew = i === ganttLog.length - 1;
            return (
              <div
                key={i}
                className={`gantt-block ${entry.pid === 'IDLE' ? 'gantt-idle' : ''} ${isNew ? 'gantt-new' : ''}`}
                style={{ 
                  left: `${left}%`, 
                  width: `${Math.max(width, 2)}%`, 
                  backgroundColor: entry.color 
                }}
                title={`${entry.name} [${entry.startTime}-${entry.endTime}]`}
              >
                {width > 8 && <span className="gantt-label">{entry.name}</span>}
              </div>
            );
          })}
        </div>
        <div className="gantt-axis">
          {Array.from({ length: maxTime + 1 }, (_, i) => (
            <span key={i} className="gantt-tick" style={{ left: `${(i / maxTime) * 100}%` }}>{i}</span>
          ))}
        </div>
      </div>
    </div>
  );
};