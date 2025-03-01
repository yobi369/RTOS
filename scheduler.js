const { 
    SchedulingError, 
    ResourceConflictError,
    ValidationError 
} = require('./error');

class RateMonotonicScheduler {
    constructor() {
        this.tasks = [];
        this.resources = Object.create(null); // Using plain object instead of Map
        this.currentTask = null;
        this.history = [];
        this.statistics = {
            totalExecutionTime: 0,
            totalIdleTime: 0,
            totalMissedDeadlines: 0
        };
    }

    addResource(resourceId) {
        if (!resourceId || typeof resourceId !== 'string') {
            throw new ValidationError(
                'Resource ID must be a non-empty string',
                { resourceId }
            );
        }
        
        if (this.resources[resourceId]) {
            throw new ResourceConflictError(
                `Resource with ID ${resourceId} already exists`,
                resourceId,
                []
            );
        }
        
        this.resources[resourceId] = {
            id: resourceId,
            blockedTasks: []
        };
    }

    getResourceStatus() {
        return Object.values(this.resources).map(resource => ({
            id: resource.id,
            status: resource.blockedTasks.length > 0 ? 'Blocked' : 'Available',
            blockedTasks: [...resource.blockedTasks]
        }));
    }

    addTask(task) {
        if (!task || typeof task !== 'object') {
            throw new ValidationError(
                'Task must be a valid task object',
                { task }
            );
        }

        // Check for duplicate task IDs
        if (this.tasks.some(t => t.id === task.id)) {
            throw new SchedulingError(
                `Task with ID ${task.id} already exists`,
                Date.now(),
                task.id
            );
        }

        this.tasks.push(task);
        this.sortTasks();
    }

    removeTask(taskId) {
        if (!taskId || typeof taskId !== 'string') {
            throw new ValidationError(
                'Task ID must be a non-empty string',
                { taskId }
            );
        }

        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            throw new SchedulingError(
                `Task with ID ${taskId} not found`,
                Date.now(),
                taskId
            );
        }

        this.tasks.splice(taskIndex, 1);
    }

    schedule(currentTime) {
        if (typeof currentTime !== 'number' || currentTime < 0) {
            throw new ValidationError(
                'Current time must be a non-negative number',
                { currentTime }
            );
        }

        const readyTasks = this.getReadyTasks(currentTime);
        if (readyTasks.length === 0) {
            return null;
        }

        // Check if current task is still valid
        if (this.currentTask && 
            this.currentTask.isReady(currentTime) &&
            !this.currentTask.isCompleted()) {
            return this.currentTask;
        }

        const nextTask = readyTasks[0];
        this.currentTask = nextTask;
        this.history.push({
            time: currentTime,
            task: nextTask.id,
            action: 'scheduled'
        });
        return nextTask;
    }

    getReadyTasks(currentTime) {
        if (typeof currentTime !== 'number' || currentTime < 0) {
            throw new ValidationError(
                'Current time must be a non-negative number',
                { currentTime }
            );
        }

        return this.tasks
            .filter(task => task.isReady(currentTime))
            .sort((a, b) => a.period - b.period);
    }

    sortTasks() {
        this.tasks.sort((a, b) => a.period - b.period);
    }

    reset() {
        this.tasks = [];
        this.currentTask = null;
        this.history = [];
    }

    getTaskStatus(taskId) {
        if (!taskId || typeof taskId !== 'string') {
            throw new ValidationError(
                'Task ID must be a non-empty string',
                { taskId }
            );
        }

        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            throw new SchedulingError(
                `Task with ID ${taskId} not found`,
                Date.now(),
                taskId
            );
        }

        return task.getStatus();
    }

    getSchedulerStatus() {
        return {
            totalTasks: this.tasks.length,
            currentTask: this.currentTask ? this.currentTask.id : null,
            history: [...this.history],
            resources: this.getResourceStatus()
        };
    }

    run(duration) {
        if (typeof duration !== 'number' || duration <= 0) {
            throw new ValidationError(
                'Duration must be a positive number',
                { duration }
            );
        }

        for (let time = 0; time < duration; time++) {
            const task = this.schedule(time);
            if (task) {
                try {
                    task.execute(time);
                    if (task.isCompleted()) {
                        task.reset();
                    }
                } catch (error) {
                    console.error(`Error executing task ${task.id} at time ${time}:`, error);
                }
            }
        }
    }
}

module.exports = RateMonotonicScheduler;
