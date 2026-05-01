import React, { useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useSchedulerStore } from '../store/useSchedulerStore';

export const StepLog: React.FC = () => {
  const { state, animation } = useSchedulerStore();
  const eventLog = state.eventLog;
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [eventLog.length]);

  return (
    <div className="steplog">
      <div className="steplog-header">
        <span className="steplog-title">Bitácora</span>
        <span className="steplog-count">{eventLog.length}</span>
      </div>

      {eventLog.length === 0 ? (
        <div className="steplog-empty">
          <Clock size={20} strokeWidth={1.5} />
          <span>Inicia la simulación para ver eventos.</span>
        </div>
      ) : (
        <div className="steplog-list" ref={listRef}>
          {eventLog.map((msg, i) => (
            <div key={i} className={`steplog-entry ${i === 0 ? 'steplog-entry-new' : ''} ${animation.transitions.length > 0 && i === 0 ? 'steplog-entry-animated' : ''}`}>
              <p className="steplog-msg">{msg || '—'}</p>
            </div>
          ))}
        </div>
      )}

      {animation.transitions.length > 0 && (
        <div className="steplog-transitions">
          {animation.transitions.map((t, i) => (
            <div key={i} className={`transition-flash transition-${t.type}`}>
              {t.type === 'dispatch' && '▶'}
              {t.type === 'terminate' && '✓'}
              {t.type === 'preempt' && '⟲'}
              {t.type === 'quantum' && '⟳'}
              {t.type === 'admit' && '+'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};