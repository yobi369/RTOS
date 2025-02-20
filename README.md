# Advanced Real-Time Operating System with RMS and EDF Scheduling

This project implements a professional-grade Real-Time Operating System (RTOS) with both Rate Monotonic Scheduling (RMS) and Earliest Deadline First (EDF) algorithms in JavaScript, including advanced features for resource management, task synchronization, and real-time monitoring.

## Features
- Dual scheduling algorithms: RMS and EDF
- Task management with priorities based on task periods or deadlines
- Resource management with priority inheritance protocol
- Task states (READY, RUNNING, BLOCKED, COMPLETED)
- Inter-task synchronization using shared resources
- Comprehensive statistics and monitoring
- Missed deadline detection and handling
- Dynamic task management at runtime
- Real-time monitoring dashboard
- Configuration via YAML file
- Environment-specific configurations (development, production, test)

## Usage
1. Clone the repository
2. Install Node.js (if not already installed)
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the RTOS:
   ```bash
   npm start
   ```
5. Access the monitoring dashboard at http://localhost:3000

## Configuration
The RTOS is configured via `config.yaml` with support for:
- Scheduler type (RMS or EDF)
- Task definitions (period, execution time, deadline)
- Shared resources
- Logging configuration
- Environment-specific overrides

Example configuration:
```yaml
scheduler:
  type: "edf"  # Options: "rate-monotonic" or "edf"

tasks:
  - id: "T1"
    period: 6
    executionTime: 2
    deadline: 6
  - id: "T2"
    period: 8
    executionTime: 2
    deadline: 8

resources:
  - id: "RESOURCE_A"
  - id: "RESOURCE_B"
```

## File Structure
- `main.js`: Main entry point with initialization and execution
- `task.js`: Base Task class implementation
- `edfTask.js`: EDF-specific Task implementation
- `scheduler.js`: Rate Monotonic Scheduler implementation
- `edfScheduler.js`: EDF Scheduler implementation
- `dashboard.js`: Monitoring dashboard implementation
- `config.js`: Configuration management
- `public/`: Frontend files for monitoring dashboard
- `tests/`: Unit tests for scheduler components
- `README.md`: Project documentation

## Monitoring Dashboard
The RTOS includes a real-time monitoring dashboard with:
- Task execution visualization
- Resource status tracking
- Execution statistics
- Historical data
- Real-time updates via WebSocket

Access the dashboard at http://localhost:3000

## License
MIT License
