# CPU Scheduler - Simulador de Planificación de Procesos

Aplicación gráfica e interactiva para simular algoritmos de planificación de procesos en sistemas operativos.

## Características

- **Algoritmos implementados**: FCFS, SJF, Round Robin
- **Estados de proceso**: Nuevo, Listo, Ejecución, Terminado
- **Visualización en tiempo real**:
  - Diagrama de Gantt animado
  - Colas de procesos
  - Métricas (WT, TAT, RT)
  - Bitácora de eventos

## Requisitos

- Node.js 18+
- pnpm (gestor de paquetes)

## Instalación

```bash
cd cpu-scheduler
pnpm install
```

## Ejecución

```bash
pnpm dev
```

## Estructura del Proyecto

```
src/
├── engine/                    # Motor lógico
│   ├── algorithms/           # Algoritmos de planificación
│   │   ├── FCFS.ts           # First Come First Served
│   │   ├── SJF.ts            # Shortest Job First
│   │   └── RoundRobin.ts     # Round Robin
│   ├── core/                 # Nucleo del scheduler
│   │   ├── Scheduler.ts      # Motor de simulación
│   │   └── types.ts          # Tipos y configuración
│   └── models/               # Modelos de datos
│       ├── Process.ts        # Entidad proceso
│       └── GanttEntry.ts     # Entrada del diagrama
├── store/                    # Gestión de estado (Zustand)
│   └── useSchedulerStore.ts  # Estado global + animaciones
├── components/               # Componentes UI
│   ├── ControlPanel.tsx      # Panel de control
│   ├── GanttChart.tsx        # Diagrama de Gantt
│   ├── ProcessQueues.tsx     # Visualización de colas
│   ├── MetricsTable.tsx      # Tabla de métricas
│   └── StepLog.tsx           # Bitácora de eventos
└── App.tsx                   # Componente principal
```

## Algoritmos

### FCFS (First Come First Served)
- Orden de llegada
- No apropiativo
- Favorece procesos largos

### SJF (Shortest Job First)
- Menor tiempo de burst primero
- No apropiativo
- Minimiza tiempo promedio de espera

### Round Robin
- Cola FIFO circular
- Quantum configurable (1-10)
- Apropiativo por tiempo

## Estados del Proceso

| Estado | Descripción |
|--------|-------------|
| Nuevo | Proceso creado, aún no cargado en memoria |
| Listo | Proceso en cola de espera, listo para ejecutar |
| Ejecución | Proceso usando la CPU |
| Terminado | Proceso completado |

## Métricas

- **WT (Waiting Time)**: Tiempo total en cola de listos
- **TAT (Turnaround Time)**: Tiempo desde llegada hasta terminación
- **RT (Response Time)**: Tiempo desde llegada hasta primera ejecución
- **CPU Utilization**: Porcentaje de uso de CPU