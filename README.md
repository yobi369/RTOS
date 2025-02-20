# Advanced Real-Time Operating System with Rate Monotonic Scheduling

This project implements a professional-grade Real-Time Operating System (RTOS) with Rate Monotonic Scheduling (RMS) algorithm in JavaScript, including advanced features for resource management and task synchronization.

## Features
- Task management with priorities based on task periods
- Rate Monotonic Scheduling algorithm implementation
- Task execution simulation with CPU idle time tracking
- Resource management with priority inheritance protocol
- Task states (READY, RUNNING, BLOCKED, COMPLETED)
- Inter-task synchronization using shared resources
- Comprehensive statistics and monitoring
- Missed deadline detection and handling
- Dynamic task management at runtime

## Usage
1. Clone the repository
2. Install Node.js (if not already installed)
3. Run the RTOS:
   ```bash
   node main.js
   ```

## Advanced Configuration
The RTOS supports configuration of:
- Shared resources using `addResource(resourceId)`
- Task blocking/unblocking on resources
- Priority inheritance protocol for resource contention
- Detailed statistics collection

Example configuration:
```javascript
// Add shared resources
scheduler.addResource('RESOURCE_A');
scheduler.addResource('RESOURCE_B');

// Create and add tasks
const task1 = new Task(1, 6, 2);
scheduler.addTask(task1);

// Block task on resource
task1.block('RESOURCE_A');
```

## File Structure
- `main.js`: Main entry point with example scenarios
- `task.js`: Task class implementation with states and synchronization
- `scheduler.js`: Rate Monotonic Scheduler with resource management
- `README.md`: Project documentation

## Example Output
The program will output:
- Task execution sequence
- CPU idle times
- Resource contention handling
- Priority inheritance events
- Detailed statistics including:
  - Task execution counts
  - Missed deadlines
  - Resource utilization

## License
MIT License
