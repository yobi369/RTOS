const util = require('util');
const fs = require('fs');
const logFile = 'rtos_errors.log';

class RTOSError extends Error {
    constructor(message, code = 'RTOS_000') {
        super(message);
        this.name = 'RTOSError';
        this.code = code;
        this.timestamp = new Date().toISOString();
        this.logError();
    }

    logError() {
        const logEntry = `${this.timestamp} [${this.code}] ${this.name}: ${this.message}\n` +
                       `Stack Trace:\n${this.stack}\n\n`;
        fs.appendFileSync(logFile, logEntry, { flag: 'a' });
    }

    [util.inspect.custom]() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            timestamp: this.timestamp,
            stack: this.stack
        };
    }
}

class InvalidTaskError extends RTOSError {
    constructor(message, taskDetails = {}) {
        super(message, 'RTOS_101');
        this.name = 'InvalidTaskError';
        this.taskDetails = taskDetails;
    }
}

class DeadlineError extends RTOSError {
    constructor(message, taskId, deadline) {
        super(message, 'RTOS_102');
        this.name = 'DeadlineError';
        this.taskId = taskId;
        this.deadline = deadline;
    }
}

class AperiodicTaskError extends RTOSError {
    constructor(message) {
        super(message);
        this.name = 'AperiodicTaskError';
    }
}

class SchedulingError extends RTOSError {
    constructor(message, scheduleTime, taskId) {
        super(message, 'RTOS_103');
        this.name = 'SchedulingError';
        this.scheduleTime = scheduleTime;
        this.taskId = taskId;
    }
}

class ResourceConflictError extends RTOSError {
    constructor(message, resourceId, conflictingTasks = []) {
        super(message, 'RTOS_104');
        this.name = 'ResourceConflictError';
        this.resourceId = resourceId;
        this.conflictingTasks = conflictingTasks;
    }
}

class ValidationError extends RTOSError {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

module.exports = {
    RTOSError,
    InvalidTaskError,
    DeadlineError,
    AperiodicTaskError,
    SchedulingError,
    ResourceConflictError,
    ValidationError
};
