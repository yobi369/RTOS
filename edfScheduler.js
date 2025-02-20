const RateMonotonicScheduler = require('./scheduler');
const { DeadlineError, AperiodicTaskError } = require('./error');

class EDFScheduler extends RateMonotonicScheduler {
    constructor() {
        super();
        this.aperiodicTasks = [];
    }

    addTask(task) {
        if (!task.deadline && !task.isAperiodic) {
            throw new DeadlineError('EDF scheduling requires tasks to have deadlines');
        }
        
        if (task.isAperiodic) {
            this.aperiodicTasks.push(task);
        } else {
            this.tasks.push(task);
            this.sortTasksByDeadline();
        }
    }

    sortTasksByDeadline() {
        this.tasks.sort((a, b) => {
            const aDeadline = a.getAbsoluteDeadline();
            const bDeadline = b.getAbsoluteDeadline();
            return aDeadline - bDeadline;
        });
    }

    getNextTask() {
        // First check for aperiodic tasks
        const aperiodicTask = this.aperiodicTasks.find(task => 
            task.isReady(this.currentTime) && !task.isBlocked()
        );
        if (aperiodicTask) {
            return aperiodicTask;
        }

        // Update task deadlines before selecting
        this.tasks.forEach(task => task.updateDeadline(this.currentTime));
        this.sortTasksByDeadline();

        // Find the earliest deadline task that's ready and not blocked
        for (const task of this.tasks) {
            if (task.isReady(this.currentTime) && !task.isBlocked()) {
                return task;
            }
        }
        return null;
    }

    executeCycle() {
        const task = this.getNextTask();
        if (task) {
            this.statistics.totalExecutionTime++;
            task.execute();
            if (task.isCompleted()) {
                task.reset();
                // Remove completed aperiodic tasks
                if (task.isAperiodic) {
                    this.aperiodicTasks = this.aperiodicTasks.filter(t => t !== task);
                }
            }
        } else {
            this.statistics.totalIdleTime++;
        }
    }
}

module.exports = EDFScheduler;
