const { 
    InvalidTaskError, 
    ValidationError,
    ResourceConflictError,
    SchedulingError 
} = require('./error');
const util = require('util');

class Task {
    constructor(id, period, executionTime, deadline = null) {
        // Validate ID
        if (!id || typeof id !== 'string' || id.trim() === '') {
            throw new InvalidTaskError(
                'Task ID must be a non-empty string',
                { id, period, executionTime, deadline }
            );
        }
        
        // Validate period
        if (typeof period !== 'number' || period <= 0) {
            throw new InvalidTaskError(
                `Task period must be a positive number. Received: ${period}`,
                { id, period, executionTime, deadline }
            );
        }
        
        // Validate execution time
        if (typeof executionTime !== 'number' || executionTime <= 0) {
            throw new InvalidTaskError(
                `Task execution time must be a positive number. Received: ${executionTime}`,
                { id, period, executionTime, deadline }
            );
        }
        
        // Validate deadline if provided
        if (deadline !== null && (typeof deadline !== 'number' || deadline <= 0)) {
            throw new ValidationError(
                `Task deadline must be a positive number or null. Received: ${deadline}`,
                { id, period, executionTime, deadline }
            );
        }
        
        // Validate execution time vs period
        if (executionTime > period) {
            throw new SchedulingError(
                `Execution time (${executionTime}) cannot be greater than period (${period})`,
                Date.now(),
                id
            );
        }
        
        this.id = id;
        this.period = period;
        this.executionTime = executionTime;
        this.deadline = deadline;
        this.remainingTime = executionTime;
        this.startTime = 0;
        this.blocked = false;
        this.executionCount = 0;
        this.missedDeadlines = 0;
        this.lastExecutionTime = 0;
    }

    execute(currentTime) {
        // Validate currentTime
        if (typeof currentTime !== 'number' || currentTime < 0) {
            throw new ValidationError(
                `Current time must be a non-negative number. Received: ${currentTime}`,
                { currentTime, taskId: this.id }
            );
        }

        if (this.isBlocked()) {
            throw new ResourceConflictError(
                `Cannot execute a blocked task: ${this.id}`,
                this.blockedResource,
                [this.id]
            );
        }
        if (this.isCompleted()) {
            throw new SchedulingError(
                `Cannot execute a completed task: ${this.id}`,
                currentTime,
                this.id
            );
        }
        if (currentTime < this.startTime) {
            throw new SchedulingError(
                `Cannot execute task before its start time. Current: ${currentTime}, Start: ${this.startTime}`,
                currentTime,
                this.id
            );
        }
        
        this.remainingTime--;
        this.executionCount++;
        this.lastExecutionTime = currentTime;
    }

    isReady(currentTime) {
        if (typeof currentTime !== 'number' || currentTime < 0) {
            throw new ValidationError('Current time must be a non-negative number');
        }
        return currentTime >= this.startTime && !this.isBlocked();
    }

    isCompleted() {
        return this.remainingTime <= 0;
    }

    hasMissedDeadline(currentTime) {
        if (this.deadline === null) return false;
        return currentTime > this.deadline;
    }

    reset() {
        if (this.remainingTime > 0) {
            this.missedDeadlines++;
        }
        this.remainingTime = this.executionTime;
        this.startTime += this.period;
    }

    block(resourceId) {
        if (!resourceId || typeof resourceId !== 'string') {
            throw new ValidationError(
                `Resource ID must be a non-empty string. Received: ${resourceId}`,
                { resourceId, taskId: this.id }
            );
        }
        this.blocked = true;
        this.blockedResource = resourceId;
    }

    unblock() {
        if (!this.blocked) {
            throw new ResourceConflictError(
                `Task ${this.id} is not currently blocked`,
                this.blockedResource,
                [this.id]
            );
        }
        this.blocked = false;
        this.blockedResource = null;
    }

    isBlocked() {
        return this.blocked;
    }

    getStatus() {
        if (this.blocked) {
            return 'Blocked';
        }
        return this.remainingTime > 0 ? 'Running' : 'Completed';
    }
}

module.exports = Task;
